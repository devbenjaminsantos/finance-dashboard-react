# Finance Dashboard

Aplicacao full stack para controle financeiro pessoal, com autenticacao, dashboard e gerenciamento de transacoes.

## Estrutura

- `client/`: frontend em React com Vite
- `server/FinanceDashboard.Api/`: API em ASP.NET Core com Entity Framework Core e JWT
- `server/docker-compose.yml`: infraestrutura local do SQL Server

## Stack

- React 19
- Vite
- Bootstrap 5
- Recharts
- ASP.NET Core 10
- Entity Framework Core
- SQL Server
- JWT

## Como rodar

### 1. Frontend

```bash
cd client
npm install
npm run dev
```

O frontend sobe por padrao em `http://localhost:5173`.

### 2. Banco de dados

Crie o arquivo `server/.env` com base em `server/.env.example` e defina `SA_PASSWORD`.

Depois suba o SQL Server:

```bash
cd server
docker compose up -d
```

### 3. Backend

Crie o arquivo `server/FinanceDashboard.Api/appsettings.Development.local.json` com base em `server/FinanceDashboard.Api/appsettings.Development.local.example.json`.

Voce tambem pode usar variaveis de ambiente no lugar do arquivo:

- `ConnectionStrings__Default`
- `Jwt__Key`
- `Jwt__Issuer`
- `Jwt__Audience`

Depois rode a API:

```bash
cd server/FinanceDashboard.Api
dotnet run
```

A API sobe por padrao em `http://localhost:5278`.

## Fluxo de desenvolvimento

1. Suba o SQL Server com Docker.
2. Inicie a API em `server/FinanceDashboard.Api`.
3. Inicie o frontend em `client`.
4. Use `server/FinanceDashboard.Api/FinanceDashboard.Api.http` para testar os endpoints manualmente.

## Observacoes

- O frontend e o backend usam portas locais diferentes.
- Segredos nao devem ser versionados.
- O arquivo `appsettings.json` ficou apenas com placeholders; a configuracao real deve ficar no ambiente local.
- O passo a passo de deploy Azure esta em `docs/azure-deploy.md`.

## Autor

Benjamin Montenegro
