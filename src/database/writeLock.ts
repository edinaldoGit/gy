import { shallowRef } from 'vue'

export const gravacoesBackupBloqueadas = shallowRef(false)

export async function comGravacaoGy<T>(gravar: () => Promise<T>): Promise<T> {
  if (gravacoesBackupBloqueadas.value) throw new Error('Os dados estão sendo restaurados. Aguarde a atualização do Gy.')
  const executar = () => {
    if (gravacoesBackupBloqueadas.value) throw new Error('Os dados estão sendo restaurados. Aguarde a atualização do Gy.')
    return gravar()
  }
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
