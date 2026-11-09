<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useOnboardingStore } from '@/stores/onboardingStore'

import SplashLogo from '@/components/onboarding/SplashLogo.vue'
import OnboardingForm from '@/components/onboarding/OnboardingForm.vue'

const router = useRouter()
const store = useOnboardingStore()
const { showSplash } = storeToRefs(store)

onMounted(() => {
  setTimeout(() => {
    showSplash.value = false
  }, 2000)
})

const finalizarESair = () => {
  router.push('/')
}
</script>

<template>
  <div class="fixed inset-0 flex flex-col items-center justify-center bg-whitesmoke-50 px-6 z-50">
    <transition name="fade" mode="out-in">
      <SplashLogo v-if="showSplash" />
      <OnboardingForm v-else @concluido="finalizarESair" @restaurar="router.push('/perfil')" />
    </transition>
  </div>
</template>
