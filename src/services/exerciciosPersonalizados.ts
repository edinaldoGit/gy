import { db, type ExercicioCatalogo } from '@/database/db'
import { comGravacaoGy } from '@/database/writeLock'
import { identidadeOficial } from '@/utils/identidadeExercicio'

export const exercicioPersonalizado = (e: ExercicioCatalogo) => e.exercicioCanonicoId ? !e.exercicioCanonicoId.startsWith('gy:oficial:') : !identidadeOficial(e)
export function validarExercicioPersonalizado(e: Pick<ExercicioCatalogo, 'nome' | 'grupoMuscular' | 'equipamento' | 'videoUrl' | 'defaultSeries' | 'defaultReps'>) {
  if (!e.nome.trim() || e.nome.length > 300 || !e.grupoMuscular.trim() || e.grupoMuscular.length > 100 || e.equipamento.length > 200 || !Number.isInteger(e.defaultSeries) || e.defaultSeries < 1 || e.defaultSeries > 100 || !e.defaultReps.trim() || e.defaultReps.length > 100) throw new Error('Confira nome, grupo muscular, equipamento, séries e repetições.')
  if (e.videoUrl) {
    try { if (!['https:', 'http:'].includes(new URL(e.videoUrl).protocol)) throw new Error() }
    catch { throw new Error('Informe um endereço de vídeo válido iniciado por https:// ou http://.') }
  }
}
export async function atualizarExercicioPersonalizado(id: number, dados: Pick<ExercicioCatalogo, 'nome' | 'grupoMuscular' | 'equipamento' | 'videoUrl' | 'defaultSeries' | 'defaultReps'>) {
  validarExercicioPersonalizado(dados)
  await comGravacaoGy(() => db.transaction('rw', db.catalogo, async () => {
    const atual = await db.catalogo.get(id)
    if (!atual || !exercicioPersonalizado(atual)) throw new Error('Somente exercícios personalizados podem ser editados.')
    await db.catalogo.put({ ...atual, nome: dados.nome.trim(), grupoMuscular: dados.grupoMuscular.trim(), equipamento: dados.equipamento.trim(), videoUrl: dados.videoUrl.trim(), defaultSeries: dados.defaultSeries, defaultReps: dados.defaultReps.trim(), exercicioCanonicoId: atual.exercicioCanonicoId ?? `gy:legado-local:${id}` })
  }))
}
export async function arquivarExercicioPersonalizado(id: number) {
  await comGravacaoGy(() => db.transaction('rw', db.catalogo, async () => {
    const atual = await db.catalogo.get(id)
    if (!atual || !exercicioPersonalizado(atual)) throw new Error('Somente exercícios personalizados podem ser arquivados.')
    await db.catalogo.update(id, { arquivado: true })
  }))
}
