import { reactive, ref, type Ref } from 'vue'
import { gyEstaStandalone, podeOferecerInstalacao } from '@/utils/pwaPolicy'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export const pwaApp = reactive({
  version: __GY_VERSION__,
  standalone: false,
  installed: false,
  installAvailable: false,
  installing: false,
  updateAvailable: false,
  checkingUpdates: false,
  updateSupported: false,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  otherTabs: 0,
  installGuideVisible: false
})

export const guiaDispensado = ref(false)

let installPrompt: BeforeInstallPromptEvent | null = null
let registration: ServiceWorkerRegistration | null = null
let aplicarAtualizacao: ((reloadPage?: boolean) => Promise<void>) | null = null
let atualizarPendenteRef: Ref<boolean> | null = null
let canal: BroadcastChannel | null = null
let heartbeat: ReturnType<typeof setInterval> | undefined
const idAba = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
const abas = new Map<string, number>()
const canalNome = 'gy-pwa-presenca-v1'
const nomeBloqueioPresenca = 'gy-pwa-tab-presence'
let liberarBloqueioPresenca: (() => void) | undefined
let bloqueioPresencaPronto = false
let resolverBloqueioPresenca!: () => void
const bloqueioPresencaIniciado = new Promise<void>(resolve => { resolverBloqueioPresenca = resolve })

const modoStandalone = () => gyEstaStandalone(
  window.matchMedia('(display-mode: standalone)').matches,
  window.matchMedia('(display-mode: window-controls-overlay)').matches,
  'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
)

const sincronizarEstadoInstalacao = () => {
  pwaApp.standalone = modoStandalone()
  if (pwaApp.standalone) {
    pwaApp.installed = true
    pwaApp.installAvailable = false
    installPrompt = null
  }
}

const enviar = (tipo: 'hello' | 'probe', respostaA?: string) => canal?.postMessage({ tipo, aba: idAba, respostaA, momento: Date.now() })

const atualizarAbas = () => {
  const limite = Date.now() - 8000
  for (const [id, visto] of abas) if (visto < limite) abas.delete(id)
  pwaApp.otherTabs = abas.size
}

export function iniciarPwaRuntime() {
  if (typeof window === 'undefined') return () => {}
  sincronizarEstadoInstalacao()
  try { guiaDispensado.value = localStorage.getItem('gy:guia-instalacao-dispensado') === 'sim' } catch { }

  const adicionarPrompt = (evento: Event) => {
    evento.preventDefault()
    if (podeOferecerInstalacao(pwaApp.standalone, pwaApp.installed, true) === false) return
    installPrompt = evento as BeforeInstallPromptEvent
    pwaApp.installAvailable = true
  }
  const instalado = () => {
    installPrompt = null
    pwaApp.installAvailable = false
    pwaApp.installed = true
    sincronizarEstadoInstalacao()
  }
  const online = () => { pwaApp.online = true }
  const offline = () => { pwaApp.online = false }
  const visibilidade = () => { if (!document.hidden) sincronizarEstadoInstalacao() }
  const estadoDisplay = window.matchMedia('(display-mode: standalone)')
  estadoDisplay.addEventListener?.('change', sincronizarEstadoInstalacao)
  window.addEventListener('beforeinstallprompt', adicionarPrompt)
  window.addEventListener('appinstalled', instalado)
  window.addEventListener('online', online)
  window.addEventListener('offline', offline)
  document.addEventListener('visibilitychange', visibilidade)

  if (navigator.locks?.request) {
    const aguardarFechamento = new Promise<void>(resolve => { liberarBloqueioPresenca = resolve })
    void navigator.locks.request(nomeBloqueioPresenca, { mode: 'shared' }, async lock => {
      if (!lock) return
      bloqueioPresencaPronto = true
      resolverBloqueioPresenca()
      await aguardarFechamento
    }).catch(() => { resolverBloqueioPresenca() })
  } else resolverBloqueioPresenca()

  if (typeof BroadcastChannel !== 'undefined') {
    canal = new BroadcastChannel(canalNome)
    canal.addEventListener('message', evento => {
      const mensagem = evento.data as { tipo?: string; aba?: string; respostaA?: string }
      if (!mensagem?.aba || mensagem.aba === idAba) return
      if (mensagem.tipo === 'hello') abas.set(mensagem.aba, Date.now())
      if (mensagem.tipo === 'probe') enviar('hello', mensagem.aba)
      if (mensagem.tipo === 'hello' && mensagem.respostaA === idAba) abas.set(mensagem.aba, Date.now())
      atualizarAbas()
    })
    enviar('hello')
    heartbeat = setInterval(() => { atualizarAbas(); enviar('hello'); void consultarOutrasAbas() }, 2500)
  }

  return () => {
    window.removeEventListener('beforeinstallprompt', adicionarPrompt)
    window.removeEventListener('appinstalled', instalado)
    window.removeEventListener('online', online)
    window.removeEventListener('offline', offline)
    document.removeEventListener('visibilitychange', visibilidade)
    estadoDisplay.removeEventListener?.('change', sincronizarEstadoInstalacao)
    if (heartbeat) clearInterval(heartbeat)
    heartbeat = undefined
    liberarBloqueioPresenca?.()
    liberarBloqueioPresenca = undefined
    bloqueioPresencaPronto = false
    canal?.close()
    canal = null
    abas.clear()
    pwaApp.otherTabs = 0
  }
}

export function conectarRegistroPwa(
  precisaAtualizar: Ref<boolean>,
  atualizar: (reloadPage?: boolean) => Promise<void>,
  suporte: boolean
) {
  atualizarPendenteRef = precisaAtualizar
  aplicarAtualizacao = atualizar
  pwaApp.updateSupported = suporte
  const sincronizarPendente = () => { pwaApp.updateAvailable = precisaAtualizar.value || Boolean(registration?.waiting) }
  const stop = () => { atualizarPendenteRef = null; aplicarAtualizacao = null }
  return { sincronizarPendente, stop }
}

export function registrarServiceWorker(reg: ServiceWorkerRegistration | undefined) {
  registration = reg ?? null
  pwaApp.updateSupported = Boolean(reg)
  pwaApp.updateAvailable = Boolean(atualizarPendenteRef?.value || reg?.waiting)
}

export async function instalarGy() {
  if (!installPrompt || pwaApp.installing) return false
  pwaApp.installing = true
  try {
    const prompt = installPrompt
    await prompt.prompt()
    const escolha = await prompt.userChoice
    installPrompt = null
    pwaApp.installAvailable = false
    if (escolha.outcome === 'accepted') pwaApp.installed = true
    sincronizarEstadoInstalacao()
    return escolha.outcome === 'accepted'
  } finally { pwaApp.installing = false }
}

export function dispensarGuiaInstalacao() {
  guiaDispensado.value = true
  pwaApp.installGuideVisible = false
  try { localStorage.setItem('gy:guia-instalacao-dispensado', 'sim') } catch { }
}

export function mostrarGuiaInstalacao() { pwaApp.installGuideVisible = true }
export function fecharGuiaInstalacao() { pwaApp.installGuideVisible = false }

export async function consultarOutrasAbas() {
  if (canal) {
    enviar('probe')
    await new Promise(resolve => setTimeout(resolve, 350))
    atualizarAbas()
  }
  if (navigator.locks?.query) {
    await Promise.race([bloqueioPresencaIniciado, new Promise(resolve => setTimeout(resolve, 500))])
    if (bloqueioPresencaPronto) {
      try {
        const locks = await navigator.locks.query()
        const contagem = (locks.held ?? []).filter(lock => lock.name === nomeBloqueioPresenca).length
        pwaApp.otherTabs = Math.max(0, contagem - 1)
        return pwaApp.otherTabs
      } catch { }
    }
  }
  return pwaApp.otherTabs
}

export async function verificarAtualizacoes() {
  if (!navigator.onLine) return 'offline' as const
  if (!registration) {
    registration = await navigator.serviceWorker?.getRegistration() ?? null
    if (!registration) return 'unsupported' as const
  }
  if (pwaApp.checkingUpdates) return 'checking' as const
  pwaApp.checkingUpdates = true
  const registro = registration
  let mudouInstalacao: (() => void) | undefined
  try {
    let workerParaAguardar = registro.installing
    let mudou = false
    mudouInstalacao = () => {
      workerParaAguardar = registro.installing
      if (workerParaAguardar) mudou = true
    }
    registro.addEventListener('updatefound', mudouInstalacao)
    await registro.update()
    if (registro.installing) { workerParaAguardar = registro.installing; mudou = true }
    if (mudou && workerParaAguardar) {
      await Promise.race([
        new Promise<void>(resolve => {
          const worker = workerParaAguardar!
          if (worker.state === 'installed' || worker.state === 'activated' || worker.state === 'redundant') { resolve(); return }
          const estado = () => {
            if (worker.state === 'installed' || worker.state === 'activated' || worker.state === 'redundant') {
              worker.removeEventListener('statechange', estado)
              resolve()
            }
          }
          worker.addEventListener('statechange', estado)
        }),
        new Promise<void>(resolve => setTimeout(resolve, 15000))
      ])
    }
    pwaApp.updateAvailable = Boolean(atualizarPendenteRef?.value || registro.waiting)
    return pwaApp.updateAvailable ? 'available' as const : mudou ? 'pending' as const : 'current' as const
  } catch {
    return 'failed' as const
  } finally {
    if (mudouInstalacao) registro.removeEventListener('updatefound', mudouInstalacao)
    pwaApp.checkingUpdates = false
  }
}

export async function aplicarAtualizacaoGy() {
  if (!pwaApp.updateAvailable || !aplicarAtualizacao) throw new Error('A atualização não está pronta. Verifique novamente quando estiver online.')
  const registro = registration ?? await navigator.serviceWorker?.getRegistration()
  if (!registro) throw new Error('O service worker não está disponível. Continue usando o Gy e tente novamente mais tarde.')
  const serviceWorker = navigator.serviceWorker
  const controladorAnterior = serviceWorker.controller
  const ativoAnterior = registro.active
  let controladorAlterado = false
  const controladorMudou = () => { controladorAlterado = true }
  serviceWorker.addEventListener('controllerchange', controladorMudou)
  try {
    await aplicarAtualizacao(true)
    registro.waiting?.postMessage({ type: 'SKIP_WAITING' })
    const limite = Date.now() + 15000
    while (Date.now() < limite) {
      const controladorAtual = serviceWorker.controller
      const ativoAtual = registro.active
      const serviceWorkerTrocado = controladorAlterado || (controladorAtual && controladorAtual !== controladorAnterior) || (ativoAtual && ativoAtual !== ativoAnterior && ativoAtual.state === 'activated') || (pwaApp.updateAvailable && ativoAtual?.state === 'activated' && !registro.waiting && !registro.installing)
      if (serviceWorkerTrocado) {
        window.location.reload()
        return
      }
      await new Promise(resolve => setTimeout(resolve, 150))
    }
    throw new Error('O navegador ainda não ativou a atualização. Continue usando o Gy e tente novamente mais tarde.')
  } finally { serviceWorker.removeEventListener('controllerchange', controladorMudou) }
}
