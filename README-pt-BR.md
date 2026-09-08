# Héstia

[English](README.md) · Português

Héstia é uma aplicação de finanças pessoais para organizar movimentações, acompanhar compromissos e entender como o dinheiro é distribuído ao longo do tempo. Reúne contas, receitas, despesas, metas e análises em um mesmo fluxo: registrar ou importar lançamentos, revisar os dados e usá-los para planejar os próximos meses.

O projeto combina uma interface React com uma API ASP.NET Core e persistência em PostgreSQL. O foco atual é consolidar a experiência financeira e validar segurança e confiabilidade na infraestrutura de produção.

## O que você pode fazer

- **Organizar o dia a dia:** cadastrar contas financeiras e lançamentos, classificar por categoria e tags, filtrar por período e conta e acompanhar receitas, despesas e saldo.
- **Planejar compromissos:** registrar recorrências e parcelamentos e definir metas mensais gerais ou por categoria.
- **Analisar o histórico:** consultar gráficos, comparações entre períodos e indicadores calculados a partir das transações.
- **Trazer e levar seus dados:** importar CSV/OFX com revisão antes da gravação e exportar informações financeiras.
- **Compartilhar um recorte:** gerar um link revogável de painel somente leitura. A API limita o compartilhamento a até 100 lançamentos dos últimos 12 meses, com mês, categoria, valor e tipo, sem descrições, contas ou tags.
- **Explorar e personalizar:** usar uma conta demo, alternar temas claro/escuro e navegar em português ou inglês, com interface adaptada para desktop e celular.

O acesso inclui cadastro, confirmação de e-mail, recuperação de senha e histórico de auditoria para ações sensíveis. A Brevo atende aos e-mails de autenticação. Alertas financeiros e resumos automáticos permanecem desativados; a integração Pluggy tem uma base de backend, enquanto Telegram, WhatsApp e agentes de IA estão planejados e ainda não implementados.

## Como o projeto funciona

```text
React/Vite na Vercel
        │ /api/*
        ▼
API ASP.NET Core na Railway
        ├── EF Core → PostgreSQL no Neon
        └── Brevo → e-mails de autenticação
```

O frontend usa `/api` em produção, encaminhado à Railway pelo [vercel.json](vercel.json). A API concentra validação, regras financeiras e autorização: os dados e IDs relacionados são verificados contra o `UserId` autenticado antes de operações de escrita.

A autenticação usa JWT em cookie `HttpOnly`, proteção CSRF nas mutações e validação da versão da sessão no banco. A implementação também inclui rate limiting, histórico de hashes para impedir reutilização de senhas e auditoria. O cliente HTTP limita a espera a 30 segundos e restringe repetições após falhas transitórias a leituras. Esses controles têm testes automatizados; as validações operacionais pendentes estão no [checklist de segurança](docs/security-hardening-checklist.md).

| Camada | Tecnologias e código |
| --- | --- |
| Interface | React 19, Vite, React Router, Bootstrap, Recharts e i18next — `client/` |
| API e dados | ASP.NET Core 10, EF Core e PostgreSQL — `server/FinanceDashboard.Api/` |
| Testes | Vitest, Testing Library e Playwright no cliente; xUnit e testes HTTP em `tests/FinanceDashboard.Api.Tests/` |
| Operação | Vercel, Railway e Neon; workflows de validação e smoke em `.github/workflows/` |

## Executar localmente

Você precisa de Node.js 22, SDK .NET 10, PostgreSQL e da ferramenta `dotnet-ef` 10. Os comandos abaixo partem da raiz do repositório.

**1. Configure a API e um banco PostgreSQL local.** Copie o [exemplo de configuração](server/FinanceDashboard.Api/appsettings.Development.local.example.json) para `appsettings.Development.local.json`, na mesma pasta. Esse arquivo é ignorado pelo Git. O exemplo ainda usa SQL Server: altere `Database:Provider` para `PostgreSql` e `ConnectionStrings:Default` para a conexão local, no formato `Host=…;Database=…;Username=…;Password=…`.

Defina uma chave JWT própria com pelo menos 32 caracteres e mantenha `Client:BaseUrl` e a origem CORS em `http://localhost:5173`. E-mail e notificações podem permanecer desativados para explorar a conta demo; o fluxo completo de cadastro por e-mail exige configurar o provedor. Não versione credenciais.

**2. Aplique as migrations e inicie a API.** Antes de executar o EF, defina `ConnectionStrings__Default` no terminal com a conexão do banco local. A factory de migrations lê essa variável, não o arquivo JSON local.

```bash
dotnet restore finance-dashboard-react.sln
dotnet ef database update --project server/FinanceDashboard.Api
dotnet run --project server/FinanceDashboard.Api
```

A API usa `http://localhost:5278`. `/health` verifica o processo; `/health/ready` verifica conexão e migrations. SQL Server permanece como compatibilidade local legada; as migrations versionadas são PostgreSQL.

**3. Em outro terminal, inicie o frontend.**

```bash
cd client
npm ci
npm run dev
```

Abra `http://localhost:5173`. Em desenvolvimento, o cliente chama `http://localhost:5278/api`. Só defina `VITE_API_URL` para apontar a outra API; seu valor é público e deve terminar em `/api`.

## Verificar alterações

A partir da raiz:

```bash
dotnet test tests/FinanceDashboard.Api.Tests/FinanceDashboard.Api.Tests.csproj
npm --prefix client run lint
npm --prefix client test
npm --prefix client run build
```

Para os testes de navegador, instale o Chromium do Playwright e execute:

```bash
cd client
npx playwright install chromium
npm run test:e2e
```

O Playwright inicia o Vite em `127.0.0.1:4173`. Deploy, migrations de produção e recuperação de dados seguem o [runbook](docs/production-runbook.md); testes locais não substituem o smoke no ambiente publicado.

## Próximos passos

- [ ] **Validar os hardenings em ambiente real:** histórico de senhas, readiness, cold start, proxies confiáveis e locks concorrentes, começando por PostgreSQL descartável e depois pela infraestrutura ativa.
- [ ] **Concluir a operação:** exigir os checks na proteção de `main`, configurar alertas e executar uma recuperação completa em ambiente Neon isolado.
- [ ] **Finalizar domínio e e-mail:** validar cookies e CORS nos hosts definitivos, autenticar o domínio de envio e implementar eventos de entrega com deduplicação antes de ativar notificações financeiras.
- [ ] **Evoluir a experiência financeira:** polir os fluxos existentes, melhorar transferências, previsões e a revisão de importações e amadurecer Open Finance.
- [ ] **Adicionar canais e assistência:** implementar pareamento seguro para Telegram/WhatsApp, começar por consultas autenticadas e exigir confirmação para escritas. Agentes e resumos programados dependem dessa fundação e de execução idempotente em worker/cron.

A ordem detalhada e os critérios de aceite ficam no [roadmap Héstia](docs/HESTIA_REDESIGN_ROADMAP.md). Consulte também as [decisões de arquitetura](docs/architecture-decisions.md), o [roadmap de e-mail](docs/EMAIL_DELIVERY_ROADMAP.md) e o [índice da documentação](docs/README.md).
