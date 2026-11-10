import type { HistoricoTreino, ProgramacaoVigente } from '../database/db.ts'
import { compromissoNoDia } from './programacaoEfetiva.ts'
import { dataCivil, diaLocal, proximoDia } from './diasLocais.ts'

type Programacao = Pick<ProgramacaoVigente, 'efetivaEm' | 'diaLocalVigencia' | 'treinos' | 'agenda' | 'motivo'> & { id?: number }
type Sessao = Pick<HistoricoTreino, 'estado' | 'dataFim' | 'diaConclusaoLocal' | 'treinoId'> & { id?: number }
export interface Sequencia {
  quantidade: number
  desbloqueada: boolean
  ultimoDiaConcluido: string | null
  diasProgramados: string[]
  diasConcluidos: string[]
  diasPerdidos: string[]
  diaAvaliado: string
}

export const NIVEIS_FOGUINHO = [
  { id: 'polar', nome: 'Chama Polar', cor: '#54BDF2', requisito: 'Início da sequência' },
  { id: 'faisca', nome: 'Faísca', cor: '#F89337', requisito: '2 treinos programados consecutivos' },
  { id: 'brasa', nome: 'Brasa Viva', cor: '#E5A523', requisito: '1 semana completa' },
  { id: 'labareda', nome: 'Labareda', cor: '#F35F52', requisito: '2 semanas completas consecutivas' },
  { id: 'fogareu', nome: 'Fogaréu', cor: '#D94C9D', requisito: '3 semanas completas consecutivas' },
  { id: 'prime', nome: 'Gy Prime', cor: 'linear-gradient(135deg, #7946FF, #B456FF, #EFA5FF)', requisito: '4 semanas completas consecutivas' }
] as const

export interface DiaFoguinho {
  dia: string
  nome: string
  treinoNome: string | null
  estado: 'descanso' | 'concluido' | 'pendente' | 'falta'
}

export interface ProgressoFoguinho {
  nivel: number
  semanasConsecutivas: number
  treinosConsecutivos: number
  concluidosNoCiclo: number
  obrigacoesNoCiclo: number
  cicloEncerraEm: string
  dias: DiaFoguinho[]
  diasPerdidos: string[]
}
const instante = (valor: unknown): Date | null => {
  if (!(valor instanceof Date) && typeof valor !== 'string' && typeof valor !== 'number') return null
  const data = new Date(valor)
  return Number.isFinite(data.getTime()) ? data : null
}
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
    let obrigatorio = !!compromissoNoDia(vigente, dia)
    while (indice < vigencias.length && vigencias[indice]!.dia === dia) {
      vigente = vigencias[indice++]!.programacao
      // Remover ou trocar a ficha não apaga um compromisso assumido no próprio dia.
      obrigatorio ||= !!compromissoNoDia(vigente, dia)
    }
    if (!obrigatorio) continue
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

const nomeDia = (dia: string) => ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][dataCivil(dia)!.getUTCDay()]!
const segundaDaSemana = (dia: string) => {
  const data = dataCivil(dia)!
  data.setUTCDate(data.getUTCDate() - (data.getUTCDay() + 6) % 7)
  return data.toISOString().slice(0, 10)
}
const domingoDaSemana = (segunda: string) => {
  let dia = segunda
  for (let i = 0; i < 6; i++) dia = proximoDia(dia)
  return dia
}
const compromissosDoDia = (programacao: Programacao | undefined, dia: string) => {
  if (!programacao) return []
  const agenda = programacao.agenda
  if (agenda && dia >= agenda.inicio && dia <= agenda.fim) {
    return agenda.itens.filter(item => item.dia === dia).map(item => ({ treinoId: item.treinoId, treinoNome: item.treinoNome }))
  }
  const numeroDia = dataCivil(dia)!.getUTCDay()
  return programacao.treinos.filter(treino => treino.diasDaSemana.includes(numeroDia)).map(treino => ({ treinoId: treino.treinoId, treinoNome: treino.treinoNome }))
}

export const calcularFoguinho = (programacoes: Programacao[], sessoes: Sessao[], agora: Date): ProgressoFoguinho => {
  const hoje = diaLocal(agora)
  const vigencias = programacoes.flatMap(programacao => {
    const data = instante(programacao.efetivaEm)
    const dia = programacao.diaLocalVigencia ?? (data ? diaLocal(data) : '')
    return data && data <= agora && dataCivil(dia) ? [{ programacao, data, dia }] : []
  }).sort((a, b) => a.dia.localeCompare(b.dia) || a.data.getTime() - b.data.getTime() || (a.programacao.id ?? 0) - (b.programacao.id ?? 0))
  const concluidos = new Map<string, Set<number>>()
  const sessoesValidas = sessoes.flatMap(sessao => {
    const fim = instante(sessao.dataFim)
    const dia = sessao.diaConclusaoLocal ?? (fim ? diaLocal(fim) : '')
    return sessao.estado === 'finalizado' && fim && fim <= agora && dataCivil(dia) ? [{ dia, treinoId: sessao.treinoId }] : []
  })
  for (const sessao of sessoesValidas) {
    const set = concluidos.get(sessao.dia) ?? new Set<number>()
    if (sessao.treinoId != null) set.add(sessao.treinoId)
    concluidos.set(sessao.dia, set)
  }

  const inicial = vigencias[0]?.dia ?? hoje
  const segundaInicial = segundaDaSemana(inicial)
  const primeiraSemanaCompleta = inicial === segundaInicial ? segundaInicial : proximoDia(domingoDaSemana(segundaInicial))
  const segundaAtual = segundaDaSemana(hoje)
  const cronograma = new Map<string, Array<{ treinoId: number; treinoNome: string }>>()
  let indice = 0
  let vigente: Programacao | undefined
  if (vigencias.length) {
    const fimCronograma = domingoDaSemana(segundaDaSemana(hoje))
    for (let dia = inicial; dia <= fimCronograma; dia = proximoDia(dia)) {
      let itensDoDia = compromissosDoDia(vigente, dia)
      while (indice < vigencias.length && vigencias[indice]!.dia === dia) {
        vigente = vigencias[indice++]!.programacao
        const novosCompromissos = compromissosDoDia(vigente, dia)
        itensDoDia = vigente.motivo === 'deslocamento' ? novosCompromissos : [...itensDoDia, ...novosCompromissos]
      }
      const unicos = new Map(itensDoDia.map(item => [item.treinoId, item]))
      if (unicos.size) cronograma.set(dia, [...unicos.values()])
    }
  }

  const perdidos: string[] = []
  let semanasConsecutivas = 0
  let treinosConsecutivos = 0
  for (let dia = inicial; dia < hoje; dia = proximoDia(dia)) {
    const obrigacoes = cronograma.get(dia) ?? []
    if (!obrigacoes.length) continue
    const feitos = concluidos.get(dia) ?? new Set<number>()
    if (obrigacoes.some(item => feitos.has(item.treinoId))) treinosConsecutivos++
    else {
      perdidos.push(dia)
      treinosConsecutivos = 0
    }
  }
  const compromissosHoje = cronograma.get(hoje) ?? []
  if (compromissosHoje.length) {
    const feitos = concluidos.get(hoje) ?? new Set<number>()
    treinosConsecutivos = compromissosHoje.some(item => feitos.has(item.treinoId)) ? treinosConsecutivos + 1 : treinosConsecutivos
  }

  for (let segunda = segundaDaSemana(inicial); segunda < segundaAtual; segunda = proximoDia(domingoDaSemana(segunda))) {
    const domingo = domingoDaSemana(segunda)
    const diasSemana = Array.from({ length: 7 }, (_, offset) => {
      let dia = segunda
      for (let i = 0; i < offset; i++) dia = proximoDia(dia)
      return dia
    }).filter(dia => dia >= inicial)
    const obrigacoes = diasSemana.flatMap(dia => cronograma.get(dia) ?? [])
    if (!obrigacoes.length) continue
    const faltou = diasSemana.some(dia => {
      const itens = cronograma.get(dia) ?? []
      return itens.length > 0 && !itens.some(item => concluidos.get(dia)?.has(item.treinoId))
    })
    if (faltou) semanasConsecutivas = 0
    else if (segunda >= primeiraSemanaCompleta && domingo < hoje) semanasConsecutivas++
  }
  if (perdidos.length) {
    const ultimaFalta = perdidos.at(-1)!
    const ultimaSemana = segundaDaSemana(ultimaFalta)
    if (ultimaSemana === segundaAtual) semanasConsecutivas = 0
  }

  const dias: DiaFoguinho[] = []
  let concluidosNoCiclo = 0
  let obrigacoesNoCiclo = 0
  for (let offset = 0; offset < 7; offset++) {
    let dia = segundaAtual
    for (let i = 0; i < offset; i++) dia = proximoDia(dia)
    const itens = cronograma.get(dia) ?? []
    const feitos = concluidos.get(dia) ?? new Set<number>()
    const concluiu = itens.length > 0 && itens.some(item => feitos.has(item.treinoId))
    const falta = itens.length > 0 && dia < hoje && !concluiu
    if (itens.length) {
      obrigacoesNoCiclo++
      if (concluiu) concluidosNoCiclo++
    }
    dias.push({ dia, nome: nomeDia(dia), treinoNome: itens.map(item => item.treinoNome).join(' / ') || null, estado: !itens.length ? 'descanso' : concluiu ? 'concluido' : falta ? 'falta' : 'pendente' })
  }

  const nivel = semanasConsecutivas >= 4 ? 5 : semanasConsecutivas === 3 ? 4 : semanasConsecutivas === 2 ? 3 : semanasConsecutivas === 1 ? 2 : treinosConsecutivos >= 2 ? 1 : 0
  return { nivel, semanasConsecutivas, treinosConsecutivos, concluidosNoCiclo, obrigacoesNoCiclo, cicloEncerraEm: domingoDaSemana(segundaAtual), dias, diasPerdidos: perdidos }
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
