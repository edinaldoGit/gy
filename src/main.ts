import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router' 
import { popularCatalogoSeVazio } from './database/seed'

// Inicializa os dados base (Catálogo)
popularCatalogoSeVazio()

const app = createApp(App)
app.use(router)
app.mount('#app')