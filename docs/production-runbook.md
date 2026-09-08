# Runbook de produção

Este documento descreve a operação atual do Héstia. Ele substitui o guia da
Azure como referência para deploys novos; o material Azure permanece apenas
como histórico em [`azure-deploy.md`](azure-deploy.md).

## Arquitetura ativa

```text
GitHub -> Vercel (React/Vite)
              |-- /api/* rewrite --> Railway (ASP.NET Core)
                                         |-- Neon PostgreSQL
                                         `-- Brevo API
```

- A Vercel publica o frontend e encaminha `/api/*` para a Railway conforme
  `vercel.json`.
- A Railway executa a API na porta indicada por `PORT`; o TLS termina no proxy
  da plataforma.
- O Neon guarda dados, migrations, outbox transacional e o key ring do ASP.NET
  Core Data Protection.
- A Brevo envia confirmação de e-mail e recuperação de senha. Notificações
  financeiras continuam desativadas.

## Variáveis por responsabilidade

Nunca registrar valores, connection strings, tokens ou chaves no Git, em logs
ou em capturas de tela.

| Responsabilidade | Variáveis esperadas na Railway |
| --- | --- |
| Banco de runtime | `Database__Provider=PostgreSql`, `ConnectionStrings__Default` |
| Migrations controladas | `ConnectionStrings__Migration`, `Database__ApplyMigrationsOnStartup` |
| Autenticação | `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience` |
| Origem confiável | `Cors__AllowedOrigins__0`, `Client__BaseUrl` |
| E-mail | `Email__Enabled`, `Email__Provider=Brevo`, `Brevo__ApiKey`, `Brevo__FromEmail`, `Brevo__FromName`, `Brevo__TimeoutSeconds` |
| Demo e notificações | `Demo__*`, `Notifications__Enabled=false` |
| Integração futura | `Pluggy__ClientId`, `Pluggy__ClientSecret` quando o recurso estiver habilitado |

A conexão de runtime não deve receber privilégios DDL. A conexão de
`Migration` é administrativa, exclusiva para aplicação controlada de schema e
não deve ser usada pela API durante a operação normal.

## Deploy rotineiro

1. Confirmar os checks obrigatórios do GitHub Actions e o drill de backup/
   restauração; não promover `main` se algum deles falhar.
2. Revisar o diff, executar testes proporcionais à alteração e confirmar que
   não há secrets no worktree.
3. Publicar o commit somente depois da revisão humana.
4. Confirmar o deploy correspondente na Vercel e na Railway.
5. Executar o workflow manual `Post-deploy smoke`, que verifica liveness,
   readiness e frontend; registrar o SHA e os IDs dos deploys aprovados.
6. Verificar `GET /health` (processo) e `GET /health/ready` (banco e migrations)
   na API pública e os logs de startup, sem copiar credenciais.
7. Executar um smoke do frontend: sessão, CSRF e uma rota autenticada.

## Deploy com migration

1. Confirmar que a migration foi revisada e testada contra PostgreSQL.
2. Salvar `ConnectionStrings__Migration` somente na Railway.
3. Definir temporariamente `Database__ApplyMigrationsOnStartup=true` e iniciar
   um deploy controlado.
4. Confirmar no log que migrations pendentes foram aplicadas com sucesso.
5. Voltar `Database__ApplyMigrationsOnStartup=false` e fazer o deploy normal.
6. Exigir `200` em `GET /health/ready` e verificar login, uma leitura autenticada
   e a tabela/fluxo afetado.

Não conceda DDL à conexão de runtime para contornar um bloqueio de migration.

## Proxies confiáveis e identidade de IP

`ReverseProxy__KnownProxies` aceita IPs exatos e
`ReverseProxy__KnownNetworks` aceita CIDRs, separados por `;`. São valores
escalares: a variável de ambiente substitui integralmente a lista do JSON.
Entradas inválidas, endereços wildcard e redes `/0` impedem o startup.
As duas listas vazias desativam forwarded headers; nunca significam confiar em
qualquer origem. Não definir `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true`:
a aplicação rejeita esse modo automático para evitar configurações conflitantes.

O arquivo base permite somente `127.0.0.1` e `::1`, para proxy local. O arquivo
`appsettings.Production.json` substitui esses peers por lista vazia e mantém
provisoriamente `100.0.0.0/8` como rede confiável. Em outra hospedagem, configurar
explicitamente os peers desse ambiente. Mudanças exigem reiniciar/reimplantar a API.

O middleware aceita `X-Forwarded-For` e `X-Forwarded-Proto` somente do peer
confiável, consumindo no máximo um salto, da direita para a esquerda. Não aceita
`X-Forwarded-Host` nem usa `X-Real-IP` diretamente. Auditoria e rate limit leem
apenas `Connection.RemoteIpAddress`, depois do middleware, normalizando IPv4 mapeado.

Pesquisa em 2026-09-08: o [guia oficial de React/Caddy da Railway](https://docs.railway.com/guides/react)
ainda exemplifica `100.0.0.0/8`; isso não confirma uma faixa menor estável. A
[referência de headers](https://docs.railway.com/networking/public-networking/specs-and-limits)
lista `X-Real-IP` e `X-Forwarded-Proto`. Por isso a troca de header ou aumento de
saltos fica condicionada à validação da topologia efetiva, não a uma suposição.

Antes de fechar esse hardening, conferir em ambiente controlado o peer visto
antes do middleware e o IP efetivo após ele, passando diretamente pela Railway
e pela Vercel. Comparar clientes distintos e requisições com headers forjados;
a aplicação não pode aceitar identidade arbitrária nem agrupar todos os usuários
no IP de um proxy intermediário. Não criar endpoint público de diagnóstico nem
registrar cookies, tokens ou payloads. Remover diagnóstico temporário após o teste.

A redução do CIDR, a validação dos headers no edge e o smoke de HTTPS, cookies e
rate limit continuam pendentes. Não substituir `/8` por `/10` sem confirmação
nem liberar todos os proxies para corrigir redirecionamentos.

## Liveness e readiness

| Rota | O que verifica | Resposta |
| --- | --- | --- |
| `GET /health` ou `/health/live` | Processo HTTP, sem consultar banco ou sessão | `200`, `{"status":"ok"}` |
| `GET /health/ready` | Acesso ao banco de runtime e presença de todas as migrations desta API | `200`, `{"status":"ready"}` ou `503`, `{"status":"not_ready"}` |

As respostas não são cacheadas nem expõem conexão, nomes de migrations ou
exceções. O readiness recebe cancelamento após 5 segundos e respeita o rate
limit global (excesso pode retornar `429`); somente liveness fica isento.
As rotas de saúde não validam JWT/cookies, pois essa validação acessa o banco.

Usar liveness para verificar o processo e readiness no smoke e na aprovação do
deploy. Não reiniciar o processo apenas porque o banco está temporariamente
indisponível. A configuração externa do healthcheck Railway não foi alterada.
Evitar polling contínuo de readiness em ambientes que precisam suspender o
banco por inatividade: a checagem abre conexão com o banco.

A role de runtime precisa poder ler `__EFMigrationsHistory`, além das permissões
normais da aplicação. Não precisa de DDL. A checagem não aplica migrations nem
confere drift manual de tabelas/colunas, permissões de escrita, Brevo ou Pluggy;
esses pontos continuam dependendo dos smokes específicos. Migrations adicionais
no banco são aceitas para permitir rollback da API, mas não provam compatibilidade
com alterações destrutivas. O histórico esperado é o PostgreSQL versionado;
a configuração local legada SQL Server não é critério de prontidão da produção.

Validação pendente em PostgreSQL/Docker e produção: banco atualizado retorna
`200`; banco vazio ou sem a migration mais recente retorna `503`; banco desligado
retorna `503` no readiness enquanto liveness continua `200`. Repetir com cookie
de sessão para confirmar a independência da autenticação. Não remover migrations
nem desligar o banco de produção para esse teste: usar uma instância descartável.

## Deploy do histórico de senhas

A migration `AddPasswordHistory` deve ser aplicada antes da API que consulta o
histórico. Ela cria uma tabela de hashes por usuário, com exclusão em cascata;
não recupera senhas sobrescritas anteriormente. A senha atual é sempre comparada
e arquivada quando uma alteração é aceita. O histórico não é truncado.

No smoke controlado, alterar A para B e tentar voltar para A pelo perfil e pela
recuperação. Ambos devem retornar `PASSWORD_REUSED`; na recuperação, o mesmo
token deve continuar válido para uma senha inédita. Confirmar que uma rejeição
não invalida sessões nem gera evento de sucesso. Não registrar senhas ou hashes.

Em rollback da API, preservar a tabela; remover o histórico elimina a proteção
contra reutilização dessas senhas. Uma versão antiga da API não impõe a regra.

## E-mail transacional

O provedor ativo é a Brevo por HTTPS. Aceite da API (`201`) não é sinônimo de
entrega: conferir o log transacional da Brevo para `Delivered`, bounce,
suppression ou bloqueio. A validação manual atual confirmou confirmação,
recuperação, reenvio limitado e entrega em múltiplas caixas postais; a
latência observada pode ocorrer depois do aceite do provedor.

Após alterar e-mail, validar:

1. cadastro e confirmação pelo link mais recente;
2. reenvio respeitando o rate limit;
3. recuperação e troca de senha;
4. status `Delivered` no painel Brevo;
5. ausência de tokens, mensagens e chaves nos logs.

O domínio próprio ainda exige SPF, DKIM, DMARC e webhook assinado. A ordem e
os itens pendentes estão no [roadmap de e-mail](EMAIL_DELIVERY_ROADMAP.md).

## Espera do frontend e cold start

O cliente HTTP usa prazo total de 30 segundos por operação, contando obtenção
de CSRF, eventual renovação de CSRF, retry e leitura do corpo. Leituras repetem
uma vez após falha de rede ou HTTP `502/503/504`, aguardando 1 segundo dentro
desse prazo. `429` não é repetido automaticamente.

Gravações não repetem automaticamente após timeout, falha de rede ou `5xx`.
A exceção de retry existente é `INVALID_CSRF_TOKEN`: a API rejeitou a operação
antes de executar o controller, então o cliente renova o token uma única vez.
Quando uma gravação perde sua resposta, a interface pede conferir o resultado
antes de tentar novamente. Cancelar a espera no navegador não garante rollback
no servidor. A sessão local permanece preservada em timeout/falha de rede.

Smoke pendente em produção: testar uma leitura após inatividade, confirmar o
estado de espera, o encerramento após timeout e uma gravação com resposta
interrompida. Conferir os dados antes de reenviar; medir API e banco quentes e
adormecidos antes de ajustar o prazo. Não registrar payloads nem tokens.

## Alertas conhecidos

- `libgssapi_krb5.so.2` ausente na imagem: não bloqueou a conexão atual por
  credencial. Investigar somente se autenticação GSSAPI/Kerberos ou falhas de
  banco relacionadas forem introduzidas.
- `Failed to determine the https port for redirect`: a Railway termina TLS no
  proxy. O healthcheck HTTPS atual funciona; revisar forwarded headers ou
  redirecionamento se houver loop, URL HTTP ou falha de cookies.

## Rollback

Para um deploy de aplicação sem migration, restaurar a versão anterior na
Vercel e Railway e repetir os smokes. Para migrations, preparar antes uma
migration de reversão revisada; não alterar dados nem executar rollback de
schema destrutivo sob pressão. O histórico de rebranding e limites da antiga
janela de rollback está em
[`HESTIA_TRANSITION_ROADMAP.md`](HESTIA_TRANSITION_ROADMAP.md).
