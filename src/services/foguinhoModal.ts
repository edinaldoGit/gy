import { ref } from 'vue'

const aberto = ref(false)
let acionador: HTMLElement | null = null

const abrir = () => {
  if (!aberto.value && typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) acionador = document.activeElement
  aberto.value = true
}

const fechar = () => {
  aberto.value = false
  requestAnimationFrame(() => {
    if (acionador?.isConnected) acionador.focus({ preventScroll: true })
    acionador = null
  })
}

export const foguinhoModal = {
  aberto,
  abrir,
  fechar
}
