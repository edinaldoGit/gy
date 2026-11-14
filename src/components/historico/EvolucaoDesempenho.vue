<script lang="ts">let ultimaSelecao = ''</script>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Activity, Dumbbell, RefreshCw } from 'lucide-vue-next'
import { agruparExercicios } from '@/utils/seletorDesempenho'
import { feedback } from '@/composables/useFeedback'
import { db, type ExercicioCatalogo, type HistoricoTreino } from '@/database/db'
import EvolucaoLinha from '@/components/evolucao/EvolucaoLinha.vue'
import PagePillHeader from '@/components/layout/PagePillHeader.vue'
import { agregarDesempenho, formatarDataCivil } from '@/utils/evolucao'

const emit = defineEmits<{ voltar: [] }>()
const sessoes = ref<HistoricoTreino[]>([])
const catalogo = ref<ExercicioCatalogo[]>([])
const carregando = ref(true)
const erro = ref(false)
const identidadeSelecionada = ref(ultimaSelecao)
watch(identidadeSelecionada, valor => { ultimaSelecao = valor })
const busca = ref('')
const grupos = computed(() => agruparExercicios(exercicios.value, busca.value))
const historico = computed(() => agregarDesempenho(sessoes.value, catalogo.value))
const exercicios = computed(() => {
  const mapa = new Map<string, { identidade: string; nome: string; grupoMuscular: string; sessoes: number; data: Date }>()
  for (const item of historico.value) {
    const existente = mapa.get(item.identidade)
    if (existente) existente.sessoes++
    else mapa.set(item.identidade, { identidade: item.identidade, nome: item.nome, grupoMuscular: item.grupoMuscular, sessoes: 1, data: item.data })
  }
  return [...mapa.values()]
})
const execucoes = computed(() => historico.value.filter(item => item.identidade === identidadeSelecionada.value).sort((a, b) => a.data.getTime() - b.data.getTime()))
const ultima = computed(() => execucoes.value.at(-1) ?? null)
const recorde = computed(() => execucoes.value.reduce<number | null>((melhor, item) => item.maiorCargaKg === null ? melhor : Math.max(melhor ?? item.maiorCargaKg, item.maiorCargaKg), null))
const pontosCarga = computed(() => execucoes.value.filter(item => item.maiorCargaKg !== null).map(item => ({ data: formatarDataCivil(`${item.data.getFullYear()}-${String(item.data.getMonth() + 1).padStart(2, '0')}-${String(item.data.getDate()).padStart(2, '0')}`), dataCivil: `${item.data.getFullYear()}-${String(item.data.getMonth() + 1).padStart(2, '0')}-${String(item.data.getDate()).padStart(2, '0')}`, valor: item.maiorCargaKg! })))
const dataFormatada = (data: Date) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(data)
const valor = (numero: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(numero)

async function carregar() {
  carregando.value = true
  erro.value = false
  try {
    const [todasSessoes, exerciciosCatalogo] = await Promise.all([db.historico.where('estado').equals('finalizado').toArray(), db.catalogo.toArray()])
    sessoes.value = todasSessoes
    catalogo.value = exerciciosCatalogo
    if (!exercicios.value.some(exercicio => exercicio.identidade === identidadeSelecionada.value)) identidadeSelecionada.value = exercicios.value[0]?.identidade ?? ''
  } catch (error) {
    console.error('Não foi possível carregar a evolução de desempenho:', error)
    erro.value = true
    feedback.error('Não foi possível carregar a evolução de desempenho.')
  } finally { carregando.value = false }
}

onMounted(carregar)
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-20">
    <PagePillHeader titulo="Evolução de desempenho" subtitulo="Seu histórico por exercício" tema="evolucao" mostrar-voltar @voltar="emit('voltar')" />

    <div v-if="carregando" class="rounded-3xl border border-whitesmoke-200 bg-white px-5 py-10 text-center text-sm font-semibold text-whitesmoke-600" role="status"><RefreshCw :size="21" class="mx-auto mb-3 animate-spin text-sage-600" />Carregando sessões concluídas…</div>
    <div v-else-if="erro" class="rounded-3xl border border-bubblegum-200 bg-white p-5 text-center" role="alert"><p class="font-bold text-whitesmoke-900">Não foi possível abrir seu histórico de desempenho.</p><button type="button" class="mt-3 min-h-11 rounded-xl bg-sage-600 px-4 text-sm font-bold text-white" @click="carregar">Tentar novamente</button></div>
    <template v-else-if="exercicios.length">
      <section class="rounded-3xl border border-whitesmoke-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="selecionar-exercicio">
        <div class="mb-3 flex items-center gap-2 text-sage-700"><Dumbbell :size="19" /><h2 id="selecionar-exercicio" class="text-base font-black text-whitesmoke-950">Escolha um exercício</h2></div>
        <input v-model="busca" type="search" placeholder="Buscar exercício…" aria-label="Buscar exercício no desempenho" class="mb-3 min-h-11 w-full rounded-xl border border-whitesmoke-200 px-3 text-sm" />
        <p v-if="!grupos.length" class="p-4 text-center text-sm text-whitesmoke-500">Nenhum exercício encontrado.</p>
        <details v-for="[grupo, itens] in grupos" :key="grupo" :open="!!busca || itens.some(e => e.identidade === identidadeSelecionada)" class="mb-2 rounded-2xl border border-whitesmoke-200">
          <summary class="min-h-11 cursor-pointer p-3 text-sm font-bold text-sage-700">{{ grupo }} <span class="text-xs text-whitesmoke-500">({{ itens.length }})</span></summary>
          <div class="grid gap-2 p-2 sm:grid-cols-2"><button v-for="e in itens" :key="e.identidade" type="button" :aria-pressed="identidadeSelecionada === e.identidade" class="min-h-14 rounded-xl border p-3 text-left text-sm" :class="identidadeSelecionada === e.identidade ? 'border-sage-500 bg-sage-50 font-bold' : 'border-whitesmoke-100'" @click="identidadeSelecionada = e.identidade">{{ e.nome }}<span class="block text-xs font-normal text-whitesmoke-500">{{ e.sessoes }} sessões</span></button></div>
        </details>
      </section>

      <template v-if="ultima">
        <section class="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Indicadores do exercício">
          <article class="rounded-2xl border border-sage-100 bg-white p-4 shadow-sm"><p class="text-[10px] font-bold uppercase tracking-wide text-sage-700">Última execução</p><p class="mt-2 text-sm font-black text-whitesmoke-950">{{ dataFormatada(ultima.data) }}</p><p class="mt-1 text-xs text-whitesmoke-500">{{ ultima.treinoNome }}</p></article>
          <article class="rounded-2xl border border-whitesmoke-200 bg-white p-4 shadow-sm"><p class="text-[10px] font-bold uppercase tracking-wide text-whitesmoke-600">Maior carga</p><p class="mt-2 text-xl font-black text-whitesmoke-950">{{ recorde === null ? '—' : `${valor(recorde)} kg` }}</p><p class="mt-1 text-xs text-whitesmoke-500">Maior carga registrada em uma série</p></article>
          <article class="col-span-2 rounded-2xl border border-whitesmoke-200 bg-white p-4 shadow-sm sm:col-span-1"><p class="text-[10px] font-bold uppercase tracking-wide text-whitesmoke-600">Último volume</p><p class="mt-2 text-xl font-black text-whitesmoke-950">{{ ultima.volumeKgRepeticoes === null ? '—' : `${valor(ultima.volumeKgRepeticoes)} kg·reps` }}</p><p class="mt-1 text-xs text-whitesmoke-500">Soma de carga × repetições</p></article>
        </section>

        <section class="rounded-3xl border border-whitesmoke-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="grafico-cargas">
          <h2 id="grafico-cargas" class="mb-1 text-lg font-black text-whitesmoke-950">Maior carga por sessão</h2>
          <p class="mb-3 text-xs text-whitesmoke-500">Cada ponto representa a maior carga registrada em uma sessão concluída. Comparação em kg; isso não mede sozinho a qualidade do treino.</p>
          <EvolucaoLinha v-if="pontosCarga.length" :pontos="pontosCarga" unidade="kg" cor="sage" rotulo="Gráfico da maior carga registrada em cada sessão" />
          <p v-else class="rounded-2xl bg-whitesmoke-50 p-5 text-center text-sm text-whitesmoke-500">Este exercício tem séries registradas sem carga maior que zero para exibir no gráfico.</p>
        </section>

        <section class="flex flex-col gap-3" aria-labelledby="execucoes-anteriores">
          <div class="flex items-center justify-between px-1"><h2 id="execucoes-anteriores" class="text-lg font-black text-whitesmoke-950">Execuções anteriores</h2><span class="text-xs font-semibold text-whitesmoke-500">{{ execucoes.length }} sessões</span></div>
          <article v-for="execucao in [...execucoes].reverse()" :key="`${execucao.sessaoId ?? execucao.data.getTime()}-${execucao.identidade}`" class="rounded-2xl border border-whitesmoke-200 bg-white p-4 shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-2"><div><h3 class="font-bold text-whitesmoke-900">{{ dataFormatada(execucao.data) }}</h3><p class="mt-0.5 text-xs text-whitesmoke-500">{{ execucao.fichaNome }} · {{ execucao.treinoNome }}</p></div><span class="rounded-full bg-sage-50 px-2.5 py-1 text-xs font-bold text-sage-700">{{ execucao.cargasKg.length ? `Máx. ${valor(execucao.maiorCargaKg!)} kg` : 'Sem carga registrada' }}</span></div>
            <div class="mt-3 flex flex-wrap gap-1.5"><span v-for="(serie, index) in execucao.series" :key="index" class="rounded-lg bg-whitesmoke-100 px-2.5 py-1.5 text-xs font-semibold text-whitesmoke-700">Série {{ index + 1 }}: {{ serie.repeticoes }} reps · {{ serie.peso === 0 ? 'sem carga' : `${valor(serie.peso)} kg` }}</span></div>
            <p class="mt-3 flex items-center gap-1.5 text-xs text-whitesmoke-600"><Activity :size="14" class="text-sage-600" />Volume registrado: <strong>{{ execucao.volumeKgRepeticoes === null ? 'não disponível para séries sem carga' : `${valor(execucao.volumeKgRepeticoes)} kg·reps` }}</strong></p>
          </article>
        </section>
      </template>
    </template>
    <div v-else class="rounded-3xl border border-dashed border-sage-200 bg-white px-5 py-10 text-center">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-50 text-sage-700"><Dumbbell :size="27" /></div>
      <h2 class="text-lg font-black text-whitesmoke-950">Seu histórico de desempenho começa ao concluir um treino</h2>
      <p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-whitesmoke-500">As sessões finalizadas serão agrupadas por exercício e ficha. Séries sem confirmação ou treinos cancelados não entram nos indicadores.</p>
    </div>
  </div>
</template>
