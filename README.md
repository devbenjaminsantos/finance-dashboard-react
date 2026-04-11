# Finova

Aplicação full stack para controle financeiro pessoal, com autenticação, dashboard, metas mensais, exportação de relatórios e deploy em produção no Azure.

O projeto foi pensado para evoluir de um painel financeiro simples para um produto com cara de SaaS: conta demo, recuperação de senha, confirmação de e-mail, monitoramento básico e estrutura pronta para expansão.

## Visão Geral

O Finova permite:

- criar conta e fazer login com JWT
- confirmar e-mail no cadastro
- recuperar senha por e-mail
- usar uma conta demo com dados prontos
- cadastrar, editar e remover transações
- acompanhar receitas, despesas e saldo
- definir metas mensais de gasto
- receber alerta visual quando a meta se aproxima do limite
- exportar transações em CSV e PDF
- alternar entre tema claro e escuro
- registrar logs de auditoria para ações sensíveis

## Stack

### Front-End

- React 19
- Vite
- React Router
- Bootstrap 5
- Recharts

### Back-End

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

## Funcionalidades Entregues

### Autenticação

- cadastro com validação de e-mail
- login com JWT
- bloqueio de login para contas não confirmadas
- reenvio de e-mail de confirmação
- recuperação de senha com token de uso único
- redefinição de senha
- tela de perfil com alteração de nome e senha

### Experiência de produto

- conta demo com dados prontos para exploração
- dashboard com resumo financeiro
- filtro por período no dashboard
- tema claro e escuro
- mensagens de erro e sucesso revisadas

### Gestão financeira

- cadastro de receitas e despesas
- categorias separadas para receita e despesa
- filtros por texto, tipo, categoria, mês e ordenação
- metas mensais gerais ou por categoria
- alerta visual de gasto

### Relatórios e rastreabilidade

- exportação de transações em CSV
- exportação de transações em PDF via impressão do navegador
- logs de auditoria para fluxos sensíveis

### Qualidade e operação

- testes automatizados para autenticação
- testes automatizados para transações
- monitoramento básico configurado no Azure

## Estrutura do Projeto

```text
finance-dashboard-react/
├─ client/                          # Frontend React/Vite
├─ server/
│  ├─ FinanceDashboard.Api/         # API ASP.NET Core
│  ├─ docker-compose.yml            # SQL Server local via Docker
│  └─ .env.example                  # Exemplo para o banco local
├─ tests/
│  └─ FinanceDashboard.Api.Tests/   # Testes automatizados do backend
├─ docs/
│  └─ azure-deploy.md               # Guia de deploy e infraestrutura Azure
└─ finance-dashboard-react.sln
```

## Ambiente de Produção

Estado atual da publicação:

- front-end: `Azure Static Web Apps`
- back-end: `Azure App Service`
- banco: `Azure SQL Database`

Links atuais:

- front-end: `https://happy-coast-09654c410.2.azurestaticapps.net`
- health da API: `https://finova-api-b9g4bpcadyegheed.brazilsouth-01.azurewebsites.net/health`

O domínio customizado planejado para a próxima etapa e `finovawallet`.

## Como Rodar Localmente

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

### 2. Back-End

Você pode configurar a API local de duas formas:

- usando variaáveis de ambiente
- usando um arquivo local ignorado pelo Git, como `appsettings.Development.local.json`

Variáveis esperadas:

- `ConnectionStrings__Default`
- `Jwt__Key`
- `Jwt__Issuer`
- `Jwt__Audience`
- `Cors__AllowedOrigins__0`
- `Client__BaseUrl`

Exemplo de execução:

```powershell
cd server/FinanceDashboard.Api
dotnet run
```

A API sobe, por padrão, em:

```text
http://localhost:5278
```

### 3. Front-End

```powershell
cd client
npm install
npm run dev
```

O front-end sobe, por padrão, em:

```text
http://localhost:5173
```

## Banco e Migrations

Para aplicar as migrations:

```powershell
cd server/FinanceDashboard.Api
dotnet ef database update
```

Esse passo é necessário sempre que entrar uma nova migration, por exemplo em:

- recuperação de senha
- confirmação de e-mail
- metas mensais
- logs de auditoria

## Testes Automatizados

Para rodar a suíte do backend:

```powershell
dotnet test tests/FinanceDashboard.Api.Tests/FinanceDashboard.Api.Tests.csproj
```

Atualmente os testes cobrem:

- autenticação
- confirmação de e-mail
- recuperação e redefinição de senha
- fluxo de transações
- proteção por usuário nas operações de transação

## Configurações Importantes

### Front-End

No deploy, o front-end espera:

- `VITE_API_URL`

Exemplo:

```text
https://finova-api-b9g4bpcadyegheed.brazilsouth-01.azurewebsites.net/api
```

### Back-End

No App Service, as configurações principais são:

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

## Conta Demo

O projeto inclui uma conta demo para exploração rápida do produto.

Objetivo:

- permitir avaliação sem cadastro
- demonstrar dashboard, categorias, metas, filtros e relatórios
- acelerar apresentações e validações

O fluxo da demo usa a mesma sessão JWT da conta real, o que ajuda a validar o comportamento do app sem exceções artificiais no front-end.

## Documentação Complementar

Guias extras:

- deploy e infraestrutura Azure: [docs/azure-deploy.md](/c:/Users/user/Desktop/Dashboard%20Financeiro/finance-dashboard-react/docs/azure-deploy.md)

## Observações de Seguranca

- segredos não devem ser versionados
- o arquivo local de configuracao do back-end deve permanecer fora do Git
- a senha do SQL deve ser mantida apenas em ambiente seguro
- o fluxo de recuperação de senha não deve expôr o link de redefinição em produção aberta

## Roadmap Resumido

### Entregue

- deploy completo no Azure
- autenticação completa
- conta demo
- perfil do usuário
- metas mensais
- exportacao CSV e PDF
- confirmação de e-mail
- recuperação de senha
- logs de auditoria
- testes automatizados do back-end

### Próxima etapa

- domínio customizado `finovawallet`
- acabamento final de apresentação
- refinamentos de produto definidos para V3

## Autor

Benjamin Montenegro
