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
  {
    path: '/perfil',
    name: 'Perfil',
    component: () => import('@/views/PerfilView.vue')
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  if (to.path === '/onboarding' || to.path === '/perfil') {
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
