<script setup lang="ts">
import { ref } from 'vue'
import { feedback } from '@/composables/useFeedback'
import { storeToRefs } from 'pinia'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { ArrowRight, Camera } from 'lucide-vue-next'

const store = useOnboardingStore()
const { form } = storeToRefs(store)
const { handleFileUpload, salvarPerfil } = store

const triggerFileInput = () => {
  document.getElementById('fotoUpload')?.click()
}

const emit = defineEmits(['concluido'])

const processando = ref(false)
const erro = ref('')
const submeter = async () => {
  if (processando.value) return
  processando.value = true
  erro.value = ''
  try {
    const sucesso = await salvarPerfil()
    if (sucesso) { feedback.success('Perfil salvo com sucesso!'); emit('concluido') }
  } catch {
    erro.value = 'Não foi possível salvar seu perfil. Tente novamente.'
  } finally { processando.value = false }
}

</script>

<template>
  <div class="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">

    <div class="flex flex-col items-center text-center mb-8">
      <p class="text-xs font-bold text-whitesmoke-400 uppercase tracking-widest mb-2">Bem-vindo ao</p>
      <img
        src="@/assets/logo.png"
        alt="Gy Logo"
        class="h-20 object-contain hover:scale-105 transition-transform duration-300"
      />
      <p class="text-whitesmoke-600 text-sm mt-3 font-medium">Vamos configurar seu perfil para começarmos.</p>
    </div>

    <p v-if="erro" role="alert" class="mb-3 rounded-xl bg-bubblegum-50 p-3 text-sm text-bubblegum-700">{{ erro }}</p>
    <form @submit.prevent="submeter" class="space-y-4">

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
        type="submit" :disabled="processando" :aria-busy="processando"
        class="w-full bg-amethyst-500 hover:bg-amethyst-600 text-white font-bold py-4 rounded-xl mt-6 flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
      >
        Começar meu treino
        <ArrowRight :size="20" class="ml-2" />
      </button>
    </form>
  </div>
</template>
