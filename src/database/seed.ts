import { db } from './db'
import { comGravacaoGy } from './writeLock'
import { exerciciosSeed } from '../data/catalogoOficial'
import { identidadeDoCatalogo } from '../utils/identidadeExercicio'

export async function popularCatalogoSeVazio() {
  try {
    await comGravacaoGy(() => db.transaction('rw', db.catalogo, async () => {
      if (await db.catalogo.count() === 0) {
        await db.catalogo.bulkAdd(exerciciosSeed.map(({ id, ...registro }) => registro))
      } else {
        const catalogo = await db.catalogo.toArray()
        for (const exercicio of catalogo) {
          if (!exercicio.exercicioCanonicoId) await db.catalogo.update(exercicio.id!, { exercicioCanonicoId: identidadeDoCatalogo(exercicio) })
        }
      }
    }))
  } catch (error) { console.error('Não foi possível preparar o catálogo:', error) }
}
