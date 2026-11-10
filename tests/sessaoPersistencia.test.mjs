import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
const { useTreinoStore } = await vite.ssrLoadModule('/src/stores/treinoStore.ts')
const { useFichaStore } = await vite.ssrLoadModule('/src/stores/fichaStore.ts')
const { db } = await vite.ssrLoadModule('/src/database/db.ts')
after(async () => { await vite.close() })

const treino = () => ({ id: 2, fichaId: 1, nome: 'Treino fictício', fichaNome: 'Ficha fictícia', foco: 'Peito', corTema: 'teal', diasDaSemana: [1], ordem: 1, criadoEm: new Date(), atualizadoEm: new Date(), exercicios: [{ exercicioId: 1, ordem: 1, series: 2, repsAlvo: '8', pesoBaseAtual: 10, taxaAumentoKg: 0, descansoSegundos: 0, substitutosIds: [] }] })
let registro
const copia = value => structuredClone(value)
let registros = []
const fake = {
  async toArray() { return registros.map(copia) },
  where() { return { equals(estado) { return { async first() { const row = registros.find(item => item.estado === estado); return row ? copia(row) : undefined }, async toArray() { return registros.filter(item => item.estado === estado).map(copia) } } } } },
  async add(dados) { registro = { ...copia(dados), id: registros.length + 1 }; registros.push(registro); return registro.id },
  async get(id) { const row = registros.find(item => item.id === id); return row ? copia(row) : undefined },
  async update(id, dados) { const row = registros.find(item => item.id === id); if (!row) return 0; Object.assign(row, copia(dados)); registro = row; return 1 }
}
Object.defineProperty(db, 'historico', { value: fake, configurable: true })
db.transaction = async (...args) => args.at(-1)()
const memoria = new Map()
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: key => memoria.get(key) ?? null, setItem: (key, value) => memoria.set(key, value), removeItem: key => memoria.delete(key) } })
async function iniciar(t, instante) {
  t.mock.timers.enable({ apis: ['setInterval', 'setTimeout', ...(instante ? ['Date'] : [])], ...(instante ? { now: instante.getTime() } : {}) })
  registro = undefined
  registros = []
  memoria.clear()
  setActivePinia(createPinia())
  const store = useTreinoStore()
  store.catalogo = [{ id: 1, nome: 'Supino teste', grupoMuscular: 'Peito', equipamento: 'Barra', videoUrl: '', defaultSeries: 2, defaultReps: '8', exercicioCanonicoId: 'gy:personalizado:auditoria12a' }]
  assert.equal(await store.iniciarTreino(treino()), true)
  await nextTick()
  await store.persistirSessaoAgora()
  return store
}

test('preserva descanso zero ao iniciar uma sessão', async t => {
  const store = await iniciar(t)
  assert.equal(store.exerciciosExecucao[0].descansoSegundos, 0)
  store.concluirSerie('ex_0', 0)
  assert.equal(store.descansoRodando, false)
})

test('não conclui séries inválidas nem envia carga negativa ao adaptador', async t => {
  const store = await iniciar(t)
  store.exerciciosExecucao[0].seriesRealizadas[0].pesoFito = -5
  store.concluirTodasSeries('ex_0')
  assert.equal(store.exerciciosExecucao[0].concluido, false)
  assert.equal(await store.persistirSessaoAgora(), false)
  assert.equal(registro.exerciciosRealizados[0].seriesRealizadas[0].peso, 10)
  store.exerciciosExecucao[0].seriesRealizadas[0].pesoFito = 20
  store.exerciciosExecucao[0].seriesRealizadas[0].repsFeitas = '-2'
  store.concluirSerie('ex_0', 0)
  assert.equal(store.exerciciosExecucao[0].seriesRealizadas[0].finalizada, false)
})

test('uma aba antiga não reabre sessão finalizada nem sobrescreve alterações de outra aba', async t => {
  t.mock.method(console, 'error', () => {})
  const store = await iniciar(t)
  registro.estado = 'finalizado'
  const finalizado = copia(registro)
  store.exerciciosExecucao[0].seriesRealizadas[0].pesoFito = 99
  assert.equal(await store.persistirSessaoAgora(), false)
  assert.deepEqual(registro, finalizado)
  registro.estado = 'em_andamento'
  registro.exerciciosRealizados[0].seriesRealizadas[0].peso = 25
  const externo = copia(registro)
  assert.equal(await store.persistirSessaoAgora(), false)
  assert.deepEqual(registro, externo)
})

test('rascunho síncrono recupera edições feitas imediatamente antes de recarregar', async t => {
  const store = await iniciar(t)
  store.exerciciosExecucao[0].seriesRealizadas[0].pesoFito = 37
  store.exerciciosExecucao[0].seriesRealizadas[0].repsFeitas = '11'
  store.preservarRascunho()
  assert.ok(memoria.size)
  const sessao = copia(registro)
  db.configuracoes.get = async () => ({ chave: 'principal', fichaAtivaId: null })
  db.catalogo.toArray = async () => []
  setActivePinia(createPinia())
  const recuperado = useTreinoStore()
  await recuperado.carregarTreinoDoDia()
  await nextTick()
  assert.equal(recuperado.exerciciosExecucao[0].seriesRealizadas[0].pesoFito, 37)
  assert.equal(recuperado.exerciciosExecucao[0].seriesRealizadas[0].repsFeitas, '11')
  await recuperado.persistirSessaoAgora()
  assert.equal(registro.exerciciosRealizados[0].seriesRealizadas[0].peso, 37)
  assert.equal(registro.dataInicio.getTime(), sessao.dataInicio.getTime())
})

test('não salva treino com séries negativas, fracionárias ou descanso inválido', async () => {
  setActivePinia(createPinia())
  const store = useFichaStore()
  store.fichaEditando.id = 1
  store.contextoWizard = 'novo-treino'
  for (const invalido of [{ series: -1 }, { series: 1.5 }, { descansoSegundos: -1 }, { taxaAumentoKg: -2 }]) {
    store.treinoEditando = { ...treino(), exercicios: [{ ...treino().exercicios[0], ...invalido }] }
    await store.salvarFicha()
    assert.match(store.erroSalvamento, /Confira séries/)
  }
})

test('não reaplica rascunho antigo sobre alterações confirmadas de outra aba', async t => {
  const store = await iniciar(t)
  store.exerciciosExecucao[0].seriesRealizadas[0].pesoFito = 99
  store.preservarRascunho()
  registro.exerciciosRealizados[0].seriesRealizadas[0].peso = 45
  setActivePinia(createPinia())
  const recuperado = useTreinoStore()
  await recuperado.carregarTreinoDoDia()
  assert.equal(recuperado.exerciciosExecucao[0].seriesRealizadas[0].pesoFito, 45)
})

test('cancela sessão em andamento, limpa o rascunho e não permite finalizá-la', async t => {
  const store = await iniciar(t)
  registros.push({ ...copia(registro), id: 99, estado: 'finalizado' })
  store.exerciciosExecucao[0].seriesRealizadas[0].pesoFito = 31
  store.marcarEdicao('ex_0')
  store.preservarRascunho()
  store.concluirSerie('ex_0', 0)
  assert.equal(await store.cancelarTreino(), true)
  assert.equal(registro.estado, 'cancelado')
  assert.equal(registro.exerciciosRealizados[0].seriesRealizadas[0].peso, 31)
  assert.equal(registro.exerciciosRealizados[0].seriesRealizadas[0].finalizada, true)
  assert.equal(registros.find(item => item.id === 99).estado, 'finalizado')
  assert.equal(memoria.size, 0)
  assert.equal(store.estadoAtual, 'preview')
  assert.equal(store.sessaoEstado, 'cancelado')
  assert.deepEqual(store.exerciciosExecucao, [])
  assert.equal(await store.finalizarTreino(), false)
  assert.equal(registro.estado, 'cancelado')
})

test('cancelamento iniciado enquanto a primeira gravação está pendente aguarda o ID da sessão', async t => {
  t.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] })
  registros = []
  registro = undefined
  memoria.clear()
  setActivePinia(createPinia())
  const store = useTreinoStore()
  store.catalogo = [{ id: 1, nome: 'Supino teste', grupoMuscular: 'Peito', equipamento: 'Barra', videoUrl: '', defaultSeries: 2, defaultReps: '8', exercicioCanonicoId: 'gy:personalizado:auditoria12a' }]
  const adicionar = fake.add.bind(fake)
  let liberarGravacao
  t.mock.method(fake, 'add', async dados => {
    await new Promise(resolve => { liberarGravacao = resolve })
    return adicionar(dados)
  })
  const iniciando = store.iniciarTreino(treino())
  for (let tentativa = 0; tentativa < 20 && !liberarGravacao; tentativa++) await new Promise(resolve => setImmediate(resolve))
  await nextTick()
  assert.equal(typeof liberarGravacao, 'function')
  assert.equal(store.estadoAtual, 'execucao')
  assert.equal(store.sessaoId, null)
  const cancelando = store.cancelarTreino()
  liberarGravacao()
  assert.equal(await iniciando, true)
  assert.equal(await cancelando, true)
  assert.equal(registro.estado, 'cancelado')
  assert.equal(store.estadoAtual, 'preview')
})

test('sessão recuperada pode ser cancelada e uma nova sessão pode ser iniciada depois', async t => {
  const original = await iniciar(t)
  const idAnterior = original.sessaoId
  setActivePinia(createPinia())
  const recuperada = useTreinoStore()
  await recuperada.carregarTreinoDoDia()
  assert.equal(recuperada.sessaoId, idAnterior)
  assert.equal(await recuperada.cancelarTreino(), true)
  assert.equal(registros[0].estado, 'cancelado')
  setActivePinia(createPinia())
  const aposRecarga = useTreinoStore()
  await aposRecarga.carregarTreinoDoDia()
  assert.equal(aposRecarga.sessaoEstado, null)
  assert.equal(aposRecarga.estadoAtual, 'preview')
  setActivePinia(createPinia())
  const reiniciada = useTreinoStore()
  assert.equal(await reiniciada.iniciarTreino(treino()), true)
  assert.equal(registros.length, 2)
  assert.equal(registros[0].estado, 'cancelado')
  assert.equal(registros[1].estado, 'em_andamento')
})

test('falha ao persistir cancelamento mantém sessão ativa e permite tentar novamente', async t => {
  t.mock.method(console, 'error', () => {})
  const store = await iniciar(t)
  let falharProximaAtualizacao = true
  t.mock.method(fake, 'update', async function (id, dados) {
    if (falharProximaAtualizacao && dados.estado === 'cancelado') {
      falharProximaAtualizacao = false
      throw new Error('Falha simulada ao gravar cancelamento')
    }
    const row = registros.find(item => item.id === id)
    if (!row) return 0
    Object.assign(row, copia(dados))
    registro = row
    return 1
  })
  assert.equal(await store.cancelarTreino(), false)
  assert.equal(registro.estado, 'em_andamento')
  assert.equal(store.estadoAtual, 'execucao')
  assert.equal(store.sessaoEstado, 'em_andamento')
  assert.match(store.erroPersistencia, /Não foi possível salvar/)
  assert.equal(await store.cancelarTreino(), true)
  assert.equal(registro.estado, 'cancelado')
})

test('repetir o cancelamento não altera um estado já cancelado', async t => {
  const store = await iniciar(t)
  assert.equal(await store.cancelarTreino(), true)
  assert.equal(await store.cancelarTreino(), false)
  assert.equal(registro.estado, 'cancelado')
})

test('duas tentativas concorrentes executam somente um cancelamento', async t => {
  const store = await iniciar(t)
  const resultados = await Promise.all([store.cancelarTreino(), store.cancelarTreino()])
  assert.deepEqual(resultados.sort(), [false, true])
  assert.equal(registro.estado, 'cancelado')
})


test('finalização bloqueia uma segunda sessão mesmo em outra store ou ficha', async t => {
  const store = await iniciar(t)
  store.concluirTodasSeries('ex_0')
  assert.equal(await store.finalizarTreino(), true)
  const antes = copia(registros)
  setActivePinia(createPinia())
  const outra = useTreinoStore()
  outra.catalogo = store.catalogo
  assert.equal(await outra.iniciarTreino({ ...treino(), id: 9, fichaId: 9 }), false)
  assert.equal(outra.treinoFinalizadoHoje, true)
  assert.equal(outra.estadoAtual, 'preview')
  assert.deepEqual(registros, antes)
})

test('não finaliza se outra sessão já ocupa o dia e preserva a sessão recuperável', async t => {
  t.mock.method(console, 'error', () => {})
  const store = await iniciar(t)
  store.concluirTodasSeries('ex_0')
  registros.push({ ...copia(registro), id: 99, estado: 'finalizado', dataFim: new Date() })
  assert.equal(await store.finalizarTreino(), false)
  assert.equal((await fake.get(store.sessaoId)).estado, 'em_andamento')
})


test('sessão atravessando meia-noite conta no dia da conclusão e libera no dia seguinte', async t => {
  const store = await iniciar(t, new Date(2026,10,2,23,59))
  t.mock.timers.setTime(new Date(2026,10,3,0,1).getTime())
  store.concluirTodasSeries('ex_0')
  assert.equal(await store.finalizarTreino(), true)
  assert.equal(registro.diaConclusaoLocal, '2026-11-03')
  assert.equal(await store.iniciarTreino(treino()), false)
  t.mock.timers.setTime(new Date(2026,10,4,0,1).getTime())
  await store.atualizarLimiteDiario()
  assert.equal(store.treinoFinalizadoHoje, false)
  assert.equal(await store.iniciarTreino(treino()), true)
  await store.cancelarTreino()
})

test('conclusão em outra aba encerra a execução local e bloqueia novo treino', async t => {
  const store=await iniciar(t)
  registro.estado='finalizado'
  registro.dataFim=new Date()
  await store.atualizarLimiteDiario()
  assert.equal(store.estadoAtual,'preview')
  assert.equal(store.treinoFinalizadoHoje,true)
  assert.equal(store.sessaoEstado,'finalizado')
  assert.equal(await store.persistirSessaoAgora(),false)
})
