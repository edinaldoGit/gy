<script setup lang="ts">
import { computed, ref, useId, watch, onMounted, onBeforeUnmount } from 'vue'
import { projetarGrafico, type PontoGrafico } from '@/utils/graficos'
const props = withDefaults(defineProps<{ pontos: PontoGrafico[]; unidade: string; cor?: 'bubblegum' | 'teal' | 'sage'; rotulo: string }>(), { cor: 'sage' })
const svg = ref<SVGSVGElement | null>(null)
const largura = ref(320)
let observador: ResizeObserver | undefined
onMounted(() => { if (svg.value) { observador = new ResizeObserver(() => { largura.value = Math.max(200, svg.value!.getBoundingClientRect().width) }); observador.observe(svg.value) } })
onBeforeUnmount(() => observador?.disconnect())
const gradiente = `grafico-${useId().replace(/:/g, '')}`
const grafico = computed(() => projetarGrafico(props.pontos))
const posicoes = computed(() => grafico.value.pontos.map(p => ({ ...p, x: 48 + (p.x - 65) / 550 * (largura.value - 64) })))
const selecionado = ref(0)
watch(() => props.pontos, () => { selecionado.value = Math.max(0, grafico.value.pontos.length - 1) }, { immediate: true })
const pontoAtual = computed(() => grafico.value.pontos[selecionado.value])
const stroke = computed(() => props.cor === 'sage' ? '#3f795f' : props.cor === 'teal' ? '#0d9488' : '#db2777')
const linha = computed(() => posicoes.value.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' '))
const area = computed(() => `${linha.value} L ${posicoes.value.at(-1)?.x} 178 L ${posicoes.value[0]?.x} 178 Z`)
const dataEixo = (p?: PontoGrafico) => p?.dataCivil ? `${p.dataCivil.slice(8, 10)}/${p.dataCivil.slice(5, 7)}` : (p?.data ?? '')
const numero = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n)
const variacao = computed(() => grafico.value.pontos.length > 1 ? grafico.value.pontos.at(-1)!.valor - grafico.value.pontos[0]!.valor : null)
</script>
<template>
  <div class="min-w-0 rounded-2xl border border-sage-100 bg-gradient-to-b from-white to-sage-50/50 p-3 sm:p-4">
    <div class="mb-2 flex flex-wrap items-start justify-between gap-2" aria-live="polite"><div><p class="text-xs text-whitesmoke-500">{{ pontoAtual?.data }}</p><p class="text-xl font-bold" :style="{ color: stroke }">{{ pontoAtual ? numero(pontoAtual.valor) : '—' }} <span class="text-xs font-medium">{{ unidade }}</span></p></div><p v-if="variacao !== null" class="rounded-full bg-white px-2 py-1 text-xs font-semibold text-whitesmoke-600">{{ variacao > 0 ? '+' : '' }}{{ numero(variacao) }} {{ unidade }} no período</p></div>
    <svg ref="svg" :viewBox="`0 0 ${largura} 215`" class="h-auto w-full" :aria-label="rotulo" role="group">
      <title>{{ rotulo }}</title><defs><linearGradient :id="gradiente" x1="0" y1="0" x2="0" y2="1"><stop :stop-color="stroke" stop-opacity=".18" /><stop offset="1" :stop-color="stroke" stop-opacity=".01" /></linearGradient></defs>
      <g v-for="fracao in [0, .5, 1]" :key="fracao"><line x1="48" :y1="178 - fracao * 150" :x2="largura - 16" :y2="178 - fracao * 150" stroke="#dce5df" stroke-dasharray="3 6" /><text x="40" :y="182 - fracao * 150" text-anchor="end" font-size="10" fill="#69766e">{{ numero(grafico.minimo + (grafico.maximo - grafico.minimo) * fracao) }}</text></g>
      <path v-if="grafico.pontos.length > 1" :d="area" :fill="`url(#${gradiente})`" /><path v-if="grafico.pontos.length > 1" :d="linha" fill="none" :stroke="stroke" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <g v-for="(p, i) in posicoes" :key="`${p.data}-${i}`" role="button" tabindex="0" :aria-label="`${p.data}: ${numero(p.valor)} ${unidade}`" :aria-pressed="selecionado === i" class="cursor-pointer outline-none" @click="selecionado = i" @focus="selecionado = i" @keydown.enter.prevent="selecionado = i" @keydown.space.prevent="selecionado = i"><circle :cx="p.x" :cy="p.y" r="22" fill="transparent" /><circle :cx="p.x" :cy="p.y" :r="selecionado === i ? 8 : 5" :fill="selecionado === i ? stroke : 'white'" :stroke="stroke" stroke-width="3" /></g>
      <text x="48" y="208" font-size="10" fill="#69766e">{{ dataEixo(grafico.pontos[0]) }}</text><text v-if="grafico.pontos.length > 1" :x="largura - 16" y="208" text-anchor="end" font-size="10" fill="#69766e">{{ dataEixo(grafico.pontos.at(-1)) }}</text>
    </svg>
    <label v-if="grafico.pontos.length > 1" class="mt-1 block text-xs text-whitesmoke-500">Deslize para consultar cada registro<input v-model.number="selecionado" type="range" min="0" :max="grafico.pontos.length - 1" step="1" aria-label="Selecionar registro do gráfico" class="min-h-11 w-full accent-sage-600" /></label>
    <p v-if="!grafico.pontos.length" class="py-5 text-center text-sm text-whitesmoke-500">Sem valores disponíveis para esta métrica.</p>
  </div>
</template>
