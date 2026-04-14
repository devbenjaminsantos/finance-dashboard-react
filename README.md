# Finova

Aplicação full stack para controle financeiro pessoal, com autenticação, dashboard, metas mensais, exportação de relatórios e deploy em produção no Azure.

O projeto foi pensado para evoluir de um painel financeiro simples para um produto com cara de SaaS: conta demo, recuperação de senha, confirmação de e-mail, monitoramento básico, auditoria e estrutura pronta para expansão.

## Visão Geral

O Finova permite:

- criar conta e fazer login com JWT
- confirmar e-mail no cadastro
- recuperar senha por e-mail
- usar uma conta demo com dados prontos
- cadastrar, editar e remover transações
- acompanhar receitas, despesas e saldo
- definir metas mensais de gasto
- receber alertas visuais e insights automáticos
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
- Vitest
- Testing Library
- Playwright

### Infraestrutura

- Azure Static Web Apps
- Azure App Service
- Azure SQL Database
- Azure Communication Services Email
- Application Insights

## Funcionalidades Entregues

### Autenticação e segurança

- cadastro com validação de e-mail
- login com JWT
- bloqueio de login para contas não confirmadas
- reenvio de e-mail de confirmação
- recuperação de senha com token de uso único
- redefinição de senha
- tela de perfil com alteração de nome e senha
- bloqueio temporário após excesso de tentativas inválidas de login
- política de senha fortalecida
- gerenciamento de sessão com expiração, inatividade e retorno para rota protegida

### Experiência de produto

- conta demo com dados prontos para exploração
- onboarding inicial com opt-in
- dashboard com resumo financeiro
- filtro por período no dashboard
- comparativo entre meses
- insights automáticos
- insights prescritivos
- tema claro e escuro
- mensagens de erro e sucesso revisadas

### Gestão financeira

- cadastro de receitas e despesas
- categorias separadas para receita e despesa
- filtros por texto, tipo, categoria, mês e ordenação
- metas mensais gerais e por categoria
- expansão das metas por categoria com navegação mensal e sugestões automáticas
- alerta visual de gasto
- gastos recorrentes mensais

### Relatórios e rastreabilidade

- exportação de transações em CSV
- exportação de transações em PDF via impressão do navegador
- logs de auditoria para fluxos sensíveis
- tela de auditoria no frontend

### Qualidade e operação

- testes automatizados para autenticação
- testes automatizados para transações
- testes automatizados de frontend com Vitest
- suíte E2E inicial com Playwright
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

O domínio customizado planejado para a próxima etapa é `finovawallet`.

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

- usando variáveis de ambiente
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
- proteção contra tentativas de login

## Testes Automatizados

Para rodar a suíte do backend:

```powershell
dotnet test tests/FinanceDashboard.Api.Tests/FinanceDashboard.Api.Tests.csproj
```

Para rodar a suíte do frontend:

```powershell
cd client
npm test
```

Para rodar os testes E2E:

```powershell
cd client
npm run test:e2e
```

Atualmente os testes cobrem:

- autenticação
- confirmação de e-mail
- recuperação e redefinição de senha
- fluxo de transações
- proteção por usuário nas operações de transação
- helpers de sessão, storage e exportação
- dashboard e modal de transações
- smoke tests com Playwright para rotas públicas e proteção de rotas

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

## Observações de Segurança

- segredos não devem ser versionados
- o arquivo local de configuração do back-end deve permanecer fora do Git
- a senha do SQL deve ser mantida apenas em ambiente seguro
- o fluxo de recuperação de senha não deve expor o link de redefinição em produção aberta
- a sessão deve ser invalidada quando o token expirar ou quando houver inatividade prolongada

## Roadmap por Versão

### V1 concluída

- deploy completo no Azure
- autenticação base com JWT
- perfil do usuário
- conta demo
- recuperação de senha
- confirmação de e-mail
- dashboard inicial
- metas mensais
- exportação em CSV e PDF
- monitoramento básico

### V2 concluída

- melhorias de UX no fluxo de autenticação
- estados de loading e feedback visual mais claros
- refinamento da conta demo
- filtros por período no dashboard
- metas mensais por categoria
- alerta de gastos
- logs de auditoria no backend
- testes automatizados do backend
- tema claro e escuro

### V3 concluída

- tela de auditoria no frontend
- comparativo entre meses
- insights automáticos
- insights prescritivos
- onboarding inicial com opt-in
- gastos recorrentes
- expansão das metas por categoria
- testes de frontend com Vitest
- suíte inicial E2E com Playwright
- reforço de segurança:
  - proteção contra tentativas de login
  - política de senha fortalecida
  - gerenciamento de sessão

### V4 planejada

- otimizar a página de auditoria para mostrar apenas eventos mais relevantes
- separar dashboard, insights, comparativos e metas em páginas próprias
- criar uma Home personalizável, com widgets escolhidos pelo usuário
- ocultar automaticamente o mini tutorial quando ele for concluído
- melhorar a exportação em PDF sem depender da impressão/extensão do navegador

### V5 planejada

- suporte a múltiplos idiomas
- integração com conta bancária para detectar e importar transações automaticamente
- avaliar se ainda faz sentido incluir 2FA em um cenário mais maduro do produto
- domínio customizado como fechamento final da experiência

## Autor

Benjamin Montenegro
