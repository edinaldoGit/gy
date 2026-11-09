<script setup lang="ts">
import { Check, Plus, Dumbbell } from 'lucide-vue-next'
import type { ExercicioCatalogo } from '@/database/db'

defineProps<{
  exercicio: ExercicioCatalogo
  selecionado: boolean
  imagem?: string
  cor: string
  classesSelecao: { border: string; bg: string; text: string }
}>()
defineEmits<{ selecionar: [] }>()
</script>

<template>
  <button type="button" :aria-pressed="selecionado" class="group relative flex min-h-48 min-w-0 flex-col overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-4" :class="selecionado ? [classesSelecao.border, classesSelecao.bg] : 'border-whitesmoke-200 hover:border-whitesmoke-300'" :style="{ outlineColor: cor }" @click="$emit('selecionar')">
    <span class="relative flex h-20 w-full shrink-0 items-center overflow-hidden bg-whitesmoke-50 px-4" :style="{ backgroundColor: `${cor}12` }">
      <span class="absolute -left-5 -top-7 h-28 w-28 rounded-full" :style="{ backgroundColor: `${cor}0d` }" />
      <img v-if="imagem" :src="imagem" alt="" class="absolute inset-y-0 right-0 h-full w-3/4 object-cover object-right opacity-80 transition duration-300 group-hover:scale-105" />
      <span class="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 shadow-sm" :style="{ color: cor }"><Dumbbell :size="21" :stroke-width="1.8" /></span>
      <span class="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition" :class="selecionado ? classesSelecao.text : 'bg-white text-whitesmoke-500'"><Check v-if="selecionado" :size="16" :stroke-width="3" /><Plus v-else :size="16" /></span>
    </span>
    <span class="relative flex w-full flex-1 flex-col gap-2.5 p-3.5">
      <span class="text-[9px] font-bold uppercase tracking-wider" :style="{ color: cor }">{{ exercicio.grupoMuscular }}</span>
      <span class="block break-words text-xs font-bold leading-relaxed text-whitesmoke-950">{{ exercicio.nome }}</span>
      <span class="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        <span v-if="exercicio.equipamento" class="rounded-lg bg-whitesmoke-100 px-2 py-1 text-[9px] font-medium text-whitesmoke-600">{{ exercicio.equipamento }}</span>
        <span v-if="selecionado" class="text-[9px] font-bold" :style="{ color: cor }">Selecionado</span>
      </span>
    </span>
  </button>
</template>
