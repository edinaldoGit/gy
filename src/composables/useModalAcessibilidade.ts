import { onMounted, onBeforeUnmount, ref } from 'vue'

export function useModalAcessibilidade() {
  const aberto = ref(false)
  let painel: HTMLElement | null = null
  let anterior: HTMLElement | null = null
  let observer: MutationObserver | undefined
  const focaveis = () => [...(painel?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') ?? [])].filter(elemento => elemento.getClientRects().length && !elemento.closest('[inert]'))
  const atualizar = () => {
    const proximo = [...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')].at(-1) ?? null
    if (proximo === painel) return
    if (!painel && proximo) anterior = document.activeElement as HTMLElement | null
    painel = proximo
    aberto.value = !!painel
    if (painel) {
      if (!painel.hasAttribute('tabindex')) painel.tabIndex = -1
      if (!painel.contains(document.activeElement)) (focaveis()[0] ?? painel).focus({ preventScroll: true })
    } else {
      const destino = anterior?.isConnected && !anterior.closest('[inert]') ? anterior : document.querySelector<HTMLElement>('main')
      queueMicrotask(() => destino?.focus({ preventScroll: true }))
      anterior = null
    }
  }
  const teclado = (evento: KeyboardEvent) => {
    if (!painel || evento.key !== 'Tab') return
    const elementos = focaveis()
    const primeiro = elementos[0], ultimo = elementos.at(-1)
    if (!primeiro) { evento.preventDefault(); painel.focus() }
    else if (evento.shiftKey && (document.activeElement === primeiro || document.activeElement === painel)) { evento.preventDefault(); ultimo?.focus() }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus() }
  }
  const foco = (evento: FocusEvent) => {
    if (painel && evento.target instanceof Node && !painel.contains(evento.target)) (focaveis()[0] ?? painel).focus({ preventScroll: true })
  }
  onMounted(() => {
    observer = new MutationObserver(atualizar)
    observer.observe(document.querySelector('#app') ?? document.body, { childList: true, subtree: true })
    document.addEventListener('keydown', teclado)
    document.addEventListener('focusin', foco)
    atualizar()
  })
  onBeforeUnmount(() => { observer?.disconnect(); document.removeEventListener('keydown', teclado); document.removeEventListener('focusin', foco) })
  return aberto
}
