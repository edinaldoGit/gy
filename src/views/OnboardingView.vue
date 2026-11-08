<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/database/db'
import { ArrowRight, Camera } from 'lucide-vue-next'

const router = useRouter()
const showSplash = ref(true)

const form = ref({
  nome: '',
  idade: '',
  peso: '',
  altura: '',
  fotoPerfil: ''
})

onMounted(() => {
  setTimeout(() => {
    showSplash.value = false
  }, 2000)
})

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      form.value.fotoPerfil = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const triggerFileInput = () => {
  document.getElementById('fotoUpload')?.click()
}

const iniciarApp = async () => {
  if (!form.value.nome || !form.value.idade || !form.value.peso || !form.value.altura) return

  await db.perfil.add({
    nome: form.value.nome,
    idade: Number(form.value.idade),
    peso: Number(form.value.peso),
    altura: Number(form.value.altura),
    fotoPerfil: form.value.fotoPerfil || undefined,
    criadoEm: new Date()
  })

  router.push('/')
}
</script>

<template>
  <div class="fixed inset-0 flex flex-col items-center justify-center bg-whitesmoke-50 px-6 z-50">
    <transition name="fade" mode="out-in">
      
      <!-- Tela de Splash -->
      <div v-if="showSplash" class="flex flex-col items-center justify-center animate-pulse">
        <img src="@/assets/logo.png" alt="Logo Gy" class="w-32 h-32 mb-4 object-contain" />
      </div>

      <!-- Formulário de Cadastro -->
      <div v-else class="w-full max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-whitesmoke-950">Bem-vindo ao Gy</h2>
          <p class="text-whitesmoke-600 mt-2">Vamos configurar seu perfil para começarmos.</p>
        </div>

        <form @submit.prevent="iniciarApp" class="space-y-4">
          
          <!-- Upload de Foto -->
          <div class="flex flex-col items-center mb-6">
            <div 
              @click="triggerFileInput"
              class="relative w-24 h-24 rounded-full bg-whitesmoke-200 flex items-center justify-center border-2 border-dashed border-whitesmoke-400 cursor-pointer overflow-hidden group hover:bg-whitesmoke-300 transition-colors"
            >
              <img 
                v-if="form.fotoPerfil" 
                :src="form.fotoPerfil" 
                class="w-full h-full object-cover"
              />
              <div v-else class="flex flex-col items-center">
                <Camera :size="24" class="text-whitesmoke-500 group-hover:text-whitesmoke-700 transition-colors" />
                <span class="text-[10px] font-medium text-whitesmoke-500 mt-1">Opcional</span>
              </div>
            </div>
            <input 
              id="fotoUpload"
              type="file" 
              accept="image/*"
              class="hidden"
              @change="handleFileUpload"
            >
          </div>

          <!-- Campos de Texto -->
          <div>
            <label class="block text-sm font-semibold text-whitesmoke-700 mb-1">Como devemos te chamar?</label>
            <input 
              v-model="form.nome" 
              type="text" 
              required
              class="w-full bg-white border border-whitesmoke-300 rounded-xl px-4 py-3 text-whitesmoke-950 focus:outline-none focus:border-amethyst-500 focus:ring-2 focus:ring-amethyst-500/20 transition-all shadow-sm placeholder:text-whitesmoke-400"
              placeholder="Seu nome ou apelido"
            >
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-whitesmoke-700 mb-1">Idade</label>
              <input 
                v-model="form.idade" 
                type="number" 
                required
                class="w-full bg-white border border-whitesmoke-300 rounded-xl px-4 py-3 text-whitesmoke-950 focus:outline-none focus:border-amethyst-500 focus:ring-2 focus:ring-amethyst-500/20 transition-all shadow-sm placeholder:text-whitesmoke-400"
                placeholder="Ex: 24"
              >
            </div>
            <div>
              <label class="block text-sm font-semibold text-whitesmoke-700 mb-1">Altura (cm)</label>
              <input 
                v-model="form.altura" 
                type="number" 
                required
                class="w-full bg-white border border-whitesmoke-300 rounded-xl px-4 py-3 text-whitesmoke-950 focus:outline-none focus:border-amethyst-500 focus:ring-2 focus:ring-amethyst-500/20 transition-all shadow-sm placeholder:text-whitesmoke-400"
                placeholder="Ex: 175"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-whitesmoke-700 mb-1">Peso Atual (kg)</label>
            <input 
              v-model="form.peso" 
              type="number" 
              step="0.1"
              required
              class="w-full bg-white border border-whitesmoke-300 rounded-xl px-4 py-3 text-whitesmoke-950 focus:outline-none focus:border-amethyst-500 focus:ring-2 focus:ring-amethyst-500/20 transition-all shadow-sm placeholder:text-whitesmoke-400"
              placeholder="Ex: 70.5"
            >
          </div>

          <button 
            type="submit" 
            class="w-full bg-amethyst-500 hover:bg-amethyst-600 text-white font-bold py-4 rounded-xl mt-6 flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Começar meu treino
            <ArrowRight :size="20" class="ml-2" />
          </button>
        </form>
      </div>
    </transition>
  </div>
</template>