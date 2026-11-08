import type { HistoricoTreino, SerieRealizada } from '@/database/db'

const dataValida = (valor: unknown): Date | null => {
  if (!(valor instanceof Date) && typeof valor !== 'string' && typeof valor !== 'number') return null
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data
}

export const dataConclusao = (sessao: HistoricoTreino): Date | null =>
  dataValida(sessao.dataFim) || dataValida(sessao.dataInicio)

export const sessaoConcluida = (sessao: HistoricoTreino): boolean => {
  if (sessao.estado === 'finalizado') return true
  // Antes do campo estado, cada linha gravada no histórico representava um treino concluído.
  return sessao.estado == null && dataValida(sessao.dataFim) !== null
}

export const ordenarHistorico = (sessoes: HistoricoTreino[]): HistoricoTreino[] =>
  sessoes
    .filter(sessaoConcluida)
    .sort((a, b) => (dataConclusao(b)?.getTime() ?? 0) - (dataConclusao(a)?.getTime() ?? 0))

export const contarSeriesConcluidas = (sessoes: SerieRealizada[] | undefined): number =>
  Array.isArray(sessoes) ? sessoes.filter(serie => serie && typeof serie === 'object' && serie.finalizada === true).length : 0

export const contarExercicios = (sessao: HistoricoTreino): number =>
  Array.isArray(sessao.exerciciosRealizados)
    ? sessao.exerciciosRealizados.filter(exercicio => exercicio && typeof exercicio === 'object').length
    : 0

export const contarSeriesDaSessao = (sessao: HistoricoTreino): number =>
  Array.isArray(sessao.exerciciosRealizados)
    ? sessao.exerciciosRealizados.reduce((total, exercicio) => total + (exercicio && typeof exercicio === 'object' ? contarSeriesConcluidas(exercicio.seriesRealizadas) : 0), 0)
    : 0

export const obterDuracaoMinutos = (sessao: HistoricoTreino): number | null => {
  const duracaoBruta: unknown = sessao.duracaoMinutos
  if (duracaoBruta == null || (typeof duracaoBruta === 'string' && duracaoBruta.trim() === '')) return null
  const duracao = Number(duracaoBruta)
  if (Number.isFinite(duracao) && duracao >= 0) return duracao

  const inicio = dataValida(sessao.dataInicio)
  const fim = dataValida(sessao.dataFim)
  if (!inicio || !fim) return null
  const calculada = (fim.getTime() - inicio.getTime()) / 60000
  return Number.isFinite(calculada) && calculada >= 0 ? calculada : null
}

export interface ResumoHistorico {
  totalTreinos: number
  treinosUltimosSeteDias: number
  tempoTotalMinutos: number | null
}

export const calcularResumoHistorico = (sessoes: HistoricoTreino[], agora = new Date()): ResumoHistorico => {
  const concluidas = sessoes.filter(sessaoConcluida)
  const inicioDoPeriodo = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  inicioDoPeriodo.setDate(inicioDoPeriodo.getDate() - 6)
  const tempoTotal = concluidas.reduce<{ total: number; calculaveis: number }>((acc, sessao) => {
    const minutos = obterDuracaoMinutos(sessao)
    if (minutos !== null) {
      acc.total += minutos
      acc.calculaveis++
    }
    return acc
  }, { total: 0, calculaveis: 0 })

  return {
    totalTreinos: concluidas.length,
    treinosUltimosSeteDias: concluidas.filter(sessao => {
      const data = dataConclusao(sessao)
      return data !== null && data >= inicioDoPeriodo && data <= agora
    }).length,
    tempoTotalMinutos: tempoTotal.calculaveis > 0 ? tempoTotal.total : null
  }
}

export const formatarDuracao = (minutos: number | null | undefined): string => {
  if (minutos == null || !Number.isFinite(minutos) || minutos < 0) return 'Duração indisponível'
  const totalMinutos = Math.round(minutos)
  const horas = Math.floor(totalMinutos / 60)
  const resto = totalMinutos % 60
  if (horas === 0) return `${resto} min`
  if (resto === 0) return `${horas} h`
  return `${horas} h ${resto} min`
}

export const formatarTempoTotal = (minutos: number | null): string => {
  if (minutos === null) return '—'
  const totalMinutos = Math.round(minutos)
  const horas = Math.floor(totalMinutos / 60)
  const resto = totalMinutos % 60
  return horas > 0 ? `${horas}h ${resto}min` : `${resto} min`
}

export const formatarData = (valor: unknown, opcoes: Intl.DateTimeFormatOptions): string => {
  const data = dataValida(valor)
  return data ? new Intl.DateTimeFormat('pt-BR', opcoes).format(data) : 'Data indisponível'
}
