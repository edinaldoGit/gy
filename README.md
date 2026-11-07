# 🏋️‍♂️ Agymos

O **Gy** é um aplicativo web mobile-first voltado à organização de treinos e ao acompanhamento da evolução física. Com uma interface moderna, leve e intuitiva, o Gy permite criar e personalizar fichas de treino, registrar séries, repetições e cargas, monitorar medidas corporais e visualizar o progresso por meio de gráficos e indicadores.

A proposta é centralizar as informações em um único lugar, transformando dados de treino em insights úteis e tornando o acompanhamento da evolução mais simples, prático e agradável.

Funciona como um **Progressive Web App (PWA)** com persistência 100% client-side: os dados ficam armazenados diretamente no dispositivo do usuário, garantindo funcionamento completo e offline dentro da academia, sem depender de conexão com a internet.

---

## ✨ Funcionalidades Principais

- 📋 **Fichas de Treino:** Crie, edite e personalize rotinas de treino por divisão muscular ou dias da semana.
- 📈 **Registro de Séries e Cargas:** Anote séries, repetições e evolução de peso por exercício com histórico detalhado.
- 📏 **Medidas Corporais:** Acompanhe peso, percentual de gordura e circunferências corporais ao longo do tempo.
- 📊 **Gráficos e Indicadores:** Visualize a evolução de cargas e métricas físicas de forma clara e intuitiva.
- 🔒 **Persistência 100% Local:** Dados salvos diretamente no navegador/dispositivo via IndexedDB (Dexie.js).
- 📱 **Instalável e Offline-First:** Pode ser adicionado à tela inicial no Android e no iOS (PWA), rodando em tela cheia e sem barra de navegação.

---

## 🛠️ Tecnologias

- **Front-end:** [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Gerenciamento de Estado:** [Pinia](https://pinia.vuejs.org/)
- **Banco de Dados Local:** IndexedDB via [Dexie.js](https://dexie.org/)
- **Funcionalidades PWA:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- **Ícones:** [Lucide Icons](https://lucide.dev/)

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+ instalado
- Gerenciador de pacotes (npm, yarn ou pnpm)

### Instalação

```bash
# Clone o repositório
git clone [https://github.com/SEU_USUARIO/gy.git](https://github.com/edinaldoGit/gy.git)

# Acesse a pasta do projeto
cd gymmi

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev

```