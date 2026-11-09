<script setup lang="ts">
import { feedback } from '@/composables/useFeedback'
import { confirmation } from '@/composables/useConfirm'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db, type Perfil } from '@/database/db'
import { UserRound, Ruler, Weight, CalendarDays, Activity, Trash2, ChartNoAxesCombined } from 'lucide-vue-next'
import SectionPageHeader from '@/components/layout/SectionPageHeader.vue'
import BackupDados from '@/components/perfil/BackupDados.vue'
import { comGravacaoGy } from '@/database/writeLock'
import EvolucaoCorporal from '@/components/perfil/EvolucaoCorporal.vue'
import AplicativoGy from '@/components/perfil/AplicativoGy.vue'

const router = useRouter()
const usuario = ref<Perfil | null>(null)
const carregandoPerfil = ref(true)
const mostrarEvolucao = ref(false)

onMounted(async () => {
  try { usuario.value = await db.perfil.toCollection().first() ?? null }
  finally { carregandoPerfil.value = false }
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
    action: () => comGravacaoGy(() => db.perfil.clear())
  })
  if (confirmado) { feedback.success('Dados de perfil excluídos.'); await router.push('/onboarding') }
}
</script>

<template>
  <EvolucaoCorporal v-if="usuario && mostrarEvolucao" @voltar="mostrarEvolucao = false" />

  <div v-else-if="usuario" class="flex flex-col gap-6 pb-20 animate-in fade-in duration-500">
    <SectionPageHeader titulo="Meu Perfil" subtitulo="Seus dados e evolução" tema="perfil" />
    
    <div class="flex flex-col items-center -mt-2">
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

    <BackupDados />

    <AplicativoGy />

    <button type="button" class="group flex w-full items-center gap-4 rounded-3xl border border-bubblegum-100 bg-white p-4 text-left shadow-sm transition hover:border-bubblegum-300 hover:bg-bubblegum-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bubblegum-600 sm:p-5" @click="mostrarEvolucao = true">
      <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bubblegum-50 text-bubblegum-600 transition group-hover:bg-bubblegum-100"><ChartNoAxesCombined :size="23" /></span>
      <span class="min-w-0 flex-1"><span class="block font-black text-whitesmoke-950">Evolução corporal</span><span class="mt-0.5 block text-sm text-whitesmoke-500">Registre peso e medidas ao longo do tempo</span></span>
      <span class="text-sm font-bold text-bubblegum-600">Abrir</span>
    </button>

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
  
  <div v-else-if="carregandoPerfil" class="flex flex-col items-center justify-center h-64">
    <div class="w-8 h-8 border-4 border-whitesmoke-200 border-t-bubblegum-500 rounded-full animate-spin"></div>
  </div>
  <div v-else class="flex flex-col gap-5 pb-20 animate-in fade-in duration-500">
    <SectionPageHeader titulo="Meu Perfil" subtitulo="Restaure seus dados ou configure o Gy" tema="perfil" />
    <p class="px-2 text-sm leading-relaxed text-whitesmoke-600">Você pode restaurar um backup de outro dispositivo ou concluir o cadastro para começar a usar o Gy.</p>
    <BackupDados />
    <button type="button" class="min-h-11 rounded-2xl border border-whitesmoke-200 bg-white px-4 text-sm font-bold text-whitesmoke-700" @click="router.push('/onboarding')">Ir para o cadastro</button>
  </div>
</template>
