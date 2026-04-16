# Finova

Aplicacao full stack para controle financeiro pessoal, com autenticacao, graficos financeiros, metas mensais, exportacao de relatorios e deploy em producao no Azure.

O projeto foi pensado para evoluir de um painel financeiro simples para um produto com cara de SaaS: conta demo, recuperacao de senha, confirmacao de e-mail, monitoramento basico, historico e estrutura pronta para expansao.

## Visao Geral

O Finova permite:

- criar conta e fazer login com JWT
- confirmar e-mail no cadastro
- recuperar senha por e-mail
- usar uma conta demo com dados prontos
- cadastrar, editar e remover transacoes
- acompanhar receitas, despesas e saldo
- definir metas mensais de gasto
- receber alertas visuais e insights automaticos
- exportar transacoes em CSV e PDF
- alternar entre tema claro e escuro
- registrar logs de auditoria para acoes sensiveis

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

### Autenticacao e seguranca

- cadastro com validacao de e-mail
- login com JWT
- bloqueio de login para contas nao confirmadas
- reenvio de e-mail de confirmacao
- recuperacao de senha com token de uso unico
- redefinicao de senha
- tela de perfil com alteracao de nome e senha
- bloqueio temporario apos excesso de tentativas invalidas de login
- politica de senha fortalecida
- gerenciamento de sessao com expiracao, inatividade e retorno para rota protegida

### Experiencia de produto

- conta demo com dados prontos para exploracao
- onboarding inicial com opt-in
- area de graficos com resumo financeiro
- filtro por periodo na area de graficos
- comparativo entre meses
- insights automaticos
- insights prescritivos
- tema claro e escuro
- mensagens de erro e sucesso revisadas

### Gestao financeira

- cadastro de receitas e despesas
- categorias separadas para receita e despesa
- filtros por texto, tipo, categoria, mes e ordenacao
- metas mensais gerais e por categoria
- expansao das metas por categoria com navegacao mensal e sugestoes automaticas
- alerta visual de gasto
- gastos recorrentes mensais

### Relatorios e rastreabilidade

- exportacao de transacoes em CSV
- exportacao de transacoes em PDF sem depender da impressao do navegador
- logs de auditoria para fluxos sensiveis
- tela de historico no frontend

### Qualidade e operacao

- testes automatizados para autenticacao
- testes automatizados para transacoes
- testes automatizados de frontend com Vitest
- suite E2E inicial com Playwright
- monitoramento basico configurado no Azure

## Estrutura do Projeto

```text
finance-dashboard-react/
|-- client/                          # Frontend React/Vite
|-- server/
|   |-- FinanceDashboard.Api/        # API ASP.NET Core
|   |-- docker-compose.yml           # SQL Server local via Docker
|   `-- .env.example                 # Exemplo para o banco local
|-- tests/
|   `-- FinanceDashboard.Api.Tests/  # Testes automatizados do backend
|-- docs/
|   `-- azure-deploy.md              # Guia de deploy e infraestrutura Azure
`-- finance-dashboard-react.sln
```

## Ambiente de Producao

Estado atual da publicacao:

- front-end: `Azure Static Web Apps`
- back-end: `Azure App Service`
- banco: `Azure SQL Database`

Links atuais:

- front-end: `https://happy-coast-09654c410.2.azurestaticapps.net`
- health da API: `https://finova-api-b9g4bpcadyegheed.brazilsouth-01.azurewebsites.net/health`

O dominio customizado planejado para a proxima etapa e `finovawallet`.

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
- `Pluggy__ClientId`
- `Pluggy__ClientSecret`

Exemplo de execucao:

```powershell
cd server/FinanceDashboard.Api
dotnet run
```

A API sobe, por padrao, em:

```text
http://localhost:5278
```

### 3. Front-End

```powershell
cd client
npm install
npm run dev
```

O front-end sobe, por padrao, em:

```text
http://localhost:5173
```

## Banco e Migrations

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
- protecao contra tentativas de login

## Testes Automatizados

Para rodar a suite do backend:

```powershell
dotnet test tests/FinanceDashboard.Api.Tests/FinanceDashboard.Api.Tests.csproj
```

Para rodar a suite do frontend:

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

- autenticacao
- confirmacao de e-mail
- recuperacao e redefinicao de senha
- fluxo de transacoes
- protecao por usuario nas operacoes de transacao
- helpers de sessao, storage e exportacao
- area de graficos e modal de transacoes
- smoke tests com Playwright para rotas publicas e protecao de rotas

## Configuracoes Importantes

### Front-End

No deploy, o front-end espera:

- `VITE_API_URL`

Exemplo:

```text
https://finova-api-b9g4bpcadyegheed.brazilsouth-01.azurewebsites.net/api
```

### Back-End

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
- `Pluggy__ClientId`
- `Pluggy__ClientSecret`

### Integracao bancaria com Pluggy

Para habilitar a conexao bancaria real da V5:

- configure `Pluggy__ClientId`
- configure `Pluggy__ClientSecret`
- cadastre uma conta financeira com provedor `Pluggy`
- use o botao `Conectar com Pluggy`
- conclua a conexao no widget do Pluggy
- depois execute `Sincronizar` para importar as transacoes no Finova

Em `Connection Strings`, a API usa:

- `Default`

## Conta Demo

O projeto inclui uma conta demo para exploracao rapida do produto.

Objetivo:

- permitir avaliacao sem cadastro
- demonstrar graficos, categorias, metas, filtros e relatorios
- acelerar apresentacoes e validacoes

O fluxo da demo usa a mesma sessao JWT da conta real, o que ajuda a validar o comportamento do app sem excecoes artificiais no front-end.

## Documentacao Complementar

Guias extras:

- deploy e infraestrutura Azure: [docs/azure-deploy.md](/c:/Users/user/Desktop/Dashboard%20Financeiro/finance-dashboard-react/docs/azure-deploy.md)

## Observacoes de Seguranca

- segredos nao devem ser versionados
- o arquivo local de configuracao do back-end deve permanecer fora do Git
- a senha do SQL deve ser mantida apenas em ambiente seguro
- o fluxo de recuperacao de senha nao deve expor o link de redefinicao em producao aberta
- a sessao deve ser invalidada quando o token expirar ou quando houver inatividade prolongada

## Checklist por Versao

### V1

- [x] Deploy completo no Azure
- [x] Autenticacao base com JWT
- [x] Perfil do usuario
- [x] Conta demo
- [x] Recuperacao de senha
- [x] Confirmacao de e-mail
- [x] Area inicial de graficos
- [x] Metas mensais
- [x] Exportacao em CSV e PDF
- [x] Monitoramento basico

### V2

- [x] Melhorias de UX no fluxo de autenticacao
- [x] Estados de loading e feedback visual mais claros
- [x] Refinamento da conta demo
- [x] Filtros por periodo na area de graficos
- [x] Metas mensais por categoria
- [x] Alerta de gastos
- [x] Logs de auditoria no backend
- [x] Testes automatizados do backend
- [x] Tema claro e escuro

### V3

- [x] Tela de auditoria no frontend
- [x] Comparativo entre meses
- [x] Insights automaticos
- [x] Insights prescritivos
- [x] Onboarding inicial com opt-in
- [x] Gastos recorrentes
- [x] Expansao das metas por categoria
- [x] Testes de frontend com Vitest
- [x] Suite inicial E2E com Playwright
- [x] Protecao contra tentativas de login
- [x] Politica de senha fortalecida
- [x] Gerenciamento de sessao

### V4

- [x] Otimizar a pagina de auditoria para mostrar apenas eventos mais relevantes
- [x] Renomear Auditoria para Historico
- [x] Separar graficos, insights, comparativos e metas em paginas proprias
- [x] Ocultar automaticamente o mini tutorial quando ele for concluido
- [x] Criar uma Home personalizavel, com widgets escolhidos pelo usuario
- [x] Melhorar a exportacao em PDF sem depender da impressao/extensao do navegador

### V5

- [ ] Suporte a multiplos idiomas
- [x] Integracao bancaria manual inicial
- [x] V5.1 Importacao manual via CSV
- [x] V5.2 Importacao manual via OFX
- [x] V5.3 Tela de revisao antes da confirmacao da importacao
- [x] V5.4 Conciliacao de transacoes importadas com transacoes manuais
- [x] V5.5 Categorizacao assistida para lancamentos importados
- [x] V5.6 Preparar arquitetura para integracao automatica com Open Finance/agregador
- [x] V5.7 Sincronizacao automatica com conta bancaria
- [ ] Avaliar se ainda faz sentido incluir 2FA em um cenario mais maduro do produto
- [ ] Dominio customizado como fechamento final da experiencia

## Autor

Benjamin Montenegro
