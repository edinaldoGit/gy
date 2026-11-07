<script setup lang="ts">
import { useRoute } from 'vue-router';
import { Dumbbell, ClipboardList, History, User } from 'lucide-vue-next';

const route = useRoute();

const navItems = [
  { name: 'Treinar', path: '/', icon: Dumbbell },
  { name: 'Fichas', path: '/fichas', icon: ClipboardList },
  { name: 'Histórico', path: '/historico', icon: History },
  { name: 'Perfil', path: '/perfil', icon: User }
];
</script>

<template>
  <!-- Container principal, ocupa 100% da altura da tela -->
  <div class="flex flex-col h-screen bg-whitesmoke-950">
    
    <!-- Área de conteúdo principal (rola se houver muito conteúdo) -->
    <!-- Adicionamos pb-20 para o conteúdo não ficar escondido atrás da barra -->
    <main class="flex-1 overflow-y-auto pb-20 px-4">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Barra de Navegação Inferior (Bottom Navigation) -->
    <nav v-if="route.path !== '/onboarding'" class="fixed bottom-0 w-full h-16 bg-whitesmoke-900 border-t border-whitesmoke-800 flex justify-around items-center px-2 safe-area-bottom z-40">
      <router-link 
        v-for="item in navItems" 
        :key="item.path" 
        :to="item.path"
        class="flex flex-col items-center justify-center w-full h-full transition-colors duration-200"
        :class="route.path === item.path ? 'text-amethyst-500' : 'text-whitesmoke-400 hover:text-whitesmoke-200'"
      >
        <component :is="item.icon" :size="24" :stroke-width="route.path === item.path ? 2.5 : 2" />
        <span class="text-[10px] mt-1 font-medium">{{ item.name }}</span>
      </router-link>
    </nav>
  </div>
</template>

<style>
/* Transição suave entre as telas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Garante espaço no iOS (iPhone) para não sobrepor a barrinha nativa */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
  height: calc(4rem + env(safe-area-inset-bottom));
}
</style>