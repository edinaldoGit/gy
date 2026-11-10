import { createRouter, createWebHistory } from 'vue-router'
import { db } from '@/database/db'

const routes = [
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/views/OnboardingView.vue')
  },
  {
    path: '/',
    name: 'Treino',
    component: () => import('@/views/TreinoView.vue')
  },
  {
    path: '/fichas',
    name: 'Fichas',
    component: () => import('@/views/FichasView.vue')
  },
  {
    path: '/historico',
    name: 'Historico',
    component: () => import('@/views/HistoricoView.vue')
  },
  { path: '/evolucao', name: 'Evolucao', component: () => import('@/views/EvolucaoView.vue') },
  {
    path: '/perfil',
    name: 'Perfil',
    component: () => import('@/views/PerfilView.vue')
  }
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

let acessoPorCompartilhamento = false
router.beforeEach(async (to, _from, next) => {
  const caminho = to.path.replace(/\/$/, '') || '/'
  if (caminho === '/fichas' && to.hash.startsWith('#gy-ficha=')) acessoPorCompartilhamento = true
  if (caminho !== '/fichas') acessoPorCompartilhamento = false
  if (caminho === '/onboarding' || caminho === '/perfil' || caminho === '/fichas' && acessoPorCompartilhamento) {
    next()
    return
  }

  const perfis = await db.perfil.toArray()
  
  if (perfis.length === 0) {
    next('/onboarding')
  } else {
    next()
  }
})
