<script setup lang="ts">
import ModalSheetHeader from '@/components/layout/ModalSheetHeader.vue'
import { modalSheetBackdrop, modalSheetPanel } from '@/components/layout/modalSheetStyles'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useTreinoStore } from '@/stores/treinoStore'
import { Play, Dumbbell, Clock, Flame, ArrowRightLeft, CalendarDays, Coffee, CheckCircle2 } from 'lucide-vue-next'
import SectionPageHeader from '@/components/layout/SectionPageHeader.vue'

const router = useRouter()
const store = useTreinoStore()
const { treinoHoje, fichasSalvas, fichaAtual, modalTrocaAberto, treinoAmanha, treinoFinalizadoHoje, estadoPersistencia, erroPersistencia } = storeToRefs(store)
const { efetuarTrocaTreino, getCorObj } = store

const labelsDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const formatarDias = (dias?: number[]) => {
  if (!dias || dias.length === 0) return 'Avulso'
  if (dias.length === 7) return 'Diário'
  return [...dias].sort().map(d => labelsDias[d]).join(', ')
}
</script>

<template>
  <div class="flex flex-col gap-6 animate-in slide-in-from-left-4 pb-10">
    <SectionPageHeader titulo="Treino" :subtitulo="treinoFinalizadoHoje ? 'Bom descanso! · Planejamento do dia' : 'Seu planejamento para hoje'" tema="treino" />

    <div v-if="estadoPersistencia === 'erro'" role="alert" class="mx-2 flex items-center justify-between gap-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
      <span>{{ erroPersistencia }}</span>
      <button type="button" @click="store.carregarTreinoDoDia" class="shrink-0 rounded-lg bg-white px-3 py-2 font-bold text-red-700 shadow-sm">
        Tentar novamente
      </button>
    </div>

    <div v-if="!fichaAtual" class="bg-white rounded-[2rem] p-8 border border-whitesmoke-200 flex flex-col items-center justify-center text-center mt-4 mx-2">
      <img src="@/assets/logo.png" alt="Gy Logo" class="w-24 h-24 object-contain mb-4 hover:scale-110 transition-transform duration-300" />
      <h3 class="text-xl font-black text-whitesmoke-950">Escolha sua ficha atual</h3>
      <p class="text-sm font-medium text-whitesmoke-500 mt-2 mb-6">A aba Fichas mostra seus programas. Selecione qual rotina está valendo agora.</p>
      <button @click="router.push('/fichas')" class="w-full bg-cerulean-500 hover:bg-cerulean-600 text-white font-black text-sm py-4 rounded-2xl flex items-center justify-center transition-all active:scale-[0.98]">
        ABRIR MINHAS FICHAS
      </button>
    </div>

    <div v-else class="flex flex-col gap-8">
      
      <!-- O treino concluído tem precedência sobre os estados de descanso e treino agendado. -->
      <div v-if="treinoFinalizadoHoje" class="bg-white rounded-[2rem] p-8 border border-whitesmoke-200 flex flex-col items-center justify-center text-center mx-2">
        <div class="w-20 h-20 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500 mb-5 border border-emerald-100">
          <CheckCircle2 :size="40" stroke-width="2" />
        </div>
        <h3 class="text-xl font-black text-whitesmoke-950 leading-tight mb-2">Missão Cumprida!</h3>
        <p class="text-sm font-medium text-whitesmoke-500">Você já finalizou o treino de hoje. Lembre-se que o descanso adequado também constrói resultados.</p>
      </div>

      <div v-else-if="!treinoHoje" class="bg-white rounded-[2rem] p-8 border border-whitesmoke-200 flex flex-col items-center justify-center text-center mx-2">
        <div class="w-16 h-16 bg-whitesmoke-100 rounded-[1.5rem] flex items-center justify-center text-whitesmoke-400 mb-4 border border-whitesmoke-200">
          <Coffee :size="32" />
        </div>
        <h3 class="text-lg font-bold text-whitesmoke-950">Descanso Merecido!</h3>
        <p class="text-sm font-medium text-whitesmoke-500 mt-2">Não há treinos agendados para hoje. Se quiser treinar mesmo assim, escolha um treino da lista.</p>
        <button @click="modalTrocaAberto = true" class="mt-6 bg-whitesmoke-100 text-whitesmoke-700 font-bold text-xs px-6 py-3 rounded-xl hover:bg-whitesmoke-200 transition-colors flex items-center gap-2">
          <ArrowRightLeft :size="16" /> TREINAR MESMO ASSIM
        </button>
      </div>

      <div v-else class="rounded-[2rem] p-1 relative overflow-hidden" :class="getCorObj(treinoHoje.corTema).bg">
        <div class="absolute -right-6 -top-6 text-white/10 rotate-12 pointer-events-none">
          <Dumbbell :size="120" stroke-width="1.5" />
        </div>
        
        <div class="bg-black/10 rounded-[1.8rem] p-5 backdrop-blur-sm border border-white/10 relative z-10 flex flex-col gap-5">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-md">Treino do Dia</span>
              <button @click="modalTrocaAberto = true" class="flex items-center gap-1 text-[10px] font-bold text-white bg-black/20 hover:bg-black/30 px-2.5 py-1 rounded-full transition-colors backdrop-blur-md">
                <ArrowRightLeft :size="12" /> TROCAR
              </button>
            </div>
            <h3 class="text-3xl font-black text-white mt-2">{{ treinoHoje.nome }}</h3>
            <p class="text-white/80 font-medium mt-1">{{ treinoHoje.foco }}</p>
          </div>
          
          <div class="flex items-center gap-4 bg-black/20 rounded-2xl p-3 border border-white/5">
            <div class="flex items-center gap-2 text-white">
              <Clock :size="18" class="text-white/70" />
              <span class="text-sm font-bold">45-60 <span class="font-normal text-white/70 text-xs">min</span></span>
            </div>
            <div class="w-px h-6 bg-white/10"></div>
            <div class="flex items-center gap-2 text-white">
              <Flame :size="18" class="text-white/70" />
              <span class="text-sm font-bold">{{ treinoHoje.exercicios.length }} <span class="font-normal text-white/70 text-xs">ex</span></span>
            </div>
          </div>
          
          <button @click="store.iniciarTreino()" class="w-full bg-white hover:bg-whitesmoke-50 font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2" :class="getCorObj(treinoHoje.corTema).text">
            <Play :size="22" /> INICIAR TREINO
          </button>
        </div>
      </div>


      <div class="px-2 flex flex-col gap-3">
        <h3 class="text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest">Próximo na agenda (Amanhã)</h3>
        
        <div v-if="treinoAmanha" class="bg-white rounded-[1.5rem] p-4 border border-whitesmoke-200 flex items-center gap-4">
          <div class="w-1.5 h-12 rounded-full" :class="getCorObj(treinoAmanha.corTema).bg"></div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-whitesmoke-950 truncate">{{ treinoAmanha.nome }}</h4>
            <p class="text-[10px] text-whitesmoke-500 mt-0.5 font-medium">{{ treinoAmanha.exercicios.length }} exercícios • {{ treinoAmanha.foco }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-whitesmoke-50 flex items-center justify-center border border-whitesmoke-100">
            <CalendarDays :size="18" class="text-whitesmoke-400" />
          </div>
        </div>
        
        <div v-else class="bg-whitesmoke-50 rounded-[1.5rem] p-4 border border-whitesmoke-200 border-dashed flex items-center gap-4">
           <div class="w-10 h-10 rounded-xl bg-whitesmoke-100 flex items-center justify-center text-whitesmoke-400 border border-whitesmoke-200">
             <Coffee :size="20" />
           </div>
           <div>
             <h4 class="font-bold text-whitesmoke-950 text-sm">Dia de Descanso</h4>
             <p class="text-[10px] text-whitesmoke-500 mt-0.5 font-medium">Nenhum treino programado.</p>
           </div>
        </div>
      </div>

    </div>

    <Transition name="gy-modal" :duration="{ enter: 420, leave: 280 }" appear><div v-if="modalTrocaAberto" :class="modalSheetBackdrop" @click="modalTrocaAberto = false"></div></Transition>

    <Transition name="gy-sheet" appear><div v-if="modalTrocaAberto" role="dialog" aria-modal="true" aria-labelledby="troca-treino-titulo" :class="modalSheetPanel">
      <ModalSheetHeader titulo="Substituir Treino" subtitulo="Escolha o treino para a sessão de hoje." etiqueta="Treino" cor-classe="bg-amethyst-500" titulo-id="troca-treino-titulo" @fechar="modalTrocaAberto = false" />

      <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        
        <p class="rounded-xl bg-whitesmoke-50 p-3 text-xs text-whitesmoke-500">Escolher outro treino vale apenas para esta sessão. Sua programação semanal permanece igual.</p>
        <h4 class="text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mt-2 px-1">Treinos da ficha atual</h4>
        
        <div class="flex flex-col gap-3">
          <div v-for="treino in fichasSalvas" :key="treino.id" @click="efetuarTrocaTreino(treino)" class="bg-white rounded-2xl p-4 border border-whitesmoke-200 flex items-center gap-4 cursor-pointer hover:border-whitesmoke-300 transition-colors relative overflow-hidden" :class="{'opacity-50 pointer-events-none bg-whitesmoke-50': treino.id === treinoHoje?.id}">
            <div class="absolute left-0 top-0 bottom-0 w-1.5" :class="getCorObj(treino.corTema).bg"></div>
            <div class="flex-1 min-w-0 ml-1.5">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="text-[9px] font-bold bg-whitesmoke-100 text-whitesmoke-500 px-1.5 py-0.5 rounded uppercase tracking-widest border border-whitesmoke-200">{{ formatarDias(treino.diasDaSemana) }}</span>
                <span v-if="treino.id === treinoHoje?.id" class="text-[9px] font-bold text-cerulean-500 uppercase tracking-widest">TREINO ATUAL</span>
              </div>
              <h4 class="text-base font-bold text-whitesmoke-950 truncate">{{ treino.nome }}</h4>
              <p class="text-[10px] font-medium text-whitesmoke-500 mt-0.5">{{ treino.foco }} • {{ treino.exercicios.length }} ex</p>
            </div>
          </div>
        </div>
        
      </div>
    </div></Transition>

  </div>
</template>
