<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { AlertCircle, BedSingle, Check, Flame, LockKeyhole, X } from 'lucide-vue-next'
import { sequencia } from '@/services/sequencia'
import { foguinhoModal } from '@/services/foguinhoModal'
import { NIVEIS_FOGUINHO } from '@/utils/sequencia'
import FoguinhoChama from './FoguinhoChama.vue'

const progresso = computed(() => sequencia.estado.value)
const indisponivel = sequencia.erro
const nivelAtual = computed(() => NIVEIS_FOGUINHO[progresso.value.nivel] ?? NIVEIS_FOGUINHO[0])
const proximoNivel = computed(() => NIVEIS_FOGUINHO[progresso.value.nivel + 1])
const progressoCiclo = computed(() => progresso.value.obrigacoesNoCiclo ? Math.round(progresso.value.concluidosNoCiclo / progresso.value.obrigacoesNoCiclo * 100) : 0)
const semanasRestantes = computed(() => proximoNivel.value ? Math.max(0, progresso.value.nivel + 1 - progresso.value.semanasConsecutivas) : 0)
const descricao = computed(() => progresso.value.nivel === 0
  ? 'Seu fogo está começando a despertar.'
  : progresso.value.nivel === 1
    ? 'Duas sessões seguidas acenderam sua primeira faísca.'
    : progresso.value.nivel === 5
      ? 'Você alcançou o nível máximo do Gy.'
      : 'Seu fogo está ficando cada vez mais forte!')
const mensagemProxima = computed(() => {
  if (!proximoNivel.value) return 'Mantenha todos os treinos programados para conservar o Gy Prime.'
  if (progresso.value.nivel === 0) return 'Conclua 2 treinos programados sem interrupção para acender a Faísca.'
  return `Complete mais ${semanasRestantes.value} ${semanasRestantes.value === 1 ? 'semana válida' : 'semanas válidas'} sem faltar.`
})
const nivelLiberado = (indice: number) => indice <= progresso.value.nivel
const statusNivel = (indice: number) => indice === progresso.value.nivel ? 'Nível atual' : indice < progresso.value.nivel ? 'Conquistado nesta sequência' : 'Ainda bloqueado'
const fechar = () => foguinhoModal.fechar()
const teclado = (evento: KeyboardEvent) => { if (evento.key === 'Escape') { evento.preventDefault(); fechar() } }
const clicarFora = (evento: MouseEvent) => { if (evento.target === evento.currentTarget) fechar() }
if (typeof document !== 'undefined') document.addEventListener('keydown', teclado)
onBeforeUnmount(() => document.removeEventListener('keydown', teclado))
</script>

<template>
  <Transition name="foguinho-modal">
    <div v-if="foguinhoModal.aberto.value" class="gy-modal-backdrop absolute inset-0 z-[150] flex items-end justify-center px-0 pt-3 sm:items-center sm:px-5 sm:py-4" style="--gy-modal-opacity: .35; --gy-modal-blur: 2px" @click="clicarFora">
      <section role="dialog" aria-modal="true" aria-labelledby="foguinho-titulo" aria-describedby="foguinho-descricao" tabindex="-1" class="foguinho-painel gy-modal-height w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl outline-none sm:rounded-[2rem] sm:p-6">
        <div class="mx-auto mb-3 h-1 w-10 rounded-full bg-whitesmoke-200 sm:hidden"></div>
        <div class="mb-4 flex items-start justify-between gap-3">
          <div><p class="text-[10px] font-bold uppercase tracking-[.2em] text-bubblegum-600">Sua sequência</p><h2 id="foguinho-titulo" class="mt-1 text-xl font-black text-whitesmoke-950">Seu foguinho</h2></div>
          <button type="button" aria-label="Fechar detalhes do foguinho" class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-whitesmoke-100 text-whitesmoke-700 transition hover:bg-whitesmoke-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bubblegum-600" @click="fechar"><X :size="21" /></button>
        </div>

        <section class="relative overflow-hidden rounded-[1.6rem] border border-violet-100 bg-gradient-to-br from-white via-bubblegum-50/40 to-violet-50 p-4" :style="{ '--nivel-cor': typeof nivelAtual.cor === 'string' && !nivelAtual.cor.startsWith('linear') ? nivelAtual.cor : '#a855f7' }">
          <div class="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full opacity-20 blur-3xl" :style="{ background: nivelAtual.cor }"></div>
          <div class="relative flex items-center gap-4">
            <div class="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[1.4rem] border border-white bg-white/85 shadow-sm"><FoguinhoChama :nivel="progresso.nivel" :tamanho="48" :animar="progresso.nivel === 5" /></div>
            <div class="min-w-0 flex-1"><p class="text-xs font-semibold text-whitesmoke-500">Nível atual</p><h3 class="truncate text-xl font-black" :style="{ color: typeof nivelAtual.cor === 'string' && !nivelAtual.cor.startsWith('linear') ? nivelAtual.cor : '#8c4de8' }">{{ indisponivel ? 'Progresso indisponível' : nivelAtual.nome }}</h3><p id="foguinho-descricao" class="mt-1 text-xs leading-relaxed text-whitesmoke-600">{{ indisponivel ? 'Tente reabrir o aplicativo para carregar seus dados.' : descricao }}</p></div>
          </div>
          <div class="relative mt-4 grid grid-cols-2 gap-2">
            <div class="rounded-xl border border-white/80 bg-white/80 p-3"><p class="text-[10px] font-semibold uppercase tracking-wide text-whitesmoke-500">Sequência</p><p class="mt-1 text-lg font-black text-whitesmoke-900">{{ progresso.semanasConsecutivas }} <span class="text-xs font-semibold">{{ progresso.semanasConsecutivas === 1 ? 'semana' : 'semanas' }}</span></p></div>
            <div class="rounded-xl border border-white/80 bg-white/80 p-3"><p class="text-[10px] font-semibold uppercase tracking-wide text-whitesmoke-500">Ciclo atual</p><p class="mt-1 text-lg font-black text-whitesmoke-900">{{ progresso.concluidosNoCiclo }} <span class="text-sm font-semibold">de {{ progresso.obrigacoesNoCiclo }}</span></p></div>
          </div>
        </section>

        <section class="mt-4 rounded-[1.4rem] border border-whitesmoke-200 bg-white p-4" aria-labelledby="ciclo-titulo">
          <div class="flex items-center justify-between gap-2"><div><h3 id="ciclo-titulo" class="text-sm font-black text-whitesmoke-900">Sua semana</h3><p class="mt-0.5 text-[11px] text-whitesmoke-500">Segunda a domingo · datas locais</p></div><span class="rounded-full bg-whitesmoke-100 px-2.5 py-1 text-[10px] font-bold text-whitesmoke-600">{{ progresso.obrigacoesNoCiclo ? `${progresso.concluidosNoCiclo} de ${progresso.obrigacoesNoCiclo}` : 'Sem obrigações' }}</span></div>
          <div class="mt-3 grid grid-cols-7 gap-1.5" role="list" aria-label="Situação dos treinos da semana">
            <div v-for="dia in progresso.dias" :key="dia.dia" role="listitem" class="flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-0.5 py-2" :class="dia.estado === 'concluido' ? 'bg-teal-50' : dia.estado === 'falta' ? 'bg-rose-50' : 'bg-whitesmoke-50'" :aria-label="`${dia.nome}, ${dia.dia}: ${dia.estado === 'concluido' ? 'treino concluído' : dia.estado === 'falta' ? 'treino não concluído' : dia.estado === 'pendente' ? 'treino pendente' : 'descanso'}${dia.treinoNome ? `, ${dia.treinoNome}` : ''}`">
              <span class="text-[9px] font-bold uppercase text-whitesmoke-500">{{ dia.nome }}</span>
              <span class="flex h-7 w-7 items-center justify-center rounded-full" :class="dia.estado === 'concluido' ? 'bg-teal-600 text-white' : dia.estado === 'falta' ? 'bg-rose-100 text-rose-700' : dia.estado === 'pendente' ? 'border border-whitesmoke-300 bg-white text-whitesmoke-400' : 'bg-whitesmoke-200/70 text-whitesmoke-500'">
                <Check v-if="dia.estado === 'concluido'" :size="15" :stroke-width="3" /><AlertCircle v-else-if="dia.estado === 'falta'" :size="15" /><Flame v-else-if="dia.estado === 'pendente'" :size="14" /><BedSingle v-else :size="15" />
              </span>
              <span class="max-w-full truncate text-[8px] font-medium text-whitesmoke-500">{{ dia.treinoNome || 'Descanso' }}</span>
            </div>
          </div>
          <div class="mt-3 h-2 overflow-hidden rounded-full bg-whitesmoke-100" role="progressbar" :aria-valuenow="progresso.concluidosNoCiclo" :aria-valuemin="0" :aria-valuemax="progresso.obrigacoesNoCiclo" :aria-label="`Progresso da semana: ${progresso.concluidosNoCiclo} de ${progresso.obrigacoesNoCiclo} treinos`"><div class="foguinho-progresso h-full rounded-full bg-gradient-to-r from-orange-400 to-bubblegum-500" :style="{ width: `${progressoCiclo}%` }"></div></div>
        </section>

        <section v-if="proximoNivel" class="mt-3 flex items-center gap-3 rounded-[1.4rem] border border-whitesmoke-200 bg-whitesmoke-50 p-3" aria-live="polite">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm"><FoguinhoChama :nivel="progresso.nivel + 1" :tamanho="27" /></div><div class="min-w-0"><p class="text-[10px] font-semibold uppercase tracking-wide text-whitesmoke-500">Próximo nível: <strong class="text-whitesmoke-800">{{ proximoNivel.nome }}</strong></p><p class="mt-0.5 text-xs leading-relaxed text-whitesmoke-600">{{ mensagemProxima }}</p></div>
        </section>
        <section v-else class="mt-3 rounded-[1.4rem] border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 p-3" aria-live="polite"><div class="flex items-center gap-2"><Flame :size="18" class="text-violet-600" /><p class="text-sm font-black text-violet-800">Gy Prime conquistado</p></div><p class="mt-1 text-xs leading-relaxed text-violet-700">{{ mensagemProxima }}</p></section>

        <section class="mt-4" aria-labelledby="trilha-titulo"><div class="mb-2 flex items-center justify-between"><h3 id="trilha-titulo" class="text-sm font-black text-whitesmoke-900">Trilha das chamas</h3><span class="text-[10px] text-whitesmoke-500">{{ progresso.nivel + 1 }} de 6</span></div>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <article v-for="(item, indice) in NIVEIS_FOGUINHO" :key="item.id" class="flex min-w-0 items-center gap-2 rounded-xl border p-2" :class="indice === progresso.nivel ? 'border-bubblegum-200 bg-bubblegum-50/60 ring-1 ring-bubblegum-100' : nivelLiberado(indice) ? 'border-teal-100 bg-teal-50/40' : 'border-whitesmoke-200 bg-whitesmoke-50/70'">
              <FoguinhoChama :nivel="indice" :tamanho="23" /><div class="min-w-0 flex-1"><p class="truncate text-[11px] font-black text-whitesmoke-800">{{ item.nome }}</p><p class="truncate text-[9px] text-whitesmoke-500">{{ statusNivel(indice) }}</p></div><Check v-if="nivelLiberado(indice) && indice !== progresso.nivel" :size="14" class="shrink-0 text-teal-600" /><LockKeyhole v-else-if="indice > progresso.nivel" :size="13" class="shrink-0 text-whitesmoke-400" />
            </article>
          </div>
        </section>

        <details class="mt-4 rounded-[1.4rem] border border-whitesmoke-200 bg-white p-4"><summary class="cursor-pointer text-sm font-black text-whitesmoke-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bubblegum-600">Como funciona?</summary><ul class="mt-3 space-y-2 text-xs leading-relaxed text-whitesmoke-600"><li>Seu foguinho cresce quando você conclui todos os treinos programados da semana.</li><li>Dias de descanso não quebram a sequência. Uma falta em dia obrigatório reinicia a progressão.</li><li>Cada semana completa válida fortalece a chama; quatro semanas consecutivas desbloqueiam o Gy Prime.</li><li>Deslocar treinos não apaga faltas já consolidadas.</li></ul></details>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.foguinho-painel { max-height: calc(100% - 1rem); scrollbar-width: none; }
.foguinho-painel::-webkit-scrollbar { display: none; }
.foguinho-progresso { transition: width .65s cubic-bezier(.22,1,.36,1); }
.foguinho-modal-enter-active,.foguinho-modal-leave-active { transition: opacity .22s ease; }
.foguinho-modal-enter-active .foguinho-painel,.foguinho-modal-leave-active .foguinho-painel { transition: transform .38s cubic-bezier(.22,1,.36,1); }
.foguinho-modal-enter-from,.foguinho-modal-leave-to { opacity: 0; }
.foguinho-modal-enter-from .foguinho-painel,.foguinho-modal-leave-to .foguinho-painel { transform: translateY(100%); }
@media (min-width: 640px) { .foguinho-modal-enter-from .foguinho-painel,.foguinho-modal-leave-to .foguinho-painel { transform: translateY(1.25rem) scale(.985); } }
@media (prefers-reduced-motion: reduce) { .foguinho-painel,.foguinho-progresso { transition: none !important; animation: none !important; } }
</style>
