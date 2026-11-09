import type { ExercicioCatalogo, ExercicioPlanejadoSnapshot, ExercicioRealizado } from '../database/db.ts'
import type { ExecucaoAnterior } from './historicoExercicio.ts'
import { identidadeDoCatalogo, identidadeHistorica } from './identidadeExercicio.ts'

export interface SerieExecucao {
  numero: number;
  pesoFito: number;
  repsFeitas: string;
  finalizada: boolean;
}

export interface ExercicioExecucao {
  idUnico: string;
  exercicioId: number;
  exercicioCanonicoId?: string;
  planejado?: ExercicioPlanejadoSnapshot;
  registrosEditados?: boolean;
  nome: string;
  grupoMuscular: string;
  videoUrl?: string;
  ordem: number;
  seriesTotais: number;
  repsAlvo: string;
  pesoBasePlanejado: number;
  taxaAumentoKg: number;
  temDescanso: boolean;
  descansoSegundos: number;
  concluido: boolean;
  seriesRealizadas: SerieExecucao[];
}

export const temRegistros = (exercicio: ExercicioExecucao) => exercicio.registrosEditados === true || exercicio.seriesRealizadas.some(s => s.finalizada)
export const snapshotPlanejado = (ex: ExercicioExecucao): ExercicioPlanejadoSnapshot => ex.planejado ?? ({ exercicioId: ex.exercicioId, exercicioCanonicoId: ex.exercicioCanonicoId, nome: ex.nome, grupoMuscular: ex.grupoMuscular, videoUrl: ex.videoUrl, pesoBasePlanejado: ex.pesoBasePlanejado, taxaAumentoKg: ex.taxaAumentoKg })
export function trocarExercicio(ex: ExercicioExecucao, destino?: ExercicioCatalogo): ExercicioExecucao {
  if (temRegistros(ex)) throw new Error('Este exercício já tem cargas, repetições editadas ou séries registradas. A substituição está bloqueada para preservar seus dados.')
  const planejado = { ...snapshotPlanejado(ex) }
  const original = !destino || destino.id === planejado.exercicioId
  const atual = original ? planejado : { exercicioId: destino.id!, exercicioCanonicoId: identidadeDoCatalogo(destino), nome: destino.nome, grupoMuscular: destino.grupoMuscular, videoUrl: destino.videoUrl }
  const base = original ? planejado.pesoBasePlanejado ?? 0 : 0
  const taxa = original ? planejado.taxaAumentoKg ?? 0 : 0
  return { ...ex, ...atual, planejado, pesoBasePlanejado: base, taxaAumentoKg: taxa, concluido: false, registrosEditados: false,
    seriesRealizadas: Array.from({ length: ex.seriesTotais }, (_, index) => ({ numero: index + 1, pesoFito: base + index * taxa, repsFeitas: ex.repsAlvo.split('-')[0] ?? '', finalizada: false })) }
}
export function usarReferencia(ex: ExercicioExecucao, anterior: ExecucaoAnterior): ExercicioExecucao {
  if (anterior.exercicioCanonicoId !== ex.exercicioCanonicoId) throw new Error('A referência pertence a outro exercício.')
  if (temRegistros(ex)) throw new Error('As alterações desta sessão foram preservadas. Use os valores anteriores apenas como consulta.')
  return { ...ex, registrosEditados: true, seriesRealizadas: ex.seriesRealizadas.map(serie => {
    const referencia = anterior.series.find(s => s.numeroDaSerie === serie.numero)
    return referencia ? { ...serie, pesoFito: referencia.peso, repsFeitas: String(referencia.reps), finalizada: false } : { ...serie }
  }) }
}

export function serializarExercicio(ex: ExercicioExecucao, index: number): ExercicioRealizado {
  return {
    exercicioId: ex.exercicioId, exercicioCanonicoId: ex.exercicioCanonicoId, planejado: { ...snapshotPlanejado(ex) }, registrosEditados: ex.registrosEditados ?? false,
    nome: ex.nome, grupoMuscular: ex.grupoMuscular, videoUrl: ex.videoUrl, ordem: ex.ordem ?? index + 1,
    seriesPlanejadas: ex.seriesTotais, repsAlvo: ex.repsAlvo, pesoBasePlanejado: ex.pesoBasePlanejado, taxaAumentoKg: ex.taxaAumentoKg,
    temDescanso: ex.temDescanso, descansoSegundos: ex.descansoSegundos,
    seriesRealizadas: ex.seriesRealizadas.map(s => ({ numeroDaSerie: s.numero, peso: Number(s.pesoFito) || 0, reps: s.repsFeitas, finalizada: s.finalizada }))
  }
}
export function recuperarExercicio(ex: ExercicioRealizado, catalogo: ExercicioCatalogo[], index: number): ExercicioExecucao {
  const cat = catalogo.find(c => c.id === ex.exercicioId)
  const series = ex.seriesRealizadas.map(s => ({ numero: s.numeroDaSerie, pesoFito: Number(s.peso) || 0, repsFeitas: String(s.reps), finalizada: s.finalizada === true }))
  return {
    idUnico: `ex_${index}`, exercicioId: ex.exercicioId, exercicioCanonicoId: identidadeHistorica(ex, catalogo),
    planejado: ex.planejado ? { ...ex.planejado } : undefined, registrosEditados: ex.registrosEditados ?? true,
    nome: ex.nome || cat?.nome || 'Exercício desconhecido', grupoMuscular: ex.grupoMuscular || cat?.grupoMuscular || 'Geral', videoUrl: ex.videoUrl ?? cat?.videoUrl,
    ordem: ex.ordem ?? index + 1, seriesTotais: ex.seriesPlanejadas ?? series.length, repsAlvo: ex.repsAlvo || '', pesoBasePlanejado: ex.pesoBasePlanejado ?? 0,
    taxaAumentoKg: ex.taxaAumentoKg ?? 0, temDescanso: ex.temDescanso !== false, descansoSegundos: ex.descansoSegundos ?? 60,
    concluido: series.length > 0 && series.every(s => s.finalizada), seriesRealizadas: series
  }
}
