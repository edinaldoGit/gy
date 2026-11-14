<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { HistoricoTreino } from '@/database/db'
import { diasDoMes, sessoesPorDia } from '@/utils/calendarioHistorico'
import { dataLocalHoje, formatarDataCivil } from '@/utils/evolucao'
const props = defineProps<{ sessoes: HistoricoTreino[]; selecionado: string | null }>()
const emit = defineEmits<{ selecionar: [dia: string | null] }>()
const mes = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const dias = computed(() => diasDoMes(mes.value.getFullYear(), mes.value.getMonth()))
const registros = computed(() => sessoesPorDia(props.sessoes))
const total = computed(() => dias.value.filter(d => d && registros.value.has(d)).length)
const titulo = computed(() => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(mes.value))
function navegar(delta: number) { mes.value = new Date(mes.value.getFullYear(), mes.value.getMonth() + delta, 1) }
</script>
<template>
  <section class="rounded-3xl border border-teal-100 bg-white p-4 shadow-sm sm:p-5" aria-label="Calendário de treinos">
    <div class="mb-3 flex items-center justify-between gap-2"><button type="button" aria-label="Mês anterior" class="flex h-11 w-11 items-center justify-center rounded-xl text-teal-700 hover:bg-teal-50" @click="navegar(-1)"><ChevronLeft :size="20" /></button><div class="text-center"><h2 class="text-sm font-bold capitalize text-whitesmoke-950" aria-live="polite">{{ titulo }}</h2><p class="text-xs text-teal-700">{{ total }} {{ total === 1 ? 'dia treinado' : 'dias treinados' }}</p></div><button type="button" aria-label="Próximo mês" class="flex h-11 w-11 items-center justify-center rounded-xl text-teal-700 hover:bg-teal-50" @click="navegar(1)"><ChevronRight :size="20" /></button></div>
    <div class="grid grid-cols-7 gap-1 text-center text-xs"><span v-for="dia in ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']" :key="dia" class="pb-2 font-bold text-whitesmoke-500">{{ dia }}</span><template v-for="(dia, i) in dias" :key="dia ?? `vazio-${i}`"><button v-if="dia" type="button" :aria-label="`${formatarDataCivil(dia)}: ${registros.get(dia)?.length ?? 0} ${registros.get(dia)?.length === 1 ? 'treino' : 'treinos'}`" :aria-current="dia === dataLocalHoje() ? 'date' : undefined" :aria-pressed="selecionado === dia" class="relative flex min-h-10 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition sm:min-h-11" :class="selecionado === dia ? 'border-teal-600 bg-teal-600 text-white' : registros.has(dia) ? 'border-transparent bg-teal-50 text-teal-800' : dia === dataLocalHoje() ? 'border-teal-500 text-teal-700' : 'border-transparent text-whitesmoke-600 hover:bg-whitesmoke-50'" @click="emit('selecionar', selecionado === dia ? null : dia)">{{ Number(dia.slice(-2)) }}<span v-if="registros.has(dia)" class="absolute bottom-1 h-1 w-1 rounded-full bg-current" /></button><span v-else aria-hidden="true" /></template></div>
    <button v-if="selecionado" type="button" class="mt-3 min-h-11 w-full rounded-xl bg-teal-50 text-xs font-bold text-teal-800" @click="emit('selecionar', null)">Limpar filtro · {{ formatarDataCivil(selecionado) }}</button>
  </section>
</template>
