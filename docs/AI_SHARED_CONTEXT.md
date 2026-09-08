# Contexto compartilhado de IA

## Objetivo atual

Concluir os hardenings P0/P1 de segurança e confiabilidade já planejados e
validá-los primeiro em ambientes descartáveis e depois na infraestrutura ativa.

## Estado atual

- Arquitetura ativa: React/Vite na Vercel, rewrite `/api/*` para API ASP.NET
  Core na Railway e PostgreSQL no Neon. Brevo envia e-mails transacionais.
- Dados financeiros são isolados por `UserId`; autenticação usa JWT em cookie
  `HttpOnly`, CSRF para mutações, rate limit e auditoria de eventos sensíveis.
- O cliente HTTP tem prazo total de 30 segundos, retry único apenas para
  leituras após rede/`502`/`503`/`504` e nenhum reenvio automático de escrita.
  Falha após uma mutação informa resultado incerto.
- Senhas atuais e alteradas desde a migration `AddPasswordHistory` não podem
  ser reutilizadas no perfil ou recuperação. O token de recuperação continua
  válido após rejeição de senha reutilizada.
- `/health` e `/health/live` são liveness; `/health/ready` verifica conexão e
  migrations, com resposta genérica e prazo de cinco segundos.
- O dashboard público expõe no máximo 100 lançamentos dos últimos 12 meses.
  Cada item contém somente mês, categoria, valor e tipo; descrição, contas,
  tags, identificadores e recorrência não são retornados. A interface informa o
  recorte e não oferece histórico completo.
- Os workflows `Validate` e `Post-deploy smoke` estabelecem checks de frontend,
  API, auditorias e um drill descartável de `pg_dump`/`pg_restore`. Ainda é
  necessário configurar a proteção de `main`, alertas Railway/Vercel/Neon e
  executar o primeiro drill completo em uma recuperação Neon isolada.
- A documentação foi conciliada com o código: Data Protection já persiste no
  `AppDbContext`; importação tem limite de 500 itens e teste de 501, enquanto o
  limite do tamanho total do payload permanece pendente. A Etapa 0 de identidade
  foi concluída e a trilha Azure é somente histórica.

## Trabalho local aguardando revisão/commit

O worktree contém hardening de proxies ainda não commitado:

- `TrustedProxyConfiguration` lê `ReverseProxy:KnownProxies` e
  `ReverseProxy:KnownNetworks`, rejeita IP/CIDR inválido e redes `/0`, limita a
  um salto e desativa forwarded headers quando as duas listas estão vazias.
- `Program.cs` passou a usar essa configuração. Auditoria normaliza IPv4 mapeado
  como já faz a chave do rate limit.
- `appsettings.Production.json` mantém provisoriamente `100.0.0.0/8` por
  compatibilidade Railway; a faixa mínima e a cadeia Vercel → Railway ainda não
  foram confirmadas em produção.
- `TrustedProxyConfigurationTests` cobre peer não confiável, CIDR, cabeçalho
  forjado, IPv4 mapeado, auditoria e rate limit no middleware real.

Não sobrescreva esses arquivos sem revisar o diff atual.

## Decisões vigentes

- `Program.cs` é o ponto de composição de banco, autenticação, CORS, CSRF,
  rate limit, e-mail, health checks e configurações de proxy.
- A conexão de runtime Neon não recebe DDL. Migrations usam conexão administrativa
  separada e `Database__ApplyMigrationsOnStartup=true` apenas no deploy controlado.
- `/api` é o contrato de produção. `VITE_API_URL` é opcional, termina em `/api`
  e nunca contém segredo.
- A API só confia em headers encaminhados de peers configurados. Não habilitar
  `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true`, pois a aplicação rejeita esse modo.

## Verificação recente

- A suíte completa da API passou com 149 testes depois do hardening de proxies.
- As verificações focadas do cliente para timeout/retry, autenticação, i18n e
  redefinição de senha passaram; lint e build Vite também passaram.
- `git diff --check` passou após o último conjunto de alterações locais.
- Docker local estava indisponível nas últimas verificações; não houve teste
  atual contra PostgreSQL real nem deploy de qualquer alteração local.

## Pendências conhecidas

### Confirmadas e bloqueantes para encerrar os hardenings

- Aplicar e validar `AddPasswordHistory` em PostgreSQL real e no ambiente de
  produção, cobrindo perfil, recuperação e retry do mesmo token.
- Validar `/health/ready` com banco atualizado, migration pendente e banco
  indisponível em uma instância PostgreSQL descartável; repetir smoke na Railway.
- Confirmar a topologia e o IP efetivo pela Vercel e Railway. Só reduzir
  `100.0.0.0/8` com evidência da plataforma; testar headers forjados no endpoint
  público sem criar endpoint de diagnóstico permanente.
- Medir cold start real da Railway/Neon e revisar o prazo de 30 segundos se os
  dados exigirem; validar os estados visuais nos fluxos principais.

### Melhorias futuras que não bloqueiam o trabalho atual

- Domínio final, cookies/CORS/callbacks e autenticação Brevo com SPF/DKIM/DMARC.
- Webhook Brevo assinado, deduplicado e com retenção definida antes de ativar
  notificações financeiras.
- Locks concorrentes de conta demo/notificações contra Neon com duas instâncias.
- Monitoramento, backup e restauração documentados e testados.

## Próximo passo sugerido

Revisar e commitar o hardening de proxies como um incremento isolado. Em seguida,
usar ambiente descartável e a cadeia pública para validar os IPs observados antes
de alterar a faixa de produção. Só então seguir para locks concorrentes no Neon.

## Manutenção deste arquivo

Atualize-o antes de encerrar uma tarefa relevante. Mantenha somente decisões,
estado, evidências e pendências úteis agora; remova histórico de conversa e
itens resolvidos. Informação que se tornar estrutural deve ser consolidada em
`AGENTS.md` ou `architecture-decisions.md`.
