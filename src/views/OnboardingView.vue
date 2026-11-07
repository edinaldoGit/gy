<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/database/db'
import { ArrowRight } from 'lucide-vue-next'

const router = useRouter()
const showSplash = ref(true)

const form = ref({
  nome: '',
  idade: '',
  peso: '',
  altura: ''
})

onMounted(() => {
  setTimeout(() => {
    showSplash.value = false
  }, 2000)
})

const iniciarApp = async () => {
  if (!form.value.nome || !form.value.idade || !form.value.peso || !form.value.altura) return

  await db.perfil.add({
    nome: form.value.nome,
    idade: Number(form.value.idade),
    peso: Number(form.value.peso),
    altura: Number(form.value.altura),
    criadoEm: new Date()
  })

  router.push('/')
}
</script>

<template>
  <div class="fixed inset-0 flex flex-col items-center justify-center bg-whitesmoke-950 px-6 z-50">
    <transition name="fade" mode="out-in">
      <div v-if="showSplash" class="flex flex-col items-center justify-center animate-pulse">
        <img src="@/assets/logo.png" alt="Logo Gy" class="w-32 h-32 mb-4 object-contain" />
      </div>

      <div v-else class="w-full max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-whitesmoke-50">Bem-vindo ao Gy</h2>
          <p class="text-whitesmoke-300 mt-2">Vamos configurar seu perfil para começarmos.</p>
        </div>

        <form @submit.prevent="iniciarApp" class="space-y-4">
          <div>
            <label class="block text-sm text-whitesmoke-300 mb-1">Como devemos te chamar?</label>
            <input 
              v-model="form.nome" 
              type="text" 
              required
              class="w-full bg-whitesmoke-900 border border-whitesmoke-800 rounded-xl px-4 py-3 text-whitesmoke-50 focus:outline-none focus:border-amethyst-500 focus:ring-1 focus:ring-amethyst-500 transition-colors"
              placeholder="Seu nome ou apelido"
            >
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-whitesmoke-300 mb-1">Idade</label>
              <input 
                v-model="form.idade" 
                type="number" 
                required
                class="w-full bg-whitesmoke-900 border border-whitesmoke-800 rounded-xl px-4 py-3 text-whitesmoke-50 focus:outline-none focus:border-amethyst-500 focus:ring-1 focus:ring-amethyst-500 transition-colors"
                placeholder="Ex: 24"
              >
            </div>
            <div>
              <label class="block text-sm text-whitesmoke-300 mb-1">Altura (cm)</label>
              <input 
                v-model="form.altura" 
                type="number" 
                required
                class="w-full bg-whitesmoke-900 border border-whitesmoke-800 rounded-xl px-4 py-3 text-whitesmoke-50 focus:outline-none focus:border-amethyst-500 focus:ring-1 focus:ring-amethyst-500 transition-colors"
                placeholder="Ex: 175"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm text-whitesmoke-300 mb-1">Peso Atual (kg)</label>
            <input 
              v-model="form.peso" 
              type="number" 
              step="0.1"
              required
              class="w-full bg-whitesmoke-900 border border-whitesmoke-800 rounded-xl px-4 py-3 text-whitesmoke-50 focus:outline-none focus:border-amethyst-500 focus:ring-1 focus:ring-amethyst-500 transition-colors"
              placeholder="Ex: 70.5"
            >
          </div>

          <button 
            type="submit" 
            class="w-full bg-amethyst-500 hover:bg-amethyst-600 text-whitesmoke-50 font-bold py-4 rounded-xl mt-6 flex items-center justify-center transition-colors"
          >
            Começar meu treino
            <ArrowRight :size="20" class="ml-2" />
          </button>
        </form>
      </div>
    </transition>
  </div>
</template>