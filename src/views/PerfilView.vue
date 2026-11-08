<script setup lang="ts">
import { feedback } from '@/composables/useFeedback'
import { confirmation } from '@/composables/useConfirm'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db, type Perfil } from '@/database/db'
import { UserRound, Ruler, Weight, CalendarDays, Activity, Trash2 } from 'lucide-vue-next'
import SectionPageHeader from '@/components/layout/SectionPageHeader.vue'

const router = useRouter()
const usuario = ref<Perfil | null>(null)

onMounted(async () => {
  const perfil = await db.perfil.toCollection().first()
  if (perfil) {
    usuario.value = perfil
  }
})

const imc = computed(() => {
  if (!usuario.value) return '0.0'
  const alturaEmMetros = usuario.value.altura / 100
  const calculo = usuario.value.peso / (alturaEmMetros * alturaEmMetros)
  return calculo.toFixed(1)
})

const dataCriacao = computed(() => {
  if (!usuario.value?.criadoEm) return ''
  return new Intl.DateTimeFormat('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  }).format(usuario.value.criadoEm)
})

const apagarDados = async () => {
  const confirmado = await confirmation.ask({
    title: 'Excluir seus dados de perfil?',
    message: 'Seu nome, foto, idade, peso e altura serão removidos deste dispositivo. Essa ação não poderá ser desfeita.',
    details: 'Fichas, treinos e histórico permanecerão armazenados. Você voltará ao cadastro inicial.',
    variant: 'error', icon: 'trash', cancelText: 'Manter perfil', confirmText: 'Excluir perfil',
    action: () => db.perfil.clear()
  })
  if (confirmado) { feedback.success('Dados de perfil excluídos.'); await router.push('/onboarding') }
}
</script>

<template>
  <div v-if="usuario" class="flex flex-col gap-6 pb-20 animate-in fade-in duration-500">
    <SectionPageHeader titulo="Meu Perfil" subtitulo="Seus dados e evolução" tema="perfil" />
    
    <div class="flex flex-col items-center mt-4">
      <div class="w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-white relative z-10">
        <img v-if="usuario.fotoPerfil" :src="usuario.fotoPerfil" class="w-full h-full object-cover" />
        <UserRound v-else :size="48" class="text-whitesmoke-300" />
      </div>
      
      <div class="bg-white w-full max-w-sm rounded-3xl pt-16 pb-6 px-6 -mt-14 shadow-sm flex flex-col items-center border border-whitesmoke-200">
        <h2 class="text-2xl font-black text-whitesmoke-950">{{ usuario.nome }}</h2>
        <div class="flex items-center gap-1.5 text-whitesmoke-500 mt-1">
          <CalendarDays :size="14" />
          <span class="text-xs font-medium capitalize">Membro desde {{ dataCriacao }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white rounded-3xl p-5 shadow-sm border border-whitesmoke-200 flex flex-col gap-3">
        <div class="w-10 h-10 rounded-full bg-bubblegum-50 flex items-center justify-center text-bubblegum-500">
          <Ruler :size="20" />
        </div>
        <div>
          <span class="block text-xs font-bold text-whitesmoke-400 uppercase tracking-wider mb-0.5">Altura</span>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-black text-whitesmoke-950">{{ usuario.altura }}</span>
            <span class="text-sm font-bold text-whitesmoke-500">cm</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-3xl p-5 shadow-sm border border-whitesmoke-200 flex flex-col gap-3">
        <div class="w-10 h-10 rounded-full bg-bubblegum-50 flex items-center justify-center text-bubblegum-500">
          <Weight :size="20" />
        </div>
        <div>
          <span class="block text-xs font-bold text-whitesmoke-400 uppercase tracking-wider mb-0.5">Peso</span>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-black text-whitesmoke-950">{{ usuario.peso }}</span>
            <span class="text-sm font-bold text-whitesmoke-500">kg</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-3xl p-5 shadow-sm border border-whitesmoke-200 flex flex-col gap-3">
        <div class="w-10 h-10 rounded-full bg-bubblegum-50 flex items-center justify-center text-bubblegum-500">
          <UserRound :size="20" />
        </div>
        <div>
          <span class="block text-xs font-bold text-whitesmoke-400 uppercase tracking-wider mb-0.5">Idade</span>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-black text-whitesmoke-950">{{ usuario.idade }}</span>
            <span class="text-sm font-bold text-whitesmoke-500">anos</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-3xl p-5 shadow-sm border border-whitesmoke-200 flex flex-col gap-3">
        <div class="w-10 h-10 rounded-full bg-bubblegum-50 flex items-center justify-center text-bubblegum-500">
          <Activity :size="20" />
        </div>
        <div>
          <span class="block text-xs font-bold text-whitesmoke-400 uppercase tracking-wider mb-0.5">IMC</span>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-black text-whitesmoke-950">{{ imc }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4">
      <button 
        @click="apagarDados"
        class="w-full bg-white border border-red-100 text-red-500 hover:bg-red-50 font-bold py-4 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-[0.98]"
      >
        <Trash2 :size="20" class="mr-2" />
        Excluir dados do perfil
      </button>
      <p class="text-[10px] text-center text-whitesmoke-400 mt-3 px-4">
        Remove somente seus dados de perfil. Fichas, treinos e histórico permanecem neste dispositivo.
      </p>
    </div>

  </div>
  
  <div v-else class="flex flex-col items-center justify-center h-64">
    <div class="w-8 h-8 border-4 border-whitesmoke-200 border-t-bubblegum-500 rounded-full animate-spin"></div>
  </div>
</template>
