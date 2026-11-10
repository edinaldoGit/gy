import { db } from '@/database/db'
import { invalidarGeracaoDadosGy } from '@/database/writeLock'
import { exerciciosSeed } from '@/data/catalogoOficial'
import { limparArmazenamentoTemporarioGy } from '@/utils/armazenamentoGy'

export async function excluirDadosDaConta() {
  await db.transaction('rw', [db.perfil, db.catalogo, db.fichas, db.treinos, db.configuracoes, db.programacoes, db.historico, db.medidasCorporais], async () => {
    await Promise.all([
      db.perfil.clear(), db.fichas.clear(), db.treinos.clear(), db.configuracoes.clear(),
      db.programacoes.clear(), db.historico.clear(), db.medidasCorporais.clear(), db.catalogo.clear()
    ])
    await db.catalogo.bulkAdd(exerciciosSeed.map(({ id: _id, ...exercicio }) => exercicio))
  })
  limparArmazenamentoTemporarioGy()
  invalidarGeracaoDadosGy()
}
