<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref } from 'vue'
import { Search, ArrowLeft, ArrowLeftRight, LoaderCircle } from 'lucide-vue-next'
import { useTreinoStore } from '@/stores/treinoStore'
import { consultarSubstitutos } from '@/services/substituicoes'
import { filtrarCatalogo } from '@/utils/catalogo'
import { modalSheetBackdrop, modalSheetPanel } from '@/components/layout/modalSheetStyles'
import ModalSheetHeader from '@/components/layout/ModalSheetHeader.vue'

const props = defineProps<{ slotId: string }>()
const emit = defineEmits<{ fechar: [] }>()
const store = useTreinoStore()
const painel = ref<HTMLElement | null>(null)
const manual = ref(false)
const busca = ref('')
const grupo = ref('')
const erro = ref('')
const slot = computed(() => store.exerciciosExecucao.find(e => e.idUnico === props.slotId))
const original = computed(() => store.catalogo.find(e => e.id === (slot.value?.planejado?.exercicioId ?? slot.value?.exercicioId)))
const sugestoes = computed(() => original.value ? consultarSubstitutos(original.value, store.catalogo).filter(e => e.exercicio.id !== slot.value?.exercicioId) : [])
const grupos = computed(() => [...new Set(store.catalogo.map(e => e.grupoMuscular))].sort())
const encontrados = computed(() => filtrarCatalogo(store.catalogo, busca.value, grupo.value).filter(e => e.id !== slot.value?.exercicioId))
const categorias = { proxima: 'Alternativa próxima', equipamento: 'Outro equipamento', diferencas: 'Diferenças na execução' }
let anterior: HTMLElement | null = null
const fechar = () => { if (!store.substituindo) emit('fechar') }
const teclado = (event: KeyboardEvent) => {
  if (event.key === 'Escape') { event.preventDefault(); fechar() }
  if (event.key !== 'Tab') return
  const elementos = [...(painel.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select') ?? [])]
  const primeiro = elementos[0], ultimo = elementos.at(-1)
  if (!primeiro) { event.preventDefault(); painel.value?.focus() }
  else if (event.shiftKey && document.activeElement === primeiro) { event.preventDefault(); ultimo?.focus() }
  else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primeiro.focus() }
}
onMounted(async () => { anterior = document.activeElement as HTMLElement; await nextTick(); painel.value?.focus(); window.addEventListener('keydown', teclado) })
onBeforeUnmount(() => { window.removeEventListener('keydown', teclado); if (anterior?.isConnected) anterior.focus() })
const selecionar = async (id: number) => {
  erro.value = ''
  if (await store.substituirExercicio(props.slotId, id)) emit('fechar')
  else erro.value = 'A substituição não foi concluída. Seus registros foram preservados. Confira o aviso e tente novamente.'
}
</script>

<template>
  <div :class="modalSheetBackdrop" @click.self="fechar">
    <section ref="painel" role="dialog" aria-modal="true" aria-labelledby="substituto-titulo" tabindex="-1" :aria-busy="store.substituindo" :class="[modalSheetPanel, 'outline-none sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-xl sm:-translate-x-1/2']">
      <ModalSheetHeader titulo="Escolher substituto" :subtitulo="`Planejado: ${slot?.planejado?.nome ?? slot?.nome ?? ''}`" etiqueta="Nesta sessão" cor-classe="bg-amethyst-500" titulo-id="substituto-titulo" :desabilitado="store.substituindo" @fechar="fechar" />
      <div class="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6">
        <p class="text-xs leading-relaxed text-whitesmoke-500">A ficha original permanece igual. As cargas de exercícios diferentes não são equivalentes. Considere suas limitações ao escolher.</p>
        <p v-if="erro" role="alert" class="rounded-xl bg-bubblegum-50 p-3 text-sm text-bubblegum-800">{{ erro }}</p>
        <template v-if="!manual">
          <p v-if="!sugestoes.length" class="rounded-2xl border border-dashed border-whitesmoke-300 bg-white p-5 text-sm text-whitesmoke-500">Não há sugestões cadastradas disponíveis para este exercício. Você pode buscar no catálogo.</p>
          <button v-for="opcao in sugestoes" :key="opcao.exercicio.id" type="button" :disabled="store.substituindo" class="flex w-full items-start gap-3 rounded-2xl border border-whitesmoke-200 bg-white p-4 text-left transition hover:border-amethyst-300 disabled:opacity-60" @click="selecionar(opcao.exercicio.id!)">
            <ArrowLeftRight :size="19" class="mt-1 shrink-0 text-amethyst-500" />
            <span class="min-w-0 flex-1"><span class="block break-words text-sm font-bold text-whitesmoke-900">{{ opcao.exercicio.nome }}</span><span class="mt-1 block text-[10px] font-bold text-amethyst-600">{{ categorias[opcao.categoria] }}</span><span class="mt-1 block text-xs leading-relaxed text-whitesmoke-500">{{ opcao.justificativa }}</span></span>
          </button>
          <button type="button" :disabled="store.substituindo" class="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amethyst-50 px-4 text-sm font-bold text-amethyst-600" @click="manual = true"><Search :size="18" />Buscar outro exercício</button>
        </template>
        <template v-else>
          <button type="button" :disabled="store.substituindo" class="flex min-h-10 items-center gap-2 text-sm font-bold text-amethyst-600" @click="manual = false"><ArrowLeft :size="17" />Voltar às sugestões</button>
          <label class="block text-xs font-bold text-whitesmoke-600">Buscar no catálogo<input v-model="busca" :disabled="store.substituindo" type="search" placeholder="Nome ou grupo muscular" class="mt-2 min-h-12 w-full rounded-xl border border-whitesmoke-200 bg-white px-4 text-sm outline-amethyst-300" /></label>
          <label class="block text-xs font-bold text-whitesmoke-600">Grupo muscular<select v-model="grupo" :disabled="store.substituindo" class="mt-2 min-h-11 w-full rounded-xl border border-whitesmoke-200 bg-white px-3 text-sm"><option value="">Todos os grupos</option><option v-for="nome in grupos" :key="nome">{{ nome }}</option></select></label>
          <p v-if="!encontrados.length" class="py-4 text-sm text-whitesmoke-500">Nenhum exercício encontrado.</p>
          <button v-for="exercicio in encontrados" :key="exercicio.id" type="button" :disabled="store.substituindo" class="block min-h-14 w-full rounded-2xl border border-whitesmoke-200 bg-white p-3 text-left disabled:opacity-60" @click="selecionar(exercicio.id!)"><span class="block break-words text-sm font-bold text-whitesmoke-900">{{ exercicio.nome }}</span><span class="mt-1 block text-xs text-whitesmoke-500">{{ exercicio.grupoMuscular }} · {{ exercicio.equipamento }}</span></button>
        </template>
        <p v-if="store.substituindo" role="status" class="flex items-center justify-center gap-2 text-sm font-bold text-amethyst-600"><LoaderCircle :size="18" class="animate-spin" />Salvando substituição…</p>
      </div>
    </section>
  </div>
</template>
