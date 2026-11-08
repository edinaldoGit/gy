<script setup lang="ts">
import { useRoute } from 'vue-router'
import TopBar from '@/components/layout/TopBar.vue'

const route = useRoute()
</script>

<template>
  <div class="flex flex-col h-screen bg-whitesmoke-50 overflow-hidden">
    
    <TopBar v-if="route.path !== '/onboarding'" />

    <main class="flex-1 overflow-y-auto p-4 mt-4">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>