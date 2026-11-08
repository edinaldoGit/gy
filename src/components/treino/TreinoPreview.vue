<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useTreinoStore } from '@/stores/treinoStore'
import { Play, Dumbbell, Clock, Flame, ArrowRightLeft, X, Check, CalendarDays, Coffee, CheckCircle2 } from 'lucide-vue-next'

const router = useRouter()
const store = useTreinoStore()
// Puxando o status de finalizado e o treino de amanhã da Store
const { treinoHoje, fichasSalvas, modalTrocaAberto, treinoAmanha, treinoFinalizadoHoje } = storeToRefs(store)
const { efetuarTrocaTreino, getCorObj } = store

const querEmpurrarRotina = ref(false)

const labelsDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const formatarDias = (dias?: number[]) => {
  if (!dias || dias.length === 0) return 'Avulso'
  if (dias.length === 7) return 'Diário'
  return [...dias].sort().map(d => labelsDias[d]).join(', ')
}
</script>

<template>
  <div class="flex flex-col gap-6 animate-in slide-in-from-left-4 h-full pb-10">
    
    <div class="px-2 mt-2">
      <h2 class="text-2xl font-black text-whitesmoke-950">{{ treinoFinalizadoHoje ? 'Bom descanso!' : 'Pronto para suar?' }}</h2>
      <p class="text-sm text-whitesmoke-500 mt-1">Este é o seu planejamento para hoje.</p>
    </div>

    <!-- ESTADO ZERO: Usuário não tem nenhuma ficha cadastrada -->
    <div v-if="fichasSalvas.length === 0" class="bg-white rounded-[2rem] p-8 border border-whitesmoke-200 flex flex-col items-center justify-center text-center mt-4 mx-2">
      <img src="@/assets/logo.png" alt="Gy Logo" class="w-24 h-24 object-contain mb-4 hover:scale-110 transition-transform duration-300" />
      <h3 class="text-xl font-black text-whitesmoke-950">Bem-vindo ao Gy!</h3>
      <p class="text-sm font-medium text-whitesmoke-500 mt-2 mb-6">Para começar, precisamos criar o seu primeiro treino. É super rápido e fácil.</p>
      <button @click="router.push('/fichas')" class="w-full bg-cerulean-500 hover:bg-cerulean-600 text-white font-black text-sm py-4 rounded-2xl flex items-center justify-center transition-all active:scale-[0.98]">
        MONTAR MEU PRIMEIRO TREINO
      </button>
    </div>

    <!-- ESTADOS COM FICHAS CADASTRADAS (Hierarquia corrigida) -->
    <div v-else class="flex flex-col gap-8">
      
      <!-- ESTADO 1: TREINO FINALIZADO HOJE (Sobrepõe os outros se verdadeiro) -->
      <div v-if="treinoFinalizadoHoje" class="bg-white rounded-[2rem] p-8 border border-whitesmoke-200 flex flex-col items-center justify-center text-center mx-2">
        <div class="w-20 h-20 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500 mb-5 border border-emerald-100">
          <CheckCircle2 :size="40" stroke-width="2" />
        </div>
        <h3 class="text-xl font-black text-whitesmoke-950 leading-tight mb-2">Missão Cumprida!</h3>
        <p class="text-sm font-medium text-whitesmoke-500">Você já finalizou o treino de hoje. Lembre-se que o descanso adequado também constrói resultados.</p>
      </div>

      <!-- ESTADO 2: DIA DE DESCANSO (Se não treinou, e não tem ficha pra hoje) -->
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

      <!-- ESTADO 3: NORMAL (Tem treino agendado hoje) -->
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
          
          <button @click="store.iniciarTreino" class="w-full bg-white hover:bg-whitesmoke-50 font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2" :class="getCorObj(treinoHoje.corTema).text">
            <Play :size="22" /> INICIAR TREINO
          </button>
        </div>
      </div>


      <!-- PRÉVIA DO AMANHÃ (Fixo embaixo preenchendo a tela em qualquer estado) -->
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

    <!-- ========================================== -->
    <!-- MODAL (BOTTOM SHEET): TROCAR TREINO (Mantido igual) -->
    <!-- ========================================== -->
    <div v-if="modalTrocaAberto" class="fixed inset-0 z-40 bg-whitesmoke-950/20 backdrop-blur-sm animate-in fade-in duration-300" @click="modalTrocaAberto = false"></div>

    <div v-if="modalTrocaAberto" class="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.1)] max-h-[85vh] animate-in slide-in-from-bottom-full duration-300">
      <div class="w-full flex justify-center pt-3 pb-1 shrink-0">
        <div class="w-12 h-1.5 bg-whitesmoke-200 rounded-full"></div>
      </div>

      <div class="px-6 py-4 flex items-center justify-between border-b border-whitesmoke-100 shrink-0">
        <h3 class="font-black text-whitesmoke-950 text-lg">Substituir Treino</h3>
        <button @click="modalTrocaAberto = false" class="p-2 bg-whitesmoke-50 border border-whitesmoke-200 rounded-full text-whitesmoke-500 hover:text-whitesmoke-950">
          <X :size="18" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        
        <div @click="querEmpurrarRotina = !querEmpurrarRotina" class="flex items-start gap-4 bg-whitesmoke-50 p-4 rounded-2xl border transition-all cursor-pointer select-none" :class="querEmpurrarRotina ? 'border-cerulean-400 ring-2 ring-cerulean-50 bg-white' : 'border-whitesmoke-200'">
          <div class="w-6 h-6 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-0.5" :class="querEmpurrarRotina ? 'bg-cerulean-500 border-cerulean-500 text-white' : 'border-whitesmoke-300 bg-white'">
            <Check v-if="querEmpurrarRotina" :size="16" stroke-width="3" />
          </div>
          <div class="flex flex-col gap-0.5">
            <h4 class="text-sm font-bold text-whitesmoke-950 flex items-center gap-1.5"><CalendarDays :size="14" class="text-cerulean-500"/> Avançar Calendário</h4>
            <p class="text-[10px] font-medium text-whitesmoke-500 leading-tight">Empurra toda a sua rotina um dia para frente (O treino de ontem cai hoje, hoje cai amanhã...)</p>
          </div>
        </div>

        <h4 class="text-[11px] font-bold text-whitesmoke-400 uppercase tracking-widest mt-2 px-1">Selecione o treino de hoje</h4>
        
        <div class="flex flex-col gap-3">
          <div v-for="ficha in fichasSalvas" :key="ficha.id" @click="efetuarTrocaTreino(ficha, querEmpurrarRotina)" class="bg-white rounded-2xl p-4 border border-whitesmoke-200 flex items-center gap-4 cursor-pointer hover:border-whitesmoke-300 transition-colors relative overflow-hidden" :class="{'opacity-50 pointer-events-none bg-whitesmoke-50': ficha.id === treinoHoje?.id}">
            <div class="absolute left-0 top-0 bottom-0 w-1.5" :class="getCorObj(ficha.corTema).bg"></div>
            <div class="flex-1 min-w-0 ml-1.5">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="text-[9px] font-bold bg-whitesmoke-100 text-whitesmoke-500 px-1.5 py-0.5 rounded uppercase tracking-widest border border-whitesmoke-200">{{ formatarDias(ficha.diasDaSemana) }}</span>
                <span v-if="ficha.id === treinoHoje?.id" class="text-[9px] font-bold text-cerulean-500 uppercase tracking-widest">TREINO ATUAL</span>
              </div>
              <h4 class="text-base font-bold text-whitesmoke-950 truncate">{{ ficha.nome }}</h4>
              <p class="text-[10px] font-medium text-whitesmoke-500 mt-0.5">{{ ficha.foco }} • {{ ficha.exercicios.length }} ex</p>
            </div>
          </div>
        </div>
        
      </div>
    </div>

  </div>
</template>