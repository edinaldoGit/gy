import type { ExercicioCatalogo, HistoricoTreino, SerieRealizada } from '../database/db.ts'
import { identidadeHistorica } from './identidadeExercicio.ts'

export interface ExecucaoAnterior { exercicioCanonicoId: string; sessaoId?: number; fichaNome: string; treinoNome: string; data: Date; ordem: number; series: SerieRealizada[] }
export function execucoesDoExercicio(sessoes: HistoricoTreino[], catalogo: ExercicioCatalogo[], identidade: string, agora = new Date()): ExecucaoAnterior[] {
  return sessoes.flatMap(sessao => {
    const fim = sessao.dataFim ? new Date(sessao.dataFim) : null
    if (sessao.estado !== 'finalizado' || !fim || !Number.isFinite(fim.getTime()) || fim > agora) return []
    return sessao.exerciciosRealizados.flatMap(exercicio => {
      if (identidadeHistorica(exercicio, catalogo) !== identidade) return []
      const series = exercicio.seriesRealizadas.filter(s => s.finalizada === true && Number.isFinite(s.peso) && s.peso >= 0 && String(s.reps).trim() !== '' && Number.isFinite(Number(s.reps)) && Number(s.reps) > 0)
      return series.length ? [{ exercicioCanonicoId: identidade, sessaoId: sessao.id, fichaNome: sessao.fichaNome, treinoNome: sessao.treinoNome, data: fim, ordem: exercicio.ordem, series: series.map(s => ({ ...s })) }] : []
    })
  }).sort((a, b) => b.data.getTime() - a.data.getTime() || (b.sessaoId ?? 0) - (a.sessaoId ?? 0) || b.ordem - a.ordem)
}
