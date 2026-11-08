<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

defineProps<{
  titulo: string
  subtitulo: string
  corTemaBg: string // Ex: 'bg-cerulean-500' ou a classe de fundo vinda do tema
  onVoltar: () => void
}>()
</script>

<template>
  <div class="px-2 pt-2 shrink-0">
    <div 
      class="flex items-center gap-4 px-3 py-3 rounded-[2rem] shadow-sm transition-colors duration-500"
      :class="corTemaBg"
    >
      <!-- Botão Voltar -->
      <button 
        @click="onVoltar" 
        class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors shrink-0 active:scale-95"
      >
        <ArrowLeft :size="20" class="text-white" />
      </button>

      <!-- Textos do Cabeçalho -->
      <div class="flex-1 flex items-center justify-between min-w-0 pr-1">
        <div class="flex flex-col truncate">
          <h2 class="text-xl font-black text-white leading-tight truncate">
            {{ titulo }}
          </h2>
          <p class="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-0.5">
            {{ subtitulo }}
          </p>
        </div>

        <!-- Slot para ações à direita (botão de adicionar, etc.) -->
        <div class="shrink-0 flex items-center">
          <slot name="acoes" />
        </div>
      </div>
    </div>
  </div>
</template>