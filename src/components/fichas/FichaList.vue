<script setup lang="ts">
import { feedback } from '@/composables/useFeedback'
import { confirmation } from '@/composables/useConfirm'
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { BedDouble, BadgeCheck, CalendarDays, ChevronRight, CirclePlus, Coffee, Copy, Dumbbell, Edit3, Library, Trash2 } from 'lucide-vue-next'
import { useFichaStore } from '@/stores/fichaStore'
import type { FichaCompleta } from '@/database/db'
import FichasCompartilhamento from './FichasCompartilhamento.vue'
import SectionPageHeader from '@/components/layout/SectionPageHeader.vue'
import PagePillHeader from '@/components/layout/PagePillHeader.vue'

const store = useFichaStore()
const { modo, fichasSalvas, fichaAtual, fichasBiblioteca, fichaSelecionada } = storeToRefs(store)
const filtro = ref<'todas' | 'local' | 'importada'>('todas')
const fichasFiltradas = computed(() => fichasBiblioteca.value.filter(ficha => filtro.value === 'todas' || ficha.origem === filtro.value))
const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const semana = computed(() => [1, 2, 3, 4, 5, 6, 0].map(dia => ({ dia, nome: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dia], treino: fichaSelecionada.value?.treinos.find(t => t.diasDaSemana.includes(dia)) })))
const diasDaFicha = (ficha: FichaCompleta) => [...new Set(ficha.treinos.flatMap(treino => treino.diasDaSemana))].sort((a, b) => a - b)
const resumoDias = (ficha: FichaCompleta) => {
  const atribuidos = diasDaFicha(ficha)
  return atribuidos.length ? atribuidos.map(dia => dias[dia]).join(' · ') : 'Sem dias programados'
}
const processando = ref(false)
const protegerSessaoAtiva = async (acao: () => Promise<unknown>) => {
  if (processando.value) return
  processando.value = true
  try { await acao() } catch (error) { feedback.error(error instanceof Error ? error.message : 'Não foi possível concluir a ação.') }
  finally { processando.value = false }
}
const definirComoAtual = async (ficha: FichaCompleta) => {
  if (!ficha.id) return
  const resultado = await store.ativarFicha(ficha.id)
  if (!resultado.ok) feedback.warning(resultado.sessaoAtiva ? 'Há uma sessão em andamento. Finalize ou encerre essa sessão antes de trocar a ficha atual.' : 'Adicione pelo menos um treino à ficha antes de ativá-la.')
  else feedback.success('Ficha definida como atual!')
}
const excluir = async (ficha: FichaCompleta) => {
  const confirmed = await confirmation.ask({
    title: 'Excluir esta ficha?', message: 'A ficha e seus treinos serão removidos. Essa ação não poderá ser desfeita.',
    details: 'As sessões concluídas continuarão no histórico.', icon: 'trash', variant: 'error',
    cancelText: 'Manter ficha', confirmText: 'Excluir ficha', action: () => store.excluirFicha(ficha)
  })
  if (confirmed) feedback.success('Ficha excluída com sucesso!')
}
</script>

<template>
  <div v-if="modo === 'detalhe' && fichaSelecionada" class="flex flex-col gap-5 pb-12">
    <PagePillHeader :titulo="fichaSelecionada.nome" :subtitulo="fichaSelecionada.foco || 'Programa de treino'" tema="fichas" mostrar-voltar @voltar="store.voltar" />

    <section class="mx-1 rounded-3xl border border-cerulean-100 bg-white p-5 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span v-if="fichaSelecionada.id === fichaAtual?.id" class="inline-flex items-center gap-1 rounded-full bg-cerulean-50 px-2.5 py-1 text-[10px] font-bold text-cerulean-700"><BadgeCheck :size="14" /> Ficha atual</span>
            <span class="rounded-full bg-whitesmoke-100 px-2.5 py-1 text-[10px] font-semibold text-whitesmoke-600">{{ fichaSelecionada.origem === 'importada' ? 'Importada' : 'Criada por mim' }}</span>
          </div>
          <p class="mt-3 text-sm leading-relaxed text-whitesmoke-600">{{ fichaSelecionada.foco || 'Sem descrição.' }}</p>
          <p class="mt-3 flex items-center gap-2 text-xs font-semibold text-whitesmoke-500"><Dumbbell :size="15" class="text-cerulean-600" />{{ fichaSelecionada.treinos.length }} {{ fichaSelecionada.treinos.length === 1 ? 'treino' : 'treinos' }} <span aria-hidden="true">·</span><CalendarDays :size="14" />{{ resumoDias(fichaSelecionada) }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-1"><FichasCompartilhamento compact somente-exportar :ficha-id="fichaSelecionada.id" /><button type="button" class="rounded-full bg-whitesmoke-50 p-3 text-cerulean-700 shadow-sm" aria-label="Editar ficha" title="Editar ficha" @click="store.abrirEdicaoFicha(fichaSelecionada)"><Edit3 :size="17" /></button></div>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-2">
        <button v-if="fichaSelecionada.id !== fichaAtual?.id" type="button" class="min-h-11 rounded-xl bg-cerulean-600 px-3 text-xs font-bold text-white hover:bg-cerulean-700" @click="protegerSessaoAtiva(() => definirComoAtual(fichaSelecionada!))":disabled="processando" :aria-busy="processando">{{ processando ? 'Processando…' : 'Definir como atual' }}</button>
        <button type="button" class="min-h-11 rounded-xl bg-cerulean-50 px-3 text-xs font-bold text-cerulean-700 hover:bg-cerulean-100" @click="store.adicionarTreino()"><CirclePlus :size="15" class="mr-1 inline" />Adicionar treino</button>
        <button type="button" class="min-h-11 rounded-xl bg-whitesmoke-50 px-3 text-xs font-bold text-whitesmoke-700 hover:bg-whitesmoke-100" :disabled="processando" :aria-busy="processando" @click="protegerSessaoAtiva(() => store.duplicarFicha(fichaSelecionada!))"><Copy :size="15" class="mr-1 inline" />{{ processando ? 'Processando…' : 'Duplicar ficha' }}</button>
        <button type="button" class="min-h-11 rounded-xl bg-bubblegum-50 px-3 text-xs font-bold text-bubblegum-700 hover:bg-bubblegum-100" @click="excluir(fichaSelecionada)"><Trash2 :size="15" class="mr-1 inline" />Excluir ficha</button>
      </div>
    </section>

    <section class="mx-1 rounded-[2rem] border border-whitesmoke-200 bg-gradient-to-br from-white via-white to-cerulean-50/50 p-4 shadow-sm sm:p-5" aria-labelledby="programacao-titulo">
      <div class="mb-5 flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cerulean-600 text-white shadow-md shadow-cerulean-600/20"><CalendarDays :size="21" /></span>
          <div><p class="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cerulean-600">Sua rotina</p><h2 id="programacao-titulo" class="text-base font-black tracking-tight text-whitesmoke-950">Programação semanal</h2></div>
        </div>
        <span class="shrink-0 rounded-full border border-cerulean-100 bg-white px-2.5 py-1.5 text-[10px] font-bold text-cerulean-700">{{ diasDaFicha(fichaSelecionada).length }} / 7 dias</span>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div v-for="item in semana" :key="item.dia" class="relative flex min-h-48 min-w-0 flex-col overflow-hidden rounded-[1.5rem] border transition" :class="item.treino ? 'border-white bg-white shadow-md shadow-whitesmoke-950/5' : 'border-dashed border-whitesmoke-200 bg-whitesmoke-50/70'">
          <template v-if="item.treino">
            <button type="button" class="group relative flex h-full flex-1 flex-col overflow-hidden p-4 text-left transition hover:brightness-[0.98] active:scale-[0.98]" :class="store.getCorObj(item.treino.corTema || fichaSelecionada.corTema).light" :aria-label="`Editar ${item.treino.nome} de ${item.nome}`" @click="store.editarTreino(item.treino)">
              <span class="absolute inset-x-0 top-0 h-1" :class="store.getCorObj(item.treino.corTema || fichaSelecionada.corTema).bg" />
              <span class="pointer-events-none absolute -right-7 -top-7 h-28 w-28 rounded-full opacity-[0.07]" :class="store.getCorObj(item.treino.corTema || fichaSelecionada.corTema).bg" />
              <span class="relative mb-4 flex w-full items-center justify-between gap-1">
                <span class="text-[10px] font-black uppercase tracking-wider" :class="store.getCorObj(item.treino.corTema || fichaSelecionada.corTema).text">{{ item.nome }}</span>
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80" :class="store.getCorObj(item.treino.corTema || fichaSelecionada.corTema).text"><Dumbbell :size="14" /></span>
              </span>
              <span class="relative w-full break-words text-base font-black leading-tight tracking-tight text-whitesmoke-950">{{ item.treino.nome }}</span>
              <span class="relative mt-1.5 w-full break-words text-[11px] leading-relaxed text-whitesmoke-600">{{ item.treino.foco }}</span>
              <span class="relative mt-auto flex w-full items-center justify-between gap-1 pt-5">
                <span class="rounded-full bg-white/80 px-2 py-1 text-[9px] font-bold text-whitesmoke-600">{{ item.treino.exercicios.length }} exercícios</span>
                <ChevronRight :size="15" class="shrink-0 transition group-hover:translate-x-0.5" :class="store.getCorObj(item.treino.corTema || fichaSelecionada.corTema).text" />
              </span>
            </button>
          </template>
          <div v-else class="flex flex-1 flex-col p-4">
            <span class="text-[10px] font-bold uppercase tracking-wider text-whitesmoke-400">{{ item.nome }}</span>
            <div class="flex flex-1 flex-col items-center justify-center gap-2 py-3">
              <span class="flex h-12 w-12 items-center justify-center rounded-full bg-white text-whitesmoke-400 shadow-sm"><BedDouble :size="23" stroke-width="1.5" /></span>
              <span class="text-xs font-bold text-whitesmoke-500">Descanso</span>
              <span class="text-[10px] text-whitesmoke-400">Hora de recuperar</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-1 flex flex-col gap-3" aria-labelledby="treinos-ficha-titulo">
      <div class="flex items-center justify-between px-1"><h2 id="treinos-ficha-titulo" class="font-bold text-whitesmoke-900">Treinos desta ficha</h2><span class="text-xs text-whitesmoke-500">{{ fichaSelecionada.treinos.length }}</span></div>
      <article v-for="treino in fichaSelecionada.treinos" :key="treino.id" class="rounded-3xl border border-whitesmoke-200 bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-black" :class="[store.getCorObj(treino.corTema || fichaSelecionada.corTema).light, store.getCorObj(treino.corTema || fichaSelecionada.corTema).text]">{{ treino.nome.split(/[ -]/)[1]?.[0] || String(treino.ordem) }}</span><div class="min-w-0"><h3 class="break-words font-bold text-whitesmoke-950">{{ treino.nome }}</h3><p class="mt-0.5 text-xs text-whitesmoke-500">{{ treino.foco }} · {{ treino.exercicios.length }} exercícios</p><p class="mt-1 text-[11px] font-medium text-cerulean-700">{{ treino.diasDaSemana.length ? treino.diasDaSemana.map(d => `${dias[d]}`).join(' · ') : 'Sem dia fixo' }}</p></div></div>
          <button type="button" class="shrink-0 rounded-full bg-whitesmoke-50 p-2.5 text-cerulean-700" :aria-label="`Editar ${treino.nome}`" @click="store.editarTreino(treino)"><Edit3 :size="16" /></button>
        </div>
        <details class="mt-3 rounded-2xl bg-whitesmoke-50 px-3 py-2.5"><summary class="cursor-pointer text-xs font-semibold text-whitesmoke-600">Ver exercícios</summary><ol class="mt-2 flex flex-col gap-1.5 text-xs text-whitesmoke-700"><li v-for="(ex, index) in treino.exercicios" :key="`${ex.exercicioId}-${index}`" class="flex justify-between gap-3"><span>{{ index + 1 }}. {{ store.catalogo.find(c => c.id === ex.exercicioId)?.nome || 'Exercício personalizado' }}</span><span class="shrink-0 text-whitesmoke-500">{{ ex.series }} × {{ ex.repsAlvo }}</span></li></ol></details>
      </article>
      <div v-if="fichaSelecionada.treinos.length === 0" class="rounded-2xl border border-dashed border-whitesmoke-300 p-6 text-center text-sm text-whitesmoke-500">Esta ficha ainda não tem treinos.</div>
    </section>
  </div>

  <div v-else class="flex flex-col gap-5 animate-in slide-in-from-left-4 pb-12">
    <SectionPageHeader titulo="Minhas Fichas" subtitulo="Organize seus programas de treino." tema="fichas">
      <template #acoes><FichasCompartilhamento compact /><button type="button" aria-label="Criar ficha" title="Criar ficha" class="flex h-11 w-11 items-center justify-center rounded-full bg-white text-cerulean-600 shadow-sm hover:bg-cerulean-50" @click="store.abrirNovaFicha"><CirclePlus :size="19" /></button></template>
    </SectionPageHeader>

    <section aria-labelledby="ficha-atual-heading" class="flex flex-col gap-3">
      <h2 id="ficha-atual-heading" class="px-2 text-xs font-bold uppercase tracking-widest text-whitesmoke-500">Ficha atual</h2>
      <button v-if="fichaAtual" type="button" class="relative overflow-hidden rounded-[1.75rem] border border-cerulean-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md" @click="store.abrirDetalhes(fichaAtual)">
        <div class="absolute inset-y-0 left-0 w-1.5 bg-cerulean-600" />
        <div class="flex items-start justify-between gap-3 pl-2"><div class="min-w-0"><span class="inline-flex items-center gap-1 rounded-full bg-cerulean-50 px-2.5 py-1 text-[10px] font-bold text-cerulean-700"><BadgeCheck :size="14" /> Ficha ativa</span><h3 class="mt-2 break-words text-xl font-bold text-whitesmoke-950">{{ fichaAtual.nome }}</h3><p class="mt-1 text-sm text-whitesmoke-600">{{ fichaAtual.foco }}</p></div><ChevronRight :size="19" class="mt-2 shrink-0 text-cerulean-600" /></div>
        <div class="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-whitesmoke-100 pt-3 pl-2 text-xs font-medium text-whitesmoke-600"><span class="inline-flex items-center gap-1.5"><Dumbbell :size="14" class="text-cerulean-600" />{{ fichaAtual.treinos.length }} treinos</span><span class="inline-flex items-center gap-1.5"><CalendarDays :size="14" class="text-cerulean-600" />{{ resumoDias(fichaAtual) }}</span></div>
      </button>
      <div v-else class="rounded-3xl border border-dashed border-cerulean-200 bg-white p-6 text-center"><span class="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-cerulean-50 text-cerulean-600"><Coffee :size="21" /></span><h3 class="mt-3 font-bold text-whitesmoke-900">Nenhuma ficha atual</h3><p class="mx-auto mt-1 max-w-sm text-sm text-whitesmoke-500">Crie ou importe um programa e escolha qual será sua rotina vigente.</p></div>
    </section>

    <section aria-labelledby="biblioteca-heading" class="flex flex-col gap-3">
      <div class="flex items-center justify-between px-2"><h2 id="biblioteca-heading" class="flex items-center gap-2 text-sm font-bold text-whitesmoke-900"><Library :size="17" class="text-cerulean-600" />Biblioteca</h2><span class="text-xs text-whitesmoke-500">{{ fichasFiltradas.length }} fichas</span></div>
      <div class="flex gap-2 px-1" role="group" aria-label="Filtrar fichas">
        <button v-for="item in [{ id: 'todas', label: 'Todas' }, { id: 'local', label: 'Criadas por mim' }, { id: 'importada', label: 'Importadas' }]" :key="item.id" type="button" class="rounded-full px-3 py-2 text-[11px] font-bold transition" :class="filtro === item.id ? 'bg-cerulean-600 text-white' : 'bg-white text-whitesmoke-600 shadow-sm'" @click="filtro = item.id as typeof filtro">{{ item.label }}</button>
      </div>
      <button v-for="ficha in fichasFiltradas" :key="ficha.id" type="button" class="flex w-full items-center gap-3 rounded-2xl border border-whitesmoke-200 bg-white p-4 text-left shadow-sm transition hover:border-cerulean-200" @click="store.abrirDetalhes(ficha)">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cerulean-50 text-cerulean-600"><Dumbbell :size="18" /></span><span class="min-w-0 flex-1"><span class="block truncate text-sm font-bold text-whitesmoke-950">{{ ficha.nome }}</span><span class="mt-0.5 block truncate text-xs text-whitesmoke-500">{{ ficha.foco }} · {{ ficha.treinos.length }} {{ ficha.treinos.length === 1 ? 'treino' : 'treinos' }} · {{ ficha.origem === 'importada' ? 'Importada' : 'Criada por mim' }}</span></span><ChevronRight :size="17" class="shrink-0 text-whitesmoke-400" />
      </button>
      <div v-if="fichasFiltradas.length === 0" class="rounded-2xl border border-dashed border-whitesmoke-300 bg-white p-6 text-center text-sm text-whitesmoke-500">{{ fichasSalvas.length === 0 ? 'Sua biblioteca está vazia. Crie ou importe uma ficha para começar.' : 'Nenhuma ficha neste filtro.' }}</div>
    </section>
  </div>
</template>
