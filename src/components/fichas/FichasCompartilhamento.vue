<script setup lang="ts">
import { feedback } from '@/composables/useFeedback'
import ModalSheetHeader from '@/components/layout/ModalSheetHeader.vue'
import { modalSheetBackdrop, modalSheetPanel } from '@/components/layout/modalSheetStyles'
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Download, FileUp, Share2, Check, LoaderCircle } from 'lucide-vue-next'
import { db } from '@/database/db'
import { useFichaStore } from '@/stores/fichaStore'
import {
  ErroCompartilhamento,
  TAMANHO_MAXIMO_ARQUIVO,
  diasDaSemanaLabels,
  resolverExercicios,
  validarDocumentoFichas,
  type DocumentoFichas
} from '@/utils/fichaCompartilhamento'
import { baixarFichas, importarDocumentoFichas } from '@/services/fichaCompartilhamento'

const props = withDefaults(defineProps<{ compact?: boolean; fichaId?: number; somenteExportar?: boolean }>(), { compact: false, somenteExportar: false })

const store = useFichaStore()
const { fichasSalvas, catalogo } = storeToRefs(store)
const inputArquivo = ref<HTMLInputElement | null>(null)
const exportacaoAberta = ref(false)
const idsSelecionados = ref<number[]>([])
const documento = ref<DocumentoFichas | null>(null)
const processando = ref(false)
const erro = ref('')
const aviso = ref('')

const exerciciosNovos = computed(() => {
  if (!documento.value) return new Set<string>()
  const resolvidos = resolverExercicios(documento.value.exercicios, catalogo.value)
  return new Set(documento.value.exercicios.filter(ex => !resolvidos.get(ex.ref)?.id).map(ex => ex.ref))
})
const fichasSelecionadas = computed(() => fichasSalvas.value.filter(ficha => ficha.id != null && idsSelecionados.value.includes(ficha.id)))
const diasTexto = (dias: number[]) => dias.length ? dias.map(dia => diasDaSemanaLabels[dia]).join(', ') : 'Sem dia fixo'

const alternarFicha = (id: number, marcado: boolean) => {
  idsSelecionados.value = marcado
    ? [...new Set([...idsSelecionados.value, id])]
    : idsSelecionados.value.filter(atual => atual !== id)
}

const exportarSelecionadas = () => {
  try {
    baixarFichas(fichasSelecionadas.value, catalogo.value)
    aviso.value = ''
    feedback.info('Download do arquivo iniciado.')
    erro.value = ''
    exportacaoAberta.value = false
  } catch (falha) {
    erro.value = falha instanceof Error ? falha.message : 'Não foi possível exportar as fichas.'
    feedback.error(erro.value)
  }
}

const abrirSeletorArquivo = () => {
  erro.value = ''
  inputArquivo.value?.click()
}

const lerArquivo = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const arquivo = input.files?.[0]
  input.value = ''
  if (!arquivo) return
  documento.value = null
  erro.value = ''
  aviso.value = ''
  try {
    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) throw new ErroCompartilhamento('O arquivo é maior que o limite de 1 MB.')
    const conteudo = await arquivo.text()
    let json: unknown
    try {
      json = JSON.parse(conteudo)
    } catch {
      throw new ErroCompartilhamento('O arquivo não contém um JSON válido.')
    }
    const documentoValidado = validarDocumentoFichas(json)
    const catalogoDoBanco = await db.catalogo.toArray()
    catalogo.value = catalogoDoBanco
    documento.value = documentoValidado
  } catch (falha) {
    erro.value = falha instanceof Error ? falha.message : 'Não foi possível ler este arquivo.'
    feedback.error(erro.value)
  }
}

const confirmarImportacao = async () => {
  if (!documento.value || processando.value) return
  processando.value = true
  erro.value = ''
  try {
    const resultado = await importarDocumentoFichas(documento.value)
    aviso.value = `${resultado.fichasCriadas} ${resultado.fichasCriadas === 1 ? 'ficha importada' : 'fichas importadas'} com ${resultado.treinosCriados} ${resultado.treinosCriados === 1 ? 'treino' : 'treinos'} adicionados à biblioteca. A ficha não foi ativada.`
    documento.value = null
    feedback.success('Fichas importadas para sua biblioteca!')
    await store.carregarDados().catch(() => {
      aviso.value += ' Atualize a tela se as novas fichas ainda não aparecerem.'
    })
  } catch (falha) {
    erro.value = falha instanceof Error ? falha.message : 'Não foi possível importar as fichas. Nenhuma alteração foi aplicada.'
    feedback.error('Não foi possível importar as fichas. Confira os detalhes na prévia.')
  } finally {
    processando.value = false
  }
}

const fecharPrevia = () => {
  if (processando.value) return
  documento.value = null
  erro.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap gap-2">
      <button type="button" :aria-label="compact ? 'Exportar fichas' : undefined" :title="compact ? 'Exportar fichas' : undefined" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white text-xs font-bold text-whitesmoke-700 shadow-sm transition hover:bg-cerulean-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cerulean-600" :class="compact ? 'w-11 px-0' : 'px-3'" @click="exportacaoAberta = true; idsSelecionados = props.fichaId ? [props.fichaId] : []">
        <Share2 :size="16" class="text-cerulean-600" /><span v-if="!compact">Exportar fichas</span>
      </button>
      <button v-if="!somenteExportar" type="button" :aria-label="compact ? 'Importar fichas' : undefined" :title="compact ? 'Importar fichas' : undefined" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white text-xs font-bold text-whitesmoke-700 shadow-sm transition hover:bg-cerulean-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cerulean-600" :class="compact ? 'w-11 px-0' : 'px-3'" @click="abrirSeletorArquivo">
        <FileUp :size="16" class="text-cerulean-600" /><span v-if="!compact">Importar fichas</span>
      </button>
      <input ref="inputArquivo" class="hidden" type="file" accept=".json,application/json" aria-label="Selecionar arquivo JSON de fichas" @change="lerArquivo" />
    </div>
    <p v-if="aviso" role="status" class="rounded-xl bg-cerulean-50 px-3 py-2 text-xs font-medium text-cerulean-800">{{ aviso }}</p>
  </div>

  <Transition name="gy-modal" :duration="{ enter: 420, leave: 280 }" appear><div v-if="exportacaoAberta" :class="modalSheetBackdrop" @click.self="exportacaoAberta = false">
    <section role="dialog" aria-modal="true" aria-labelledby="exportacao-titulo" :class="modalSheetPanel">
      <ModalSheetHeader titulo="Exportar fichas" subtitulo="Escolha o que deseja compartilhar." etiqueta="Compartilhamento" cor-classe="bg-cerulean-600" titulo-id="exportacao-titulo" @fechar="exportacaoAberta = false" />
      <div class="min-h-0 overflow-y-auto p-6">
        <p v-if="!fichasSalvas.length" class="rounded-2xl bg-white p-5 text-center text-sm text-whitesmoke-500">Você ainda não tem fichas para exportar.</p>
        <template v-else>
          <div class="mb-3 flex justify-end">
        <button type="button" class="min-h-9 rounded-lg px-2 text-xs font-bold text-cerulean-700 hover:bg-cerulean-50" @click="idsSelecionados = fichasSalvas.flatMap(ficha => ficha.id == null ? [] : [ficha.id])">
              Selecionar todas
            </button>
          </div>
          <label v-for="ficha in fichasSalvas" :key="ficha.id" class="mb-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-whitesmoke-200 bg-white p-3 transition hover:border-cerulean-200">
            <input :checked="ficha.id != null && idsSelecionados.includes(ficha.id)" type="checkbox" class="h-5 w-5 accent-cerulean-600" @change="ficha.id != null && alternarFicha(ficha.id, ($event.target as HTMLInputElement).checked)" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-bold text-whitesmoke-950">{{ ficha.nome }}</span>
              <span class="block text-xs text-whitesmoke-500">{{ ficha.treinos.length }} treinos · {{ ficha.treinos.reduce((total, treino) => total + treino.exercicios.length, 0) }} exercícios</span>
            </span>
          </label>
        </template>
      </div>
      <footer class="flex shrink-0 gap-3 border-t border-whitesmoke-200 bg-whitesmoke-50 p-6">
        <button type="button" class="min-h-11 flex-1 rounded-xl border border-whitesmoke-200 px-4 text-sm font-bold text-whitesmoke-700 hover:bg-whitesmoke-50" @click="exportacaoAberta = false">Cancelar</button>
        <button type="button" :disabled="!fichasSelecionadas.length" class="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-cerulean-600 px-4 text-sm font-bold text-white transition hover:bg-cerulean-700 disabled:cursor-not-allowed disabled:opacity-50" @click="exportarSelecionadas">
          <Download :size="16" /> Exportar {{ fichasSelecionadas.length || '' }}
        </button>
      </footer>
    </section>
  </div></Transition>

  <Transition name="gy-modal" :duration="{ enter: 420, leave: 280 }" appear><div v-if="documento" :class="modalSheetBackdrop" @click.self="fecharPrevia">
    <section role="dialog" aria-modal="true" aria-labelledby="importacao-titulo" :class="modalSheetPanel">
      <ModalSheetHeader titulo="Prévia da importação" subtitulo="Revise as fichas antes de adicioná-las." etiqueta="Compartilhamento" cor-classe="bg-cerulean-600" titulo-id="importacao-titulo" :desabilitado="processando" @fechar="fecharPrevia" />
      <div class="min-h-0 overflow-y-auto p-6">
        <div class="mb-3 rounded-2xl border border-cerulean-100 bg-cerulean-50 p-3 text-xs text-cerulean-800">
          {{ documento.fichas.length }} {{ documento.fichas.length === 1 ? 'ficha' : 'fichas' }} · {{ documento.fichas.reduce((total, ficha) => total + ficha.treinos.length, 0) }} treinos · {{ documento.exercicios.length }} exercícios no arquivo. A ficha importada será adicionada sem ser ativada.
        </div>
        <div class="space-y-3">
          <article v-for="(ficha, index) in documento.fichas" :key="`${ficha.nome}-${index}`" class="rounded-2xl border border-whitesmoke-200 bg-white p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h4 class="break-words font-bold text-whitesmoke-950">{{ ficha.nome }}</h4>
                <p class="mt-1 text-xs text-whitesmoke-500">{{ ficha.treinos.length }} treinos · {{ ficha.treinos.reduce((total, treino) => total + treino.exercicios.length, 0) }} exercícios</p>
              </div>
              <span class="shrink-0 rounded-full bg-whitesmoke-100 px-2.5 py-1 text-[10px] font-bold text-whitesmoke-600">{{ ficha.treinos.length }} treinos</span>
            </div>
            <div v-for="(treino, treinoIndex) in ficha.treinos" :key="treinoIndex" class="mt-3 border-t border-whitesmoke-100 pt-3">
              <h5 class="text-xs font-bold text-whitesmoke-800">{{ treino.nome }} <span class="font-normal text-whitesmoke-500">· {{ diasTexto(treino.diasDaSemana) }}</span></h5>
              <ul class="mt-2 space-y-1.5"><li v-for="(exercicio, exIndex) in treino.exercicios" :key="`${exercicio.exercicioRef}-${exIndex}`" class="flex items-center justify-between gap-2 text-xs"><span class="min-w-0 truncate text-whitesmoke-700">{{ exercicio.ordem }}. {{ documento.exercicios.find(item => item.ref === exercicio.exercicioRef)?.nome || 'Exercício' }}</span><span v-if="exerciciosNovos.has(exercicio.exercicioRef)" class="shrink-0 rounded-full bg-amethyst-50 px-2 py-0.5 font-semibold text-amethyst-700">Novo / personalizado</span><span v-else class="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 font-semibold text-teal-700">No catálogo</span></li></ul>
            </div>
          </article>
        </div>
        <p v-if="erro" role="alert" class="mt-3 rounded-xl bg-bubblegum-50 px-3 py-2 text-xs font-medium text-bubblegum-700">{{ erro }}</p>
      </div>
      <footer class="flex shrink-0 gap-3 border-t border-whitesmoke-200 bg-whitesmoke-50 p-6">
        <button type="button" class="min-h-11 flex-1 rounded-xl border border-whitesmoke-200 px-4 text-sm font-bold text-whitesmoke-700 hover:bg-whitesmoke-50 disabled:opacity-50" :disabled="processando" @click="fecharPrevia">Cancelar</button>
        <button type="button" class="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-cerulean-600 px-4 text-sm font-bold text-white transition hover:bg-cerulean-700 disabled:opacity-60" :disabled="processando" @click="confirmarImportacao">
          <LoaderCircle v-if="processando" :size="17" class="animate-spin" />
          <Check v-else :size="17" />
          {{ processando ? 'Importando…' : 'Confirmar importação' }}
        </button>
      </footer>
    </section>
  </div></Transition>
</template>
