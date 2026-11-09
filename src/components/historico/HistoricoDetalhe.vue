<script setup lang="ts">
import ModalSheetHeader from '@/components/layout/ModalSheetHeader.vue'
import { modalSheetBackdrop, modalSheetPanel } from '@/components/layout/modalSheetStyles'
import { computed, onMounted, onUnmounted } from 'vue'
import { Clock3, Dumbbell, Check, Circle } from 'lucide-vue-next'
import type { HistoricoTreino } from '@/database/db'
import { contarExercicios, contarSeriesDaSessao, dataConclusao, formatarData, formatarDuracao, obterDuracaoMinutos } from '@/utils/historico'

const props = defineProps<{ sessao: HistoricoTreino }>()
const emit = defineEmits<{ fechar: [] }>()
const exerciciosOrdenados = computed(() => Array.isArray(props.sessao.exerciciosRealizados)
  ? props.sessao.exerciciosRealizados.filter(exercicio => exercicio && typeof exercicio === 'object').slice().sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
  : [])
const seriesSeguras = (series: unknown) => Array.isArray(series) ? series.filter(serie => serie && typeof serie === 'object') : []

const fecharComEsc = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('fechar')
}

onMounted(() => window.addEventListener('keydown', fecharComEsc))
onUnmounted(() => window.removeEventListener('keydown', fecharComEsc))

const inicio = (serie: number | string | undefined) => serie == null || serie === '' ? '—' : String(serie)
const ordemDoExercicio = (ordem: number | undefined, index: number) => ordem ?? index + 1
const cargaFormatada = (peso: number | string | undefined) => {
  if (peso == null || (typeof peso === 'string' && peso.trim() === '')) return 'Carga indisponível'
  const valor = Number(peso)
  return Number.isFinite(valor) ? `${valor} kg` : 'Carga indisponível'
}
</script>

<template>
  <div :class="modalSheetBackdrop" @click.self="emit('fechar')">
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="historico-detalhe-titulo"
      :class="modalSheetPanel"
    >
      <ModalSheetHeader
        :titulo="props.sessao.treinoNome || 'Treino salvo'"
        :subtitulo="(props.sessao.fichaNome || 'Ficha removida') + ' · ' + formatarData(dataConclusao(props.sessao), { dateStyle: 'full' }) + (props.sessao.dataInicio ? ' · Início ' + formatarData(props.sessao.dataInicio, { hour: '2-digit', minute: '2-digit' }) : '')"
        etiqueta="Treino concluído"
        cor-classe="bg-teal-600"
        titulo-id="historico-detalhe-titulo"
        @fechar="emit('fechar')"
      />

      <div class="min-h-0 overflow-y-auto overscroll-contain p-6">
        <div class="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
          <div class="rounded-2xl border border-whitesmoke-200 bg-white p-3 text-center">
            <Clock3 :size="18" class="mx-auto mb-1 text-amethyst-500" />
            <p class="text-sm font-bold text-whitesmoke-950">{{ formatarDuracao(obterDuracaoMinutos(props.sessao)) }}</p>
            <p class="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-whitesmoke-500">Duração</p>
          </div>
          <div class="rounded-2xl border border-whitesmoke-200 bg-white p-3 text-center">
            <Dumbbell :size="18" class="mx-auto mb-1 text-cerulean-600" />
            <p class="text-sm font-bold text-whitesmoke-950">{{ contarExercicios(props.sessao) }}</p>
            <p class="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-whitesmoke-500">Exercícios</p>
          </div>
          <div class="rounded-2xl border border-whitesmoke-200 bg-white p-3 text-center">
            <Check :size="18" class="mx-auto mb-1 text-teal-600" />
            <p class="text-sm font-bold text-whitesmoke-950">{{ contarSeriesDaSessao(props.sessao) }}</p>
            <p class="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-whitesmoke-500">Séries feitas</p>
          </div>
        </div>

        <h3 class="mb-3 text-sm font-bold uppercase tracking-widest text-whitesmoke-700">Exercícios realizados</h3>
        <div v-if="!exerciciosOrdenados.length" class="rounded-2xl border border-dashed border-whitesmoke-300 bg-white px-4 py-6 text-center text-sm text-whitesmoke-500">
          Os exercícios desta sessão não estão disponíveis.
        </div>
        <ol v-else class="space-y-3">
          <li v-for="(exercicio, index) in exerciciosOrdenados" :key="`${exercicio.exercicioId}-${index}`" class="rounded-2xl border border-whitesmoke-200 bg-white p-4 sm:p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-widest text-teal-600">Exercício {{ ordemDoExercicio(exercicio.ordem, index) }}</p>
                <h4 class="mt-0.5 break-words font-bold text-whitesmoke-950">{{ exercicio.nome || 'Exercício salvo' }}</h4>
                <p v-if="exercicio.planejado && exercicio.planejado.exercicioId !== exercicio.exercicioId" class="mt-1 break-words text-xs text-teal-600">Substituiu: {{ exercicio.planejado.nome }}</p>
                <p v-if="exercicio.grupoMuscular" class="mt-0.5 text-xs text-whitesmoke-500">{{ exercicio.grupoMuscular }}</p>
              </div>
              <span v-if="exercicio.seriesPlanejadas != null" class="shrink-0 rounded-full bg-whitesmoke-100 px-2.5 py-1 text-[10px] font-semibold text-whitesmoke-600">
                Planejado: {{ exercicio.seriesPlanejadas }} séries
              </span>
            </div>

            <div v-if="exercicio.repsAlvo" class="mt-3 flex flex-wrap gap-2 text-xs">
              <span class="rounded-lg bg-whitesmoke-100 px-2.5 py-1.5 text-whitesmoke-600">Alvo: {{ exercicio.repsAlvo }} repetições</span>
              <span v-if="exercicio.pesoBasePlanejado != null" class="rounded-lg bg-whitesmoke-100 px-2.5 py-1.5 text-whitesmoke-600">Carga base planejada: {{ cargaFormatada(exercicio.pesoBasePlanejado) }}</span>
            </div>

            <div v-if="seriesSeguras(exercicio.seriesRealizadas).length" class="mt-3 space-y-2 border-t border-whitesmoke-100 pt-3">
              <div v-for="(serie, serieIndex) in seriesSeguras(exercicio.seriesRealizadas)" :key="`${serie.numeroDaSerie}-${serieIndex}`" class="flex items-center justify-between gap-3 text-sm">
                <div class="flex min-w-0 items-center gap-2">
                  <Check v-if="serie.finalizada === true" :size="16" class="shrink-0 text-teal-600" aria-label="Série concluída" />
                  <Circle v-else :size="15" class="shrink-0 text-whitesmoke-300" aria-label="Conclusão não registrada" />
                  <span class="shrink-0 font-semibold text-whitesmoke-700">Série {{ inicio(serie.numeroDaSerie) }}</span>
                  <span class="truncate text-whitesmoke-500">{{ serie.finalizada === true ? 'Concluída' : 'Conclusão não registrada' }}</span>
                </div>
                <span class="shrink-0 text-right font-medium text-whitesmoke-950">
                  {{ cargaFormatada(serie.peso) }}<span class="text-whitesmoke-500"> · {{ inicio(serie.reps) }} reps</span>
                </span>
              </div>
            </div>
            <p v-else class="mt-3 border-t border-whitesmoke-100 pt-3 text-xs text-whitesmoke-500">Não há séries registradas para este exercício.</p>
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>
