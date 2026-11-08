import test from 'node:test'
import assert from 'node:assert/strict'
import { criarDocumentoFichas, FORMATO_FICHAS, persistirDocumentoFichas, resolverExercicios, validarDocumentoFichas } from '../src/utils/fichaCompartilhamento.ts'

const catalogo = [
  { id: 41, nome: 'Supino reto', grupoMuscular: 'Peito', equipamento: 'Barra', videoUrl: 'https://example.com/supino', defaultSeries: 3, defaultReps: '8-12' },
  { id: 42, nome: 'Remada curvada', grupoMuscular: 'Costas', equipamento: 'Barra', videoUrl: '', defaultSeries: 3, defaultReps: '8-12' },
  { id: 43, nome: 'Agachamento', grupoMuscular: 'Pernas', equipamento: 'Barra', videoUrl: '', defaultSeries: 4, defaultReps: '8-10' }
]
const prescription = (exercicioId, ordem = 1) => ({ exercicioId, ordem, series: 4, repsAlvo: '8-10', taxaAumentoKg: 2.5, descansoSegundos: 90, temDescanso: true, pesoBaseAtual: 37, substitutosIds: exercicioId === 41 ? [42] : [] })
const train = (id, fichaId, nome, days, exId) => ({ id, fichaId, nome, foco: nome, corTema: 'orange', ordem: id, diasDaSemana: days, exercicios: [prescription(exId)], criadoEm: new Date('2026-01-01'), atualizadoEm: new Date('2026-02-01') })
const ficha = (id, nome, treinos) => ({ id, nome, foco: 'Força', descricao: 'Programa de teste', corTema: 'teal', origem: 'local', criadoEm: new Date('2026-01-01'), atualizadoEm: new Date('2026-02-01'), treinos })
const programaA = ficha(100, 'AB', [train(1, 100, 'Treino A', [1, 4], 41), train(2, 100, 'Treino B', [2], 42), train(3, 100, 'Treino C', [5], 43)])
const programaB = ficha(101, 'Full Body', [train(4, 101, 'Corpo todo', [1, 3, 5], 43)])
const documento = (...fichas) => criarDocumentoFichas(fichas, catalogo, new Date('2026-11-08T10:00:00.000Z'))

const fakeDb = ({ catalogoInicial = [], falharTreino = false } = {}) => {
  const state = { catalogo: structuredClone(catalogoInicial), fichas: [], treinos: [], ativa: null, transacoes: 0, nextCatalog: Math.max(0, ...catalogoInicial.map(e => e.id || 0)) + 1, nextFicha: 1, nextTreino: 1 }
  const makeTable = (name, next) => ({
    toArray: async () => structuredClone(state[name]),
    add: async item => {
      if (name === 'treinos' && falharTreino) throw new Error('falha simulada no treino')
      const id = name === 'catalogo' ? state.nextCatalog++ : state[next]++
      state[name].push({ ...structuredClone(item), id })
      return id
    }
  })
  const banco = {
    catalogo: makeTable('catalogo', 'nextCatalog'),
    fichas: makeTable('fichas', 'nextFicha'),
    treinos: makeTable('treinos', 'nextTreino'),
    transaction: async (_mode, ...args) => {
      const run = args.at(-1)
      state.transacoes++
      const before = structuredClone({ catalogo: state.catalogo, fichas: state.fichas, treinos: state.treinos })
      const ids = [state.nextCatalog, state.nextFicha, state.nextTreino]
      try { return await run() } catch (error) {
        Object.assign(state, before)
        ;[state.nextCatalog, state.nextFicha, state.nextTreino] = ids
        throw error
      }
    }
  }
  return { banco, state }
}

test('exporta fichas completas, mantém treino em dois dias e omite IDs e dados pessoais', () => {
  const doc = documento(programaA, programaB)
  const json = JSON.stringify(doc)
  assert.equal(doc.formato, FORMATO_FICHAS)
  assert.equal(doc.versao, 2)
  assert.equal(doc.fichas[0].treinos[0].corTema, 'orange')
  assert.equal(doc.fichas.length, 2)
  assert.equal(doc.fichas[0].treinos.length, 3)
  assert.deepEqual(doc.fichas[0].treinos[0].diasDaSemana, [1, 4])
  assert.equal(doc.fichas[1].treinos[0].diasDaSemana[0], 1) // Outra ficha pode usar o mesmo dia.
  assert.equal(json.includes('pesoBaseAtual'), false)
  assert.equal(json.includes('37'), false)
  assert.equal(json.includes('historico'), false)
  assert.equal(json.includes('fichaId'), false)
  assert.equal(json.includes('100'), false)
})

test('valida estrutura e rejeita dois treinos no mesmo dia da própria ficha', () => {
  const doc = documento(programaA)
  assert.throws(() => validarDocumentoFichas({ ...doc, versao: 1 }), /versão 1/i)
  const conflitante = structuredClone(doc)
  conflitante.fichas[0].treinos[1].diasDaSemana = [1]
  assert.throws(() => validarDocumentoFichas(conflitante), /mesmo dia/i)
  const estranho = structuredClone(doc)
  estranho.fichas[0].surpresa = true
  assert.throws(() => validarDocumentoFichas(estranho), /não é reconhecido/i)
})

test('importa relacionamentos, preserva programação local e nunca ativa a ficha', async () => {
  const doc = documento(programaA, programaB)
  const destino = fakeDb()
  const resultado = await persistirDocumentoFichas(doc, destino.banco)
  assert.deepEqual(resultado, { fichasCriadas: 2, treinosCriados: 4, exerciciosCriados: 3 })
  assert.equal(destino.state.fichas[0].origem, 'importada')
  assert.equal(destino.state.treinos[0].corTema, 'orange')
  assert.deepEqual(destino.state.treinos[0].diasDaSemana, [1, 4])
  assert.equal(destino.state.treinos[0].fichaId, destino.state.fichas[0].id)
  assert.equal(destino.state.treinos[0].exercicios[0].pesoBaseAtual, 0)
  assert.equal(destino.state.ativa, null)
  assert.equal(destino.state.transacoes, 1)
})

test('reaproveita exercício igual e recria exercício personalizado no catálogo destino', async () => {
  const doc = documento(ficha(2, 'Personalizada', [train(5, 2, 'Dia A', [1], 41)]))
  assert.equal(resolverExercicios(doc.exercicios, [catalogo[0]]).get('ex-1').id, 41)
  const destino = fakeDb({ catalogoInicial: [{ ...catalogo[0], id: 41 }] })
  const resultado = await persistirDocumentoFichas(doc, destino.banco)
  assert.equal(resultado.exerciciosCriados, 1)
  assert.equal(destino.state.treinos[0].exercicios[0].exercicioId, 41)
  assert.equal(destino.state.treinos[0].exercicios[0].substitutosIds[0], 42)
})

test('transação reverte catálogo e fichas se falhar ao gravar um treino', async () => {
  const destino = fakeDb({ falharTreino: true })
  await assert.rejects(() => persistirDocumentoFichas(documento(programaA), destino.banco), /falha simulada/)
  assert.equal(destino.state.catalogo.length, 0)
  assert.equal(destino.state.fichas.length, 0)
  assert.equal(destino.state.treinos.length, 0)
})
