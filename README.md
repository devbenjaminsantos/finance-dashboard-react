# Finova

Aplicacao full stack para controle financeiro pessoal, com autenticacao, dashboard, metas mensais, exportacao de relatorios e deploy em producao no Azure.

O projeto foi pensado para evoluir de um painel financeiro simples para um produto com cara de SaaS, com conta demo, recuperacao de senha, confirmacao de e-mail, monitoramento basico e estrutura pronta para expansao.

## Visao geral

O Finova permite:

- criar conta e fazer login com JWT
- confirmar e-mail no cadastro
- recuperar senha por e-mail
- usar uma conta demo com dados prontos
- cadastrar, editar e remover transacoes
- acompanhar receitas, despesas e saldo
- definir metas mensais de gasto
- receber alerta visual quando a meta se aproxima do limite
- exportar transacoes em CSV e PDF
- alternar entre tema claro e escuro
- registrar logs de auditoria para acoes sensiveis

## Stack

### Frontend

- React 19
- Vite
- React Router
- Bootstrap 5
- Recharts

### Backend

- ASP.NET Core 10
- Entity Framework Core 10
- JWT Bearer Authentication
- SQL Server
- Scalar.AspNetCore

### Testes

- xUnit
- EF Core InMemory
- Microsoft.NET.Test.Sdk

### Infraestrutura

- Azure Static Web Apps
- Azure App Service
- Azure SQL Database
- Azure Communication Services Email
- Application Insights

## Funcionalidades entregues

### Autenticacao

- cadastro com validacao de e-mail
- login com JWT
- bloqueio de login para contas nao confirmadas
- reenvio de e-mail de confirmacao
- recuperacao de senha com token de uso unico
- redefinicao de senha
- tela de perfil com alteracao de nome e senha

### Experiencia de produto

- conta demo com dados prontos para exploracao
- dashboard com resumo financeiro
- filtro por periodo no dashboard
- tema claro e escuro
- mensagens de erro e sucesso revisadas

### Gestao financeira

- cadastro de receitas e despesas
- categorias separadas para receita e despesa
- filtros por texto, tipo, categoria, mes e ordenacao
- metas mensais gerais ou por categoria
- alerta visual de gasto

### Relatorios e rastreabilidade

- exportacao de transacoes em CSV
- exportacao de transacoes em PDF via impressao do navegador
- logs de auditoria para fluxos sensiveis

### Qualidade e operacao

- testes automatizados para autenticacao
- testes automatizados para transacoes
- monitoramento basico configurado no Azure

## Estrutura do projeto

```text
finance-dashboard-react/
|- client/                        # Frontend React/Vite
|- server/
|  |- FinanceDashboard.Api/       # API ASP.NET Core
|  |- docker-compose.yml          # SQL Server local via Docker
|  `- .env.example                # Exemplo para o banco local
|- tests/
|  `- FinanceDashboard.Api.Tests/ # Testes automatizados do backend
|- docs/
|  `- azure-deploy.md             # Guia de deploy e infraestrutura Azure
`- finance-dashboard-react.sln
```

## Ambiente de producao

Estado atual da publicacao:

- frontend: `Azure Static Web Apps`
- backend: `Azure App Service`
- banco: `Azure SQL Database`

Links atuais:

- frontend: `https://happy-coast-09654c410.2.azurestaticapps.net`
- health da API: `https://finova-api-b9g4bpcadyegheed.brazilsouth-01.azurewebsites.net/health`

O dominio customizado planejado para a proxima etapa e `finovawallet`.

## Como rodar localmente

### 1. Banco de dados

Crie o arquivo `server/.env` com base em `server/.env.example` e defina:

```env
SA_PASSWORD=SuaSenhaForteAqui
```

Depois suba o SQL Server local:

```powershell
cd server
docker compose up -d
```

### 2. Backend

Voce pode configurar a API local de duas formas:

- usando variaveis de ambiente
- usando um arquivo local ignorado pelo Git, como `appsettings.Development.local.json`

Variaveis esperadas:

- `ConnectionStrings__Default`
- `Jwt__Key`
- `Jwt__Issuer`
- `Jwt__Audience`
- `Cors__AllowedOrigins__0`
- `Client__BaseUrl`

Exemplo de execucao:

```powershell
cd server/FinanceDashboard.Api
dotnet run
```

A API sobe, por padrao, em:

```text
http://localhost:5278
```

### 3. Frontend

```powershell
cd client
npm install
npm run dev
```

O frontend sobe, por padrao, em:

```text
http://localhost:5173
```

## Banco e migrations

Para aplicar as migrations:

```powershell
cd server/FinanceDashboard.Api
dotnet ef database update
```

Esse passo e necessario sempre que entrar uma nova migration, por exemplo em:

- recuperacao de senha
- confirmacao de e-mail
- metas mensais
- logs de auditoria

## Testes automatizados

Para rodar a suite do backend:

```powershell
dotnet test tests/FinanceDashboard.Api.Tests/FinanceDashboard.Api.Tests.csproj
```

Atualmente os testes cobrem:

- autenticacao
- confirmacao de e-mail
- recuperacao e redefinicao de senha
- fluxo de transacoes
- protecao por usuario nas operacoes de transacao

## Configuracoes importantes

### Frontend

No deploy, o frontend espera:

- `VITE_API_URL`

Exemplo:

```text
https://finova-api-b9g4bpcadyegheed.brazilsouth-01.azurewebsites.net/api
```

### Backend

No App Service, as configuracoes principais sao:

- `Jwt__Key`
- `Jwt__Issuer`
- `Jwt__Audience`
- `Cors__AllowedOrigins__0`
- `Client__BaseUrl`
- `Smtp__Host`
- `Smtp__Port`
- `Smtp__Username`
- `Smtp__Password`
- `Smtp__FromEmail`
- `Smtp__FromName`
- `Smtp__EnableSsl`
- `Demo__Enabled`
- `Demo__Email`
- `Demo__Password`

Em `Connection Strings`, a API usa:

- `Default`

## Conta demo

O projeto inclui uma conta demo para exploracao rapida do produto.

Objetivos:

- permitir avaliacao sem cadastro
- demonstrar dashboard, categorias, metas, filtros e relatorios
- acelerar apresentacoes e validacoes

O fluxo da demo usa a mesma sessao JWT da conta real, o que ajuda a validar o comportamento do app sem excecoes artificiais no frontend.

## Documentacao complementar

Guias extras:

- deploy e infraestrutura Azure: [docs/azure-deploy.md](/c:/Users/user/Desktop/Dashboard%20Financeiro/finance-dashboard-react/docs/azure-deploy.md)

## Observacoes de seguranca

- segredos nao devem ser versionados
- o arquivo local de configuracao do backend deve permanecer fora do Git
- a senha do SQL deve ser mantida apenas em ambiente seguro
- o fluxo de recuperacao de senha nao deve expor o link de redefinicao em producao aberta

## Roadmap resumido

### Entregue

- deploy completo no Azure
- autenticacao completa
- conta demo
- perfil do usuario
- metas mensais
- exportacao CSV e PDF
- confirmacao de e-mail
- recuperacao de senha
- logs de auditoria
- testes automatizados do backend

### Proxima etapa

- dominio customizado `finovawallet`
- acabamento final de apresentacao
- refinamentos de produto definidos para V3

## Autor

Benjamin Montenegro
