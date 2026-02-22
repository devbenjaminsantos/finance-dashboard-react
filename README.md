# Dashboard Financeiro (React)

Um dashboard de finanças pessoais feito em **React**, com **CRUD completo** de transações, **filtros/busca/ordenação**, **persistência no LocalStorage** e **gráficos (Recharts)**.

> ✅ Este repositório está em evolução contínua: o projeto já funciona como demo e seguirá recebendo features até a versão final.

## 🔗 Links
- **Demo (Vercel):** https://finance-dashboard-react-six.vercel.app
- **Repositório (GitHub):** https://github.com/devbenjaminsantos/finance-dashboard-react

---

## ✅ Funcionalidades (já implementadas)
### Transações
- CRUD completo de transações (**criar, listar, editar e remover**)
- Modal Bootstrap para **criar/editar**
- Persistência via **LocalStorage**
- Campo de valor aceita **vírgula e ponto** (ex.: `150,00` / `150.00`)
- Tratamento correto de dinheiro com **centavos (`amountCents`)** + formatação **BRL** (`R$ 150,00`)

### Filtros e navegação
- Busca por descrição
- Filtros por **mês**, **tipo** (receita/despesa) e **categoria**
- Ordenação por **data** e por **valor**
- Atalhos: **Mês atual** e **Limpar filtros**
- Persistência dos filtros no **LocalStorage** (permanece após F5; mês atual como default na primeira vez)
- Rotas com **React Router**: Dashboard e Transações

### Dashboard e gráficos
- Cards: **Receitas / Despesas / Saldo**
- Gráficos com **Recharts**
  - Pizza: despesas por categoria
  - Barras: receitas vs despesas (últimos 6 meses)

### Organização do projeto
- Componentização (Filters/Table/Modal)
- Provider global de transações (estado único para o app)

---

## 🧭 Roadmap (funcionalidades planejadas)
### Prioridade (antes do foco estético)
- [ ] Filtros globais compartilhados entre Transações e Dashboard (ex.: mês selecionado impacta gráficos)
- [ ] Exportação de CSV (todas ou filtradas)
- [ ] Importação de CSV (validação/mapeamento)
- [ ] Dados de demonstração (botão “Carregar demo” para visitantes)
- [ ] Categorias melhoradas (CRUD de categorias: nome + cor/ícone)
- [ ] Undo ao remover (toast “Desfazer”)

### Evolução (mais avançado)
- [ ] i18n (pt-BR / en-US)
- [ ] Temas/paleta personalizada (presets + custom)
- [ ] Paleta via wallpaper (extração de cores e aplicação nos gráficos)
- [ ] Orçamento por categoria/mês + alertas
- [ ] Recorrência (assinaturas/transações recorrentes)
- [ ] Versão com API (migrar LocalStorage → API REST + banco)

---

## 🛠️ Stack
- **React (JS)**
- **Vite**
- **Bootstrap**
- **React Router DOM**
- **Recharts**
- **Git / GitHub**
- **Vercel** (deploy)

---

## ▶️ Como rodar localmente
```bash
npm install
npm run dev