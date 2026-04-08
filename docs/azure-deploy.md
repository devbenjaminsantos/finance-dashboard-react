# Deploy no Azure

Este projeto usa tres recursos separados no Azure:

- frontend React/Vite em `Azure Static Web Apps`
- backend ASP.NET Core em `Azure App Service`
- banco em `Azure SQL Database`

## Recursos sugeridos

- Grupo de recursos: `rg-finova`
- Static Web App: `happy-coast-09654c410.2.azurestaticapps.net`
- App Service: `finova-api`

## Frontend

O workflow do frontend esta em `.github/workflows/deploy-web-azure.yml`.

Na criacao do `Static Web App`, os campos corretos sao:

- `App location`: `client`
- `Api location`: vazio
- `Output location`: `dist`

### Secret do GitHub

Em `GitHub > Settings > Secrets and variables > Actions`, configure:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `VITE_API_URL`

Valor esperado de `VITE_API_URL`:

```text
https://finova-api.azurewebsites.net/api
```

## Backend

O workflow da API esta em `.github/workflows/deploy-api-azure.yml`.

Ele publica o projeto:

```text
server/FinanceDashboard.Api/FinanceDashboard.Api.csproj
```

### Secret do GitHub

Em `GitHub > Settings > Secrets and variables > Actions`, configure:

- `AZURE_WEBAPP_PUBLISH_PROFILE`

Esse valor vem de:

- `Azure Portal > App Service > Overview > Get publish profile`

## Variaveis da API no App Service

No `Azure Portal > App Service > Settings > Environment variables`, configure:

- `ConnectionStrings__Default`
- `Jwt__Key`
- `Jwt__Issuer`
- `Jwt__Audience`
- `Cors__AllowedOrigins__0`

Valores esperados:

```text
Jwt__Issuer=FinanceDashboard
Jwt__Audience=FinanceDashboard
Cors__AllowedOrigins__0=https://happy-coast-09654c410.2.azurestaticapps.net
```

Exemplo de `ConnectionStrings__Default` para Azure SQL:

```text
Server=tcp:SEU-SERVIDOR.database.windows.net,1433;Initial Catalog=SEU-BANCO;Persist Security Info=False;User ID=SEU-USUARIO;Password=SUA-SENHA;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

`Jwt__Key` deve ter pelo menos 32 caracteres.

## Banco de dados

Depois de criar o Azure SQL Database, aplique as migrations a partir da sua maquina:

```powershell
cd server\FinanceDashboard.Api
dotnet ef database update --connection "Server=tcp:SEU-SERVIDOR.database.windows.net,1433;Initial Catalog=SEU-BANCO;Persist Security Info=False;User ID=SEU-USUARIO;Password=SUA-SENHA;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
```

## Ordem recomendada

1. Criar o App Service `finova-api`
2. Baixar o publish profile e salvar em `AZURE_WEBAPP_PUBLISH_PROFILE`
3. Configurar as variaveis do App Service
4. Criar o Azure SQL Database
5. Rodar as migrations
6. Configurar `VITE_API_URL` no GitHub
7. Fazer push na branch principal para disparar os dois workflows

## Validacoes

Teste estes enderecos depois do deploy:

- frontend: `https://happy-coast-09654c410.2.azurestaticapps.net`
- health da API: `https://finova-api.azurewebsites.net/health`

## Observacao sobre acesso publico

O `App Service` deve ficar `Public` no acesso de rede para o frontend conseguir chamar a API. A protecao dos endpoints continua sendo feita pelo JWT da propria aplicacao.
