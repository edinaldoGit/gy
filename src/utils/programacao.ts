import type { Ficha, ProgramacaoVigente, Treino } from '@/database/db'
import { contextoLocal, dataCivil } from './diasLocais.ts'

export const obterTreinoDoDia = <T extends Pick<Treino, 'diasDaSemana'>>(treinos: T[], dia: number): T | null =>
  treinos.find(treino => treino.diasDaSemana.includes(dia)) ?? null

export const conflitoDeDia = (treinos: Treino[], dias: number[], treinoIgnoradoId?: number): number | null => {
  for (const dia of dias) {
    if (treinos.some(treino => treino.id !== treinoIgnoradoId && treino.diasDaSemana.includes(dia))) return dia
  }
  return null
}

export const snapshotProgramacao = (
  ficha: Ficha | null,
  treinos: Treino[],
  motivo: ProgramacaoVigente['motivo'],
  efetivaEm = new Date(),
  ultimoDiaVigente?: string
): Omit<ProgramacaoVigente, 'id'> => {
  const contexto = contextoLocal(efetivaEm)
  // Viagens para um fuso anterior não podem inserir edições em dias históricos já encerrados.
  const inicio = ultimoDiaVigente && dataCivil(ultimoDiaVigente) && ultimoDiaVigente > contexto.dia ? ultimoDiaVigente : contexto.dia
  return {
    fichaId: ficha?.id ?? null,
    efetivaEm,
    diaLocalVigencia: inicio,
    fusoHorario: contexto.fuso,
    offsetMinutos: contexto.offsetMinutos,
    motivo,
    fichaNome: ficha?.nome ?? null,
    treinos: treinos.map(treino => ({ treinoId: treino.id!, treinoNome: treino.nome, diasDaSemana: [...treino.diasDaSemana] }))
  }
}
