# Héstia — manual para agentes

## Início obrigatório

1. Leia este arquivo.
2. Leia `docs/AI_SHARED_CONTEXT.md`.
3. Inspecione o código, testes, configuração e histórico Git relacionados à tarefa.
4. Só então altere arquivos.

O código, os testes, a configuração efetiva e o Git são a fonte de verdade. O
contexto compartilhado acelera a retomada do trabalho, mas nunca substitui essa
verificação. Se ele contradizer o código, corrija-o ao concluir a tarefa.

## Produto e arquitetura

Héstia é uma aplicação de finanças pessoais: autenticação, conta demo,
transações, contas financeiras, metas, recorrências, parcelas, importação e
exportação, análises, auditoria e dashboard público somente leitura.

```text
client/ React + Vite -- /api/* rewrite --> Railway API -- EF Core --> Neon PostgreSQL
                                           |-- Brevo (e-mail transacional)
                                           `-- Pluggy (base para Open Finance)
```

- O frontend usa o caminho relativo `/api` em produção; `vercel.json` o encaminha
  à API Railway. `VITE_API_URL` é excepcional, público no bundle e deve terminar
  em `/api`.
- PostgreSQL é o banco de produção. SQL Server existe apenas para compatibilidade
  local e material histórico.
- A conexão de runtime é de privilégio mínimo. Migrations usam
  `ConnectionStrings__Migration` apenas em deploy controlado.
- A documentação operacional vigente é `docs/production-runbook.md`; os guias
  Azure são históricos.

## Estrutura relevante

| Caminho | Responsabilidade |
| --- | --- |
| `client/src/pages/` | Rotas e telas React |
| `client/src/components/` e `features/` | Componentes e fluxos reutilizáveis |
| `client/src/lib/api/` | Contrato HTTP, sessão, CSRF e chamadas da API |
| `client/src/i18n/` | PT-BR/EN e formatação localizada |
| `server/FinanceDashboard.Api/Controllers/` | Endpoints e autorização HTTP |
| `server/FinanceDashboard.Api/DTOs/` | Contratos de entrada e saída |
| `server/FinanceDashboard.Api/Services/` | Regras de domínio e integrações |
| `server/FinanceDashboard.Api/Data/` e `Models/` | EF Core, entidades e configuração do banco |
| `server/FinanceDashboard.Api/Migrations/` | Migrations PostgreSQL versionadas |
| `tests/FinanceDashboard.Api.Tests/` | Testes unitários e de integração HTTP da API |
| `docs/` | Runbook, decisões, roadmap, segurança e contexto compartilhado |

## Convenções de implementação

- Frontend: componentes funcionais em JSX, `useI18n()` para texto visível e
  testes Vitest/Testing Library próximos ao módulo. Atualize PT-BR e EN juntos.
- API: controllers ficam finos; regras e integrações pertencem a serviços; DTOs
  definem contratos. A composição de runtime fica em `Program.cs`.
- Dados financeiros sempre são limitados ao `UserId` autenticado. Verifique a
  propriedade de IDs relacionados antes de gravar e registre eventos sensíveis
  por `AuditLogService` sem incluir segredos ou dados financeiros excessivos.
- Alterações de esquema exigem modelagem EF, migration revisada e teste contra
  PostgreSQL antes do deploy. Nunca conceda DDL à conexão de runtime.
- Erros HTTP usam `ProblemDetails`; mantenha códigos e mensagens localizáveis
  consistentes entre API e cliente.
- Trabalhe em incrementos pequenos, com testes focados. Não misture refactors
  amplos com correções de segurança ou migrations.

## Comandos

```bash
# frontend
cd client && npm ci
cd client && npm run dev
cd client && npm run lint && npm test && npm run build
cd client && npm run test:e2e

# API e testes, a partir da raiz
dotnet restore finance-dashboard-react.sln
dotnet run --project server/FinanceDashboard.Api
dotnet test tests/FinanceDashboard.Api.Tests/FinanceDashboard.Api.Tests.csproj

# banco local SQL Server opcional
cd server && docker compose up -d

# migration local, com configuração válida do banco
dotnet ef database update --project server/FinanceDashboard.Api
```

Playwright inicia o Vite em `127.0.0.1:4173`. A API local usa
`http://localhost:5278`; o cliente aponta para `http://localhost:5278/api` em
desenvolvimento quando `VITE_API_URL` não foi definido.

## Segurança e operação

- Nunca versione ou imprima secrets, strings de conexão, JWTs, cookies, tokens
  de e-mail, payloads financeiros ou hashes de senha. Arquivos locais de ambiente
  e `appsettings.Development.local.json` são ignorados pelo Git.
- JWT fica em cookie `HttpOnly`; operações mutáveis usam antiforgery. Preserve
  CORS com origens explícitas, rate limiting e validação de versão da sessão.
- E-mail transacional usa Brevo atrás de `IEmailSender`; aceite do provedor não
  prova entrega. Notificações financeiras permanecem desativadas até existir
  worker/cron idempotente.
- `/health` e `/health/live` verificam processo; `/health/ready` verifica banco
  e migrations. Use readiness no smoke de banco, mas não o consulte em polling
  contínuo quando o banco possa suspender.
- Antes de qualquer deploy, siga o runbook. Para uma migration, habilite a
  aplicação controlada somente durante o deploy, confirme logs e volte a
  desabilitá-la.

## Colaboração entre agentes

- Antes de alteração significativa, confira `git status`, o contexto compartilhado
  e os arquivos que serão tocados. Preserve trabalho local alheio.
- Não presuma que outro chat conhece decisões que ficaram apenas no histórico.
  Registre no `docs/AI_SHARED_CONTEXT.md` o estado que um agente futuro precisa.
- Atualize `docs/architecture-decisions.md` quando uma decisão arquitetural se
  tornar estável. Mantenha este arquivo duradouro; não o use como diário.
- Evite editar o mesmo arquivo que outro agente em trabalho paralelo. Divida por
  módulo ou use branch/worktree; o contexto não substitui o controle do Git.
- Ao terminar uma mudança relevante, atualize o contexto compartilhado de forma
  concisa, remova pendências resolvidas e deixe o próximo passo verificável.
