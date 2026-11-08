import type { HistoricoTreino, ProgramacaoVigente } from '../database/db.ts'
import { dataCivil, diaLocal, proximoDia } from './diasLocais.ts'

type Programacao = Pick<ProgramacaoVigente, 'efetivaEm' | 'diaLocalVigencia' | 'treinos'> & { id?: number }
type Sessao = Pick<HistoricoTreino, 'estado' | 'dataFim' | 'diaConclusaoLocal'> & { id?: number }
export interface Sequencia {
  quantidade: number
  desbloqueada: boolean
  ultimoDiaConcluido: string | null
  diasProgramados: string[]
  diasConcluidos: string[]
  diasPerdidos: string[]
  diaAvaliado: string
}
const instante = (valor: unknown): Date | null => {
  if (!(valor instanceof Date) && typeof valor !== 'string' && typeof valor !== 'number') return null
  const data = new Date(valor)
  return Number.isFinite(data.getTime()) ? data : null
}
const diasSemanais = (programacao: Programacao | undefined) =>
  new Set(programacao?.treinos.flatMap(treino => treino.diasDaSemana).filter(dia => Number.isInteger(dia) && dia >= 0 && dia <= 6) ?? [])

export const calcularSequencia = (programacoes: Programacao[], sessoes: Sessao[], agora: Date): Sequencia => {
  const hoje = diaLocal(agora)
  const resultado: Sequencia = { quantidade: 0, desbloqueada: false, ultimoDiaConcluido: null, diasProgramados: [], diasConcluidos: [], diasPerdidos: [], diaAvaliado: hoje }
  const vigencias = programacoes.flatMap(programacao => {
    const data = instante(programacao.efetivaEm)
    if (!data || data > agora) return []
    const dia = programacao.diaLocalVigencia ?? diaLocal(data)
    return dataCivil(dia) ? [{ programacao, data, dia }] : []
  }).sort((a, b) => a.dia.localeCompare(b.dia) || a.data.getTime() - b.data.getTime() || (a.programacao.id ?? 0) - (b.programacao.id ?? 0))
  if (!vigencias.length) return resultado
  const conclusoes = new Set(sessoes.flatMap(sessao => {
    const fim = instante(sessao.dataFim)
    if (sessao.estado !== 'finalizado' || !fim || fim > agora) return []
    const dia = sessao.diaConclusaoLocal ?? diaLocal(fim)
    return dataCivil(dia) ? [dia] : []
  }))
  // Uma mudança de fuso pode recuar a data de hoje, mas não torna registros anteriores futuros.
  const ultimoDia = [...vigencias.map(v => v.dia), ...conclusoes].reduce((ultimo, dia) => dia > ultimo ? dia : ultimo, hoje)
  let indice = 0
  let vigente: Programacao | undefined
  // Identificadores civis validados YYYY-MM-DD têm a mesma ordem do calendário.
  for (let dia = vigencias[0]!.dia; dia <= ultimoDia; dia = proximoDia(dia)) {
    const dias = diasSemanais(vigente)
    while (indice < vigencias.length && vigencias[indice]!.dia === dia) {
      vigente = vigencias[indice++]!.programacao
      // Remover ou trocar a ficha não apaga um compromisso assumido no próprio dia.
      for (const semana of diasSemanais(vigente)) dias.add(semana)
    }
    if (!dias.has(dataCivil(dia)!.getUTCDay())) continue
    resultado.diasProgramados.push(dia)
    if (conclusoes.has(dia)) {
      resultado.quantidade++
      resultado.ultimoDiaConcluido = dia
      resultado.diasConcluidos.push(dia)
    } else if (dia < hoje) {
      resultado.quantidade = 0
      resultado.diasPerdidos.push(dia)
    }
  }
  resultado.desbloqueada = resultado.quantidade >= 2
  return resultado
}

export const feedbackDaSequencia = (anterior: Sequencia, atual: Sequencia): string | null => {
  if (atual.quantidade === anterior.quantidade) return null
  if (atual.quantidade === 1) return 'Primeiro treino da sequência! Falta mais um para acender o foguinho.'
  if (atual.quantidade === 2 && !anterior.desbloqueada) return 'Seu foguinho acendeu! Sequência de 2 treinos.'
  return null
}

export class EstadoSequencia {
  private programacoes: Programacao[] = []
  private sessoes: Sessao[] = []
  constructor(agora: () => Date = () => new Date()) { this.agora = agora }
  private agora: () => Date
  atualizar(programacoes: Programacao[], sessoes: Sessao[]) {
    this.programacoes = programacoes
    this.sessoes = sessoes
    return this.recalcular()
  }
  recalcular() { return calcularSequencia(this.programacoes, this.sessoes, this.agora()) }
}
