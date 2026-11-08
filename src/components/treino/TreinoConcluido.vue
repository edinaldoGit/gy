<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useTreinoStore } from '@/stores/treinoStore'
import { Trophy, Clock, Dumbbell, CheckCircle2 } from 'lucide-vue-next'
import PagePillHeader from '@/components/layout/PagePillHeader.vue'

const store = useTreinoStore()
const { treinoHoje, cronometroFormatado } = storeToRefs(store)

const voltarParaInicio = () => {
  store.estadoAtual = 'preview'
}
</script>

<template>
  <div class="flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
    <PagePillHeader titulo="Resumo do treino" subtitulo="Sessão concluída" tema="treino" mostrar-voltar @voltar="voltarParaInicio" />
    
    <div class="flex flex-col items-center justify-center pt-8 pb-6">
      <div class="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center border border-emerald-100 mb-6 relative">
        <Trophy :size="40" class="text-emerald-500" stroke-width="1.5" />
        <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100">
          <CheckCircle2 :size="20" stroke-width="2" />
        </div>
      </div>
      <h2 class="text-3xl font-black text-whitesmoke-950 text-center leading-tight">Treino Finalizado<br>com Sucesso!</h2>
      <p class="text-whitesmoke-500 text-center mt-3 font-medium text-sm px-4">O suor de hoje é o resultado de amanhã. Excelente trabalho no <strong class="text-whitesmoke-950">{{ treinoHoje?.nome }}</strong>.</p>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-8">
      <div class="bg-white p-4 rounded-3xl border border-whitesmoke-200 flex flex-col items-center justify-center text-center">
        <Clock :size="20" class="text-amethyst-500 mb-2" />
        <span class="text-2xl font-black text-whitesmoke-950 font-mono">{{ cronometroFormatado }}</span>
        <span class="text-[10px] font-bold text-whitesmoke-400 uppercase tracking-widest mt-1">Duração Total</span>
      </div>
      <div class="bg-white p-4 rounded-3xl border border-whitesmoke-200 flex flex-col items-center justify-center text-center">
        <Dumbbell :size="20" class="text-orange-500 mb-2" />
        <span class="text-2xl font-black text-whitesmoke-950">{{ treinoHoje?.exercicios.length }}</span>
        <span class="text-[10px] font-bold text-whitesmoke-400 uppercase tracking-widest mt-1">Exercícios Feitos</span>
      </div>
    </div>

  </div>
</template>
