import { shallowRef } from 'vue'

export const gravacoesBackupBloqueadas = shallowRef(false)
const chaveGeracaoGy = 'gy:geracao-dados'
const mensagemGeracaoInvalida = 'Os dados desta aba foram excluídos. Reabra o Gy para começar um novo cadastro.'
const lerGeracao = () => {
  try { return localStorage.getItem(chaveGeracaoGy) ?? '0' } catch { return '0' }
}
let geracaoDaAba = lerGeracao()

export function invalidarGeracaoDadosGy() {
  const proxima = `${Date.now()}:${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
  try { localStorage.setItem(chaveGeracaoGy, proxima) } catch { }
  geracaoDaAba = proxima
  return proxima
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', evento => {
    if (evento.key !== chaveGeracaoGy || evento.newValue === geracaoDaAba) return
    gravacoesBackupBloqueadas.value = true
    window.dispatchEvent(new CustomEvent('gy:dados-invalidados'))
  })
}

export async function comGravacaoGy<T>(gravar: () => Promise<T>): Promise<T> {
  const geracaoEsperada = geracaoDaAba
  const executar = () => {
    if (gravacoesBackupBloqueadas.value) throw new Error('Os dados estão sendo restaurados. Aguarde a atualização do Gy.')
    if (geracaoEsperada !== lerGeracao()) {
      gravacoesBackupBloqueadas.value = true
      throw new Error(mensagemGeracaoInvalida)
    }
    return gravar()
  }
  if (gravacoesBackupBloqueadas.value) throw new Error('Os dados estão sendo restaurados. Aguarde a atualização do Gy.')
  if (typeof navigator !== 'undefined' && navigator.locks?.request) return navigator.locks.request('gy-dados-gravacao', { mode: 'shared' }, executar)
  return executar()
}

export async function obterBloqueioExclusivoGy() {
  if (typeof navigator === 'undefined' || !navigator.locks?.request) return () => {}
  let concedido!: () => void
  let rejeitar!: (erro: Error) => void
  let liberar!: () => void
  const pronto = new Promise<void>((resolve, reject) => { concedido = resolve; rejeitar = erro => reject(erro instanceof Error ? erro : new Error('Não foi possível bloquear as gravações do Gy.')) })
  const esperaLiberacao = new Promise<void>(resolve => { liberar = resolve })
  void navigator.locks.request('gy-dados-gravacao', { mode: 'exclusive' }, async () => {
    concedido()
    await esperaLiberacao
  }).catch(rejeitar)
  await pronto
  return liberar
}
