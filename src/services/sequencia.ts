import { liveQuery } from 'dexie'
import { shallowRef } from 'vue'
import { db } from '@/database/db'
import { snapshotProgramacao } from '@/utils/programacao'
import { calcularFoguinho, calcularSequencia, EstadoSequencia, feedbackDaSequencia } from '@/utils/sequencia'
import { comGravacaoGy } from '@/database/writeLock'

const dominio = new EstadoSequencia()
let programacoesAtuais: Awaited<ReturnType<typeof ler>>['programacoes'] = []
let sessoesAtuais: Awaited<ReturnType<typeof ler>>['sessoes'] = []
const combinarEstado = () => ({ ...dominio.recalcular(), ...calcularFoguinho(programacoesAtuais, sessoesAtuais, new Date()) })
const estado = shallowRef(combinarEstado())
const erro = shallowRef(false)
const ler = () => db.transaction('r', db.programacoes, db.historico, async () => {
  const [programacoes, sessoes] = await Promise.all([
    db.programacoes.toArray(), db.historico.where('estado').equals('finalizado').toArray()
  ])
  return { programacoes, sessoes }
})
const aplicar = (dados: Awaited<ReturnType<typeof ler>>) => {
  programacoesAtuais = dados.programacoes
  sessoesAtuais = dados.sessoes
  dominio.atualizar(programacoesAtuais, sessoesAtuais)
  estado.value = combinarEstado()
  erro.value = false
}
const recarregar = async () => {
  try { aplicar(await ler()) } catch { erro.value = true }
}
const registrarInicio = async () => {
  await comGravacaoGy(() => db.transaction('rw', db.programacoes, db.configuracoes, db.fichas, db.treinos, async () => {
    if (await db.programacoes.count()) return
    const config = await db.configuracoes.get('principal')
    if (config?.fichaAtivaId == null) return
    const ficha = await db.fichas.get(config.fichaAtivaId)
    if (!ficha) return
    const treinos = await db.treinos.where('fichaId').equals(ficha.id!).toArray()
    await db.programacoes.add(snapshotProgramacao(ficha, treinos, 'ativacao'))
  }))
}
let parar: (() => void) | undefined
const iniciar = () => {
  if (parar) return parar
  let encerrado = false
  let timeout: ReturnType<typeof setTimeout> | undefined
  const atualizarTempo = () => {
    estado.value = combinarEstado()
    clearTimeout(timeout)
    const agora = new Date()
    const meiaNoite = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1)
    timeout = setTimeout(atualizarTempo, Math.min(60_000, Math.max(1, meiaNoite.getTime() - agora.getTime() + 50)))
  }
  const retomar = () => { if (!document.hidden) { atualizarTempo(); void recarregar() } }
  const subscription = liveQuery(ler).subscribe({ next: aplicar, error: () => { erro.value = true } })
  void registrarInicio().catch(() => { if (!encerrado) erro.value = true })
  document.addEventListener('visibilitychange', retomar)
  window.addEventListener('focus', retomar)
  window.addEventListener('pageshow', retomar)
  atualizarTempo()
  parar = () => {
    encerrado = true
    subscription.unsubscribe()
    clearTimeout(timeout)
    document.removeEventListener('visibilitychange', retomar)
    window.removeEventListener('focus', retomar)
    window.removeEventListener('pageshow', retomar)
    parar = undefined
  }
  return parar
}
const aposConclusao = async (id: number) => {
  try {
    const dados = await ler()
    const anterior = calcularSequencia(dados.programacoes, dados.sessoes.filter(sessao => sessao.id !== id), new Date())
    aplicar(dados)
    return feedbackDaSequencia(anterior, estado.value)
  } catch { erro.value = true; return null }
}

export const sequencia = { estado, erro, iniciar, recarregar, aposConclusao }
