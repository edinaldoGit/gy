<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  pontos: Array<{ data: string; valor: number }>
  unidade: string
  cor?: 'bubblegum' | 'teal' | 'sage'
  rotulo: string
}>(), { cor: 'sage' })

const largura = 640
const altura = 220
const margens = { x: 30, y: 24 }
const posicoes = computed(() => {
  const valores = props.pontos.map(ponto => ponto.valor)
  const menor = Math.min(...valores)
  const maior = Math.max(...valores)
  const intervalo = maior - menor || Math.max(Math.abs(maior) * 0.1, 1)
  return props.pontos.map((ponto, index) => ({
    ...ponto,
    x: props.pontos.length === 1 ? largura / 2 : margens.x + index * (largura - margens.x * 2) / (props.pontos.length - 1),
    y: altura - margens.y - (ponto.valor - menor + intervalo * 0.08) / (intervalo * 1.16) * (altura - margens.y * 2)
  }))
})
const corClasse = computed(() => props.cor === 'sage' ? 'text-sage-600' : props.cor === 'teal' ? 'text-teal-600' : 'text-bubblegum-500')
const stroke = computed(() => props.cor === 'sage' ? '#3f795f' : props.cor === 'teal' ? '#0d9488' : '#ec4899')
const path = computed(() => posicoes.value.map((ponto, index) => `${index ? 'L' : 'M'} ${ponto.x} ${ponto.y}`).join(' '))
const numero = (valor: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(valor)
</script>

<template>
  <div class="w-full min-w-0 rounded-2xl bg-whitesmoke-50 p-3 sm:p-4">
    <svg viewBox="0 0 640 220" class="h-auto w-full overflow-visible" role="img" :aria-label="rotulo">
      <title>{{ rotulo }}</title>
      <line x1="24" y1="190" x2="616" y2="190" stroke="#e5e7eb" stroke-width="1" />
      <path v-if="posicoes.length > 1" :d="path" fill="none" :stroke="stroke" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <g v-for="(ponto, index) in posicoes" :key="`${ponto.data}-${index}`" tabindex="0" :aria-label="`${ponto.data}: ${numero(ponto.valor)} ${unidade}`">
        <circle :cx="ponto.x" :cy="ponto.y" r="13" fill="transparent" />
        <circle :cx="ponto.x" :cy="ponto.y" r="5.5" fill="white" :stroke="stroke" stroke-width="3" />
        <title>{{ ponto.data }} · {{ numero(ponto.valor) }} {{ unidade }}</title>
      </g>
    </svg>
    <ol class="mt-1 grid gap-1 text-[11px] text-whitesmoke-600" :class="posicoes.length > 4 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'">
      <li v-for="(ponto, index) in posicoes" :key="`${ponto.data}-legenda-${index}`" class="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5">
        <span class="truncate">{{ ponto.data }}</span><strong :class="corClasse" class="shrink-0">{{ numero(ponto.valor) }} {{ unidade }}</strong>
      </li>
    </ol>
  </div>
</template>
