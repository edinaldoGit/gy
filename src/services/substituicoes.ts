import type { ExercicioCatalogo } from '../database/db.ts'
import { auditoriaExercicios } from '../data/exerciseSubstitutions.ts'
import { identidadeOficial } from '../utils/identidadeExercicio.ts'

const curadoria = new Map(auditoriaExercicios.map(e => [e.exercicioCanonicoId, e.alternativas]))
export function consultarSubstitutos(exercicio: ExercicioCatalogo, catalogo: ExercicioCatalogo[]) {
  const identidade = exercicio.exercicioCanonicoId ?? identidadeOficial(exercicio)
  if (!identidade) return []
  return (curadoria.get(identidade) ?? []).flatMap(alternativa => {
    const destino = catalogo.find(e => (e.exercicioCanonicoId ?? identidadeOficial(e)) === alternativa.exercicioCanonicoId)
    return destino && destino.id !== exercicio.id ? [{ ...alternativa, exercicio: destino }] : []
  }).sort((a, b) => a.prioridade - b.prioridade || a.exercicioCanonicoId.localeCompare(b.exercicioCanonicoId))
}
