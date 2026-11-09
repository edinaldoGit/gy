import { db, type ExercicioCatalogo } from '@/database/db'
import { execucoesDoExercicio } from '@/utils/historicoExercicio'

export async function carregarUltimasExecucoes(identidades: string[], catalogo: ExercicioCatalogo[]) {
  const sessoes = await db.historico.where('estado').equals('finalizado').toArray()
  return new Map(identidades.map(id => [id, execucoesDoExercicio(sessoes, catalogo, id)[0] ?? null]))
}
