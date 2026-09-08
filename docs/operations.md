# Operação: validação, monitoramento e recuperação

Este documento complementa o [runbook de produção](production-runbook.md).
Ele não contém URLs privadas, tokens, connection strings ou dados de clientes.

## Gate antes de deploy

O workflow [`Validate`](../.github/workflows/validate.yml) executa em todo pull
request e push para `main`:

- `npm ci`, lint, testes, build e auditoria npm do cliente;
- restore, build, testes e auditoria de dependências NuGet da API;
- um drill descartável PostgreSQL que cria backup em formato custom, restaura em
  outro banco e confirma o dado restaurado.

No repositório GitHub, proteger a branch `main` e exigir os checks **Frontend
checks**, **API checks** e **PostgreSQL backup and restore drill** antes do
merge. Vercel e Railway devem publicar produção somente a partir de `main`.
Essa configuração externa é o passo que transforma os checks em bloqueio real
de deploy; o workflow não publica nem recebe credenciais de produção.

Após cada deploy, executar manualmente o workflow
[`Post-deploy smoke`](../.github/workflows/post-deploy-smoke.yml), informando
as URLs públicas da Railway e Vercel. Ele exige liveness, readiness e resposta
HTTP do frontend, e registra o SHA verificado no resumo da execução. Registrar
os IDs de deploy da Vercel/Railway no release ou PR correspondente.

## Monitoramento

Configurar alertas nos provedores, sem usar polling contínuo de `/health/ready`:

| Serviço | Sinal | Ação ao alertar |
| --- | --- | --- |
| Railway | deploy falho, processo indisponível, erros repetidos e uso de recursos | verificar logs sem expor cookies/tokens; usar `/health/live` para processo e `/health/ready` apenas no smoke |
| Vercel | build/deploy falho, erros de função/rewrite e domínio/TLS | confirmar o deploy ligado ao SHA e testar a navegação pública |
| Neon | indisponibilidade, uso de armazenamento/compute e falhas de backup/PITR | preservar o incidente, criar branch de recuperação e iniciar o procedimento abaixo |
| GitHub Actions | falha do gate ou do drill de backup | bloquear promoção de `main` até corrigir ou aceitar formalmente o risco |

Revisar semanalmente os alertas e os deploys; revisar mensalmente capacidade e
retenção do Neon. O readiness abre conexão com o banco e não deve ser usado
como monitor periódico em serviços que podem suspender por inatividade.

## Backup e restauração

O Neon/PITR é a recuperação primária. Antes de uma alteração destrutiva, criar
uma branch ou restore point no painel Neon e registrar o horário, SHA e motivo.
Nunca restaurar diretamente sobre produção: recuperar primeiro em uma branch ou
projeto isolado, com uma credencial exclusiva e temporária.

Para um drill manual, em uma máquina confiável com `pg_dump`, `pg_restore` e
`psql`, exportar a origem e restaurar somente no destino descartável:

```bash
pg_dump --format=custom --no-owner --no-privileges --file hestia-recovery.dump "$SOURCE_DATABASE_URL"
pg_restore --no-owner --no-privileges --dbname "$RECOVERY_DATABASE_URL" hestia-recovery.dump
psql "$RECOVERY_DATABASE_URL" -v ON_ERROR_STOP=1 -c 'SELECT COUNT(*) FROM "__EFMigrationsHistory";'
```

`SOURCE_DATABASE_URL` e `RECOVERY_DATABASE_URL` pertencem ao cofre de secrets,
nunca a este repositório, ao shell history compartilhado ou aos logs do CI.
Verificar no destino: migrations presentes, contagem esperada de dados de teste,
`GET /health/ready=200` numa API temporária com migrations automáticas
desligadas, e um fluxo de leitura autenticado. Destruir o destino e revogar a
credencial temporária ao final.

Executar o drill completo ao menos trimestralmente e depois de migration com
risco de dados. Registrar data, SHA, duração, responsável, ponto de recuperação,
resultado e correções necessárias no canal operacional; não registrar dumps,
URLs, tokens ou dados financeiros. O drill automatizado do CI verifica a cadeia
`pg_dump`/`pg_restore`; ele não substitui a restauração real de um backup Neon.
