import { db } from '../src/database/db'
import { exerciciosSeed } from '../src/data/catalogoOficial'
import { excluirDadosDaConta } from '../src/services/exclusaoConta'
import { comGravacaoGy } from '../src/database/writeLock'

const button = document.querySelector<HTMLButtonElement>('#executar')!
const result = document.querySelector<HTMLElement>('#resultado')!
const allowed = location.hostname === '127.0.0.1' && location.port === '5196'
button.disabled = !allowed
if (!allowed) result.textContent = 'Bloqueado: rode somente em http://127.0.0.1:5196.'

button.addEventListener('click', async () => {
  if (!allowed) return
  button.disabled = true
  const lines: string[] = []
  try {
    await db.open()
    await db.transaction('rw', [db.perfil, db.catalogo, db.fichas, db.treinos, db.configuracoes, db.programacoes, db.historico, db.medidasCorporais], async () => {
      await Promise.all([db.perfil.clear(), db.catalogo.clear(), db.fichas.clear(), db.treinos.clear(), db.configuracoes.clear(), db.programacoes.clear(), db.historico.clear(), db.medidasCorporais.clear()])
      await db.perfil.add({ nome: 'Perfil fictício A', idade: 30, peso: 80, altura: 180, fotoPerfil: 'data:image/png;base64,fixture', criadoEm: new Date() })
      await db.catalogo.bulkAdd([
        ...exerciciosSeed.map(({ id: _id, ...ex }) => ex),
        { exercicioCanonicoId: 'gy:personalizado:fixture-0001', nome: 'Exercício fictício', grupoMuscular: 'Peito', equipamento: 'Halter', videoUrl: '', defaultSeries: 3, defaultReps: '10' }
      ])
      const fichaId = await db.fichas.add({ nome: 'Ficha A', foco: 'Geral', corTema: 'sage', origem: 'local', criadoEm: new Date(), atualizadoEm: new Date() })
      const exercicioId = (await db.catalogo.toArray()).find(ex => ex.exercicioCanonicoId === 'gy:oficial:1')!.id!
      const treinoId = await db.treinos.add({ fichaId, nome: 'Treino A', foco: 'Peito', ordem: 1, diasDaSemana: [1], exercicios: [{ exercicioId, ordem: 1, series: 1, repsAlvo: '10', taxaAumentoKg: 0, descansoSegundos: 60, pesoBaseAtual: 20, substitutosIds: [] }], criadoEm: new Date(), atualizadoEm: new Date() })
      await db.configuracoes.add({ chave: 'principal', fichaAtivaId: fichaId })
      await db.programacoes.add({ fichaId, efetivaEm: new Date(), motivo: 'ativacao', fichaNome: 'Ficha A', treinos: [{ treinoId, treinoNome: 'Treino A', diasDaSemana: [1] }] })
      await db.historico.add({ fichaId, treinoId, fichaNome: 'Ficha A', treinoNome: 'Treino A', dataInicio: new Date(), dataFim: new Date(), estado: 'finalizado', duracaoMinutos: 10, exerciciosRealizados: [{ exercicioId, nome: 'Supino', grupoMuscular: 'Peito', ordem: 1, seriesPlanejadas: 1, repsAlvo: '10', pesoBasePlanejado: 20, taxaAumentoKg: 0, temDescanso: true, descansoSegundos: 60, seriesRealizadas: [{ numeroDaSerie: 1, peso: 20, reps: 10 }] }] })
      const sessaoBase = { fichaId, treinoId, fichaNome: 'Ficha A', treinoNome: 'Treino A', dataInicio: new Date(), duracaoMinutos: 10, exerciciosRealizados: [{ exercicioId, nome: 'Supino', grupoMuscular: 'Peito', ordem: 1, seriesPlanejadas: 1, repsAlvo: '10', pesoBasePlanejado: 20, taxaAumentoKg: 0, temDescanso: true, descansoSegundos: 60, seriesRealizadas: [{ numeroDaSerie: 1, peso: 20, reps: 10 }] }] }
      await db.historico.bulkAdd([
        { ...sessaoBase, dataFim: new Date(), estado: 'finalizado' },
        { ...sessaoBase, dataFim: new Date(), estado: 'cancelado' },
        { ...sessaoBase, estado: 'em_andamento' }
      ])
      await db.medidasCorporais.add({ dataLocal: '2026-11-10', pesoKg: 80, cinturaCm: 90 })
    })
    sessionStorage.setItem('gy:sessao-pendente:v1', 'rascunho A')
    sessionStorage.setItem('outro-projeto:dado', 'preservar')
    const geracao = localStorage.getItem('gy:geracao-dados')

    let liberar!: () => void
    let bloqueado!: () => void
    const esperaBloqueio = new Promise<void>(resolve => { bloqueado = resolve })
    const esperaLiberacao = new Promise<void>(resolve => { liberar = resolve })
    const barreira = navigator.locks.request('gy-dados-gravacao', { mode: 'exclusive' }, async () => { bloqueado(); await esperaLiberacao })
    await esperaBloqueio
    const escritaAntiga = comGravacaoGy(() => db.fichas.add({ nome: 'Ficha fantasma', foco: 'Geral', corTema: 'sage', origem: 'local', criadoEm: new Date(), atualizadoEm: new Date() }))
    const exclusaoFalha = () => { throw new Error('falha fictícia de seed') }
    db.catalogo.hook('creating', exclusaoFalha)
    let falhouSemSucesso = false
    try { await excluirDadosDaConta() } catch { falhouSemSucesso = true }
    db.catalogo.hook('creating').unsubscribe(exclusaoFalha)
    if (!falhouSemSucesso || await db.perfil.count() !== 1 || await db.fichas.count() !== 1) throw new Error('A falha da transação não reverteu integralmente os dados.')
    lines.push('APROVADO · erro durante limpeza/reconstrução do catálogo reverte todas as tabelas.')
    await excluirDadosDaConta()
    liberar()
    await barreira
    await assertRejeitaEscritaAntiga(escritaAntiga)
    lines.push('APROVADO · autosave que aguardava exclusão não recria ficha depois dela.')
    const [perfis, fichas, treinos, configuracoes, programacoes, sessoes, medidas, catalogo] = await Promise.all([db.perfil.count(), db.fichas.count(), db.treinos.count(), db.configuracoes.count(), db.programacoes.count(), db.historico.count(), db.medidasCorporais.count(), db.catalogo.toArray()])
    if ([perfis, fichas, treinos, configuracoes, programacoes, sessoes, medidas].some(n => n !== 0)) throw new Error('Uma tabela pessoal reteve dados.')
    if (catalogo.length !== exerciciosSeed.length || catalogo.some(ex => !ex.exercicioCanonicoId?.startsWith('gy:oficial:'))) throw new Error('Catálogo padrão não foi reconstruído corretamente.')
    if (sessionStorage.getItem('gy:sessao-pendente:v1') !== null || sessionStorage.getItem('outro-projeto:dado') !== 'preservar') throw new Error('O rascunho Gy não foi removido ou outro projeto foi afetado.')
    if (geracao === localStorage.getItem('gy:geracao-dados')) throw new Error('A geração de dados não mudou.')
    lines.push('APROVADO · perfil, ficha ativa, treinos, agenda, sessões e medidas apagados; catálogo oficial recomposto; dados de outra origem preservados.')

    await db.close()
    await db.open()
    if (await db.perfil.count() !== 0 || await db.historico.count() !== 0) throw new Error('Dados A reapareceram após reabrir o IndexedDB.')
    await db.perfil.add({ nome: 'Perfil fictício B', idade: 25, peso: 65, altura: 170, criadoEm: new Date() })
    if (await db.fichas.count() !== 0 || await db.historico.count() !== 0 || (await db.catalogo.count()) !== exerciciosSeed.length) throw new Error('O perfil B herdou dados do A ou perdeu catálogo.')
    lines.push('APROVADO · reabrir banco e cadastrar Perfil B não recupera registros A.')
    lines.push('4/4 verificações aprovadas. Banco fictício 127.0.0.1:5196.')
  } catch (error) { lines.push(`FALHOU · ${error instanceof Error ? error.message : String(error)}`) }
  finally { result.textContent = lines.join('\n'); button.disabled = false }
})

async function assertRejeitaEscritaAntiga(escrita: Promise<number>) {
  let rejeitada = false
  try { await escrita } catch { rejeitada = true }
  if (!rejeitada || (await db.fichas.toArray()).some(ficha => ficha.nome === 'Ficha fantasma')) throw new Error('Gravação antiga não foi bloqueada.')
}
