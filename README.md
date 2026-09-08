# Héstia

English · [Português](README-pt-BR.md)

Héstia is a personal finance application for organizing transactions, tracking commitments, and understanding how money is allocated over time. It brings accounts, income, expenses, budgets, and analysis into one workflow: record or import transactions, review the data, and use it to plan the months ahead.

The project combines a React interface with an ASP.NET Core API and PostgreSQL persistence. Its current focus is improving the financial experience and validating security and reliability in the production infrastructure.

## What you can do

- **Manage daily finances:** create financial accounts and transactions, organize them by category and tags, filter by period and account, and track income, expenses, and balance.
- **Plan commitments:** record recurring transactions and installments and set monthly budgets overall or by category.
- **Analyze your history:** view charts, period comparisons, and indicators calculated from transactions.
- **Bring and export your data:** import CSV/OFX files with a review before saving and export financial information.
- **Share a limited view:** create a revocable link to a read-only dashboard. The API limits sharing to up to 100 transactions from the last 12 months, exposing month, category, amount, and type without descriptions, accounts, or tags.
- **Explore and personalize:** try a demo account, switch between light and dark themes, and use Portuguese or English on desktop and mobile.

Account access includes registration, email confirmation, password recovery, and an audit history for sensitive actions. Brevo handles authentication emails. Financial alerts and automatic summaries remain disabled; Pluggy has a backend foundation, while Telegram, WhatsApp, and AI agents are planned and not yet implemented.

## How the project works

```text
React/Vite on Vercel
        │ /api/*
        ▼
ASP.NET Core API on Railway
        ├── EF Core → PostgreSQL on Neon
        └── Brevo → authentication emails
```

The frontend uses `/api` in production, forwarded to Railway by [vercel.json](vercel.json). The API handles validation, financial rules, and authorization: data and related IDs are checked against the authenticated `UserId` before write operations.

Authentication uses JWTs in an `HttpOnly` cookie, CSRF protection for mutations, and database-backed session version validation. The implementation also includes rate limiting, a password hash history to prevent password reuse, and auditing. The HTTP client limits waiting to 30 seconds and restricts retries after transient failures to reads. These controls have automated tests; outstanding operational validation is tracked in the [security checklist](docs/security-hardening-checklist.md).

| Layer | Technologies and code |
| --- | --- |
| Interface | React 19, Vite, React Router, Bootstrap, Recharts, and i18next — `client/` |
| API and data | ASP.NET Core 10, EF Core, and PostgreSQL — `server/FinanceDashboard.Api/` |
| Tests | Vitest, Testing Library, and Playwright in the client; xUnit and HTTP tests in `tests/FinanceDashboard.Api.Tests/` |
| Operations | Vercel, Railway, and Neon; validation and smoke workflows in `.github/workflows/` |

## Run locally

You need Node.js 22, the .NET 10 SDK, PostgreSQL, and the `dotnet-ef` 10 tool. The commands below start at the repository root.

**1. Configure the API and a local PostgreSQL database.** Copy the [configuration example](server/FinanceDashboard.Api/appsettings.Development.local.example.json) to `appsettings.Development.local.json` in the same directory. This file is ignored by Git. The example still uses SQL Server: change `Database:Provider` to `PostgreSql` and `ConnectionStrings:Default` to your local connection, using the `Host=…;Database=…;Username=…;Password=…` format.

Set your own JWT key with at least 32 characters and keep `Client:BaseUrl` and the CORS origin at `http://localhost:5173`. Email and notifications can remain disabled when exploring the demo account; the complete email registration flow requires provider configuration. Do not commit credentials.

**2. Apply migrations and start the API.** Before running EF, set `ConnectionStrings__Default` in your terminal to the local database connection. The migration factory reads this variable, not the local JSON file.

```bash
dotnet restore finance-dashboard-react.sln
dotnet ef database update --project server/FinanceDashboard.Api
dotnet run --project server/FinanceDashboard.Api
```

The API uses `http://localhost:5278`. `/health` checks the process; `/health/ready` checks connectivity and migrations. SQL Server remains a legacy local compatibility option; the versioned migrations target PostgreSQL.

**3. Start the frontend in another terminal.**

```bash
cd client
npm ci
npm run dev
```

Open `http://localhost:5173`. In development, the client calls `http://localhost:5278/api`. Only set `VITE_API_URL` to target a different API; its value is public and must end in `/api`.

## Verify changes

From the repository root:

```bash
dotnet test tests/FinanceDashboard.Api.Tests/FinanceDashboard.Api.Tests.csproj
npm --prefix client run lint
npm --prefix client test
npm --prefix client run build
```

For browser tests, install Playwright's Chromium and run:

```bash
cd client
npx playwright install chromium
npm run test:e2e
```

Playwright starts Vite at `127.0.0.1:4173`. Deployment, production migrations, and data recovery follow the [runbook](docs/production-runbook.md); local tests do not replace smoke tests against the deployed environment.

## Next steps

- [ ] **Validate hardening in real environments:** password history, readiness, cold starts, trusted proxies, and concurrent locks, starting with disposable PostgreSQL and then the active infrastructure.
- [ ] **Complete operational setup:** require checks through `main` branch protection, configure alerts, and perform a full recovery in an isolated Neon environment.
- [ ] **Finalize domains and email:** validate cookies and CORS on the final hosts, authenticate the sending domain, and implement deduplicated delivery events before enabling financial notifications.
- [ ] **Improve the financial experience:** polish existing flows, improve transfers, forecasts, and import review, and develop Open Finance further.
- [ ] **Add channels and assistance:** implement secure Telegram/WhatsApp pairing, start with authenticated queries, and require confirmation for writes. Agents and scheduled summaries depend on this foundation and idempotent worker/cron execution.

The detailed sequence and acceptance criteria live in the [Héstia roadmap](docs/HESTIA_REDESIGN_ROADMAP.md). See also the [architecture decisions](docs/architecture-decisions.md), [email roadmap](docs/EMAIL_DELIVERY_ROADMAP.md), and [documentation index](docs/README.md). Supporting documentation is primarily in Portuguese.
