<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { confirmation } from '@/composables/useConfirm'
import { feedback } from '@/composables/useFeedback'
import { useRoute, useRouter } from 'vue-router'
import TopBar from '@/components/layout/TopBar.vue'
import { sequencia } from '@/services/sequencia'
import { iniciarCoordenacaoBackup, restauracaoBloqueada } from '@/services/backupCoordinator'
import { useTreinoStore } from '@/stores/treinoStore'
import { useModalAcessibilidade } from '@/composables/useModalAcessibilidade'
import FoguinhoModal from '@/components/layout/FoguinhoModal.vue'
import { foguinhoModal } from '@/services/foguinhoModal'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { conectarRegistroPwa, iniciarPwaRuntime, pwaApp, registrarServiceWorker, verificarAtualizacoes } from '@/services/pwaRuntime'

const route = useRoute()
const router = useRouter()
const { state } = confirmation
const foguinhoAberto = foguinhoModal.aberto
const topBarContainer = ref<HTMLElement | null>(null)
const alturaTopBar = ref(0)
let observarTopBar: ResizeObserver | undefined
watch(topBarContainer, elemento => {
  observarTopBar?.disconnect()
  alturaTopBar.value = elemento?.getBoundingClientRect().height ?? 0
  if (!elemento) return
  observarTopBar = new ResizeObserver(() => { alturaTopBar.value = elemento.getBoundingClientRect().height })
  observarTopBar.observe(elemento)
}, { flush: 'post' })
let interval: ReturnType<typeof setInterval> | undefined
let pararSequencia: (() => void) | undefined
let pararCoordenacaoBackup: (() => void) | undefined
const treino = useTreinoStore()
const modalAberto = useModalAcessibilidade()
let pararPwaRuntime: (() => void) | undefined
let pararVerificacoes: (() => void) | undefined
let ultimaVerificacao = 0
let notificouAtualizacao = false
const pwa = useRegisterSW({
  immediate: true,
  onRegisteredSW: (_url: string, registration: ServiceWorkerRegistration | undefined) => registrarServiceWorker(registration),
  onNeedRefresh: () => {
    pwaApp.updateAvailable = true
    if (notificouAtualizacao) return
    notificouAtualizacao = true
    feedback.info(treino.sessaoEstado === 'em_andamento' ? 'Nova versão disponível. A atualização ficará para depois do treino.' : 'Uma nova versão do Gy está disponível.')
  },
  onOfflineReady: () => {},
  onRegisterError: () => { pwaApp.updateSupported = false }
})
const conexaoRegistro = conectarRegistroPwa(pwa.needRefresh, pwa.updateServiceWorker, 'serviceWorker' in navigator)
pararPwaRuntime = iniciarPwaRuntime()
pararVerificacoes = conexaoRegistro.stop
watch(pwa.needRefresh, conexaoRegistro.sincronizarPendente, { immediate: true })
const coresSistema: Record<string, string> = {
  treino: '#9b44bb', fichas: '#2680a6', historico: '#3f868d', perfil: '#fc6471', evolucao: '#3f795f', onboarding: '#fc6471'
}
const coresFeedback: Record<string, string> = { success: '#72b9c0', error: '#fc7a86', warning: '#fcd34d', info: '#59b3d9' }
watch([() => route.path, feedback.current, () => !!state.value.options], ([path, mensagem, confirmando]) => {
  if (confirmando) mensagem = null
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) return
  path = path.replace(/\/$/, '') || '/'
  if (path === '/onboarding') mensagem = null
  const secao = path === '/fichas' ? 'fichas' : path === '/historico' ? 'historico' : path === '/perfil' ? 'perfil' : path === '/evolucao' ? 'evolucao' : path === '/onboarding' ? 'onboarding' : 'treino'
  meta.content = mensagem ? coresFeedback[mensagem.kind] ?? coresSistema[secao] : coresSistema[secao]
  document.documentElement.style.setProperty('--gy-system-color', meta.content)
  document.documentElement.style.backgroundColor = meta.content
  document.body.style.backgroundColor = meta.content
}, { immediate: true })
watch([modalAberto, foguinhoModal.aberto], ([dialogo, foguinho]) => feedback.pause('modal', dialogo || foguinho))
const visibility = () => feedback.pause('hidden', document.hidden)
const dadosInvalidados = () => window.location.replace(router.resolve('/onboarding').href)
watch(() => route.name === 'Onboarding', hidden => feedback.pause('no-surface', hidden), { immediate: true })
watch(() => !!state.value.options, open => feedback.pause('confirmation', open), { flush: 'sync' })
onMounted(() => {
  void router.isReady().then(() => {
    if (route.path !== '/' && route.name !== 'Onboarding') void treino.carregarTreinoDoDia()
  })
  pararSequencia = sequencia.iniciar()
  pararCoordenacaoBackup = iniciarCoordenacaoBackup(async () => {
    if (state.value.busy) throw new Error('Outra confirmação está em andamento nesta aba.')
    if (state.value.options) confirmation.cancel()
    await treino.pausarParaBackup()
  }, treino.retomarAposBackup)
  visibility()
  document.addEventListener('visibilitychange', visibility)
  window.addEventListener('gy:dados-invalidados', dadosInvalidados)
  interval = setInterval(feedback.tick, 50)
  if (navigator.onLine) setTimeout(() => { ultimaVerificacao = Date.now(); void verificarAtualizacoes() }, 2500)
  const verificarAoVoltar = () => {
    if (!document.hidden && navigator.onLine && Date.now() - ultimaVerificacao > 15 * 60 * 1000) {
      ultimaVerificacao = Date.now()
      void verificarAtualizacoes()
    }
  }
  const verificarConexao = () => {
    if (navigator.onLine) { ultimaVerificacao = Date.now(); void verificarAtualizacoes() }
  }
  const timerAtualizacoes = setInterval(() => {
    if (navigator.onLine) { ultimaVerificacao = Date.now(); void verificarAtualizacoes() }
  }, 6 * 60 * 60 * 1000)
  document.addEventListener('visibilitychange', verificarAoVoltar)
  window.addEventListener('online', verificarConexao)
  pararVerificacoes = () => { conexaoRegistro.stop(); clearInterval(timerAtualizacoes); document.removeEventListener('visibilitychange', verificarAoVoltar); window.removeEventListener('online', verificarConexao) }
})
onBeforeUnmount(() => { observarTopBar?.disconnect(); pararSequencia?.(); pararCoordenacaoBackup?.(); pararPwaRuntime?.(); pararVerificacoes?.(); clearInterval(interval); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('gy:dados-invalidados', dadosInvalidados) })
</script>

<template>
  <div class="flex h-dvh flex-col overflow-clip bg-whitesmoke-50" :style="{ '--gy-topbar-height': `${alturaTopBar}px` }">
    
    <div v-if="route.name !== 'Onboarding'" ref="topBarContainer" class="relative z-[100] shrink-0" :class="{ 'pointer-events-none': foguinhoAberto }" :inert="(modalAberto && !foguinhoAberto) || !!state.options || restauracaoBloqueada"><TopBar /></div>

    <div class="relative isolate z-0 min-h-0 flex-1 [container-type:size]">

    <main tabindex="-1" :inert="foguinhoAberto || !!state.options || restauracaoBloqueada" class="h-full min-h-0 overflow-y-auto px-4 pb-4 bg-whitesmoke-50" :class="{ '!overflow-hidden': !!state.options || foguinhoAberto }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <FoguinhoModal v-if="foguinhoAberto" />
    <ConfirmDialog />
    </div>
    <div class="gy-gesture-space" aria-hidden="true"></div>
    <div class="gy-gesture-background" aria-hidden="true"></div>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
