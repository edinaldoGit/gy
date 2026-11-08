import test from 'node:test'
import assert from 'node:assert/strict'
import { conflitoDeDia, obterTreinoDoDia, snapshotProgramacao } from '../src/utils/programacao.ts'

const treino = (id, nome, dias) => ({
  id, fichaId: 10, nome, foco: '', ordem: id, diasDaSemana: dias,
  exercicios: [], criadoEm: new Date('2026-01-01'), atualizadoEm: new Date('2026-01-01')
})
const ficha = { id: 10, nome: 'Programa ABC', foco: 'Força', corTema: 'cerulean', origem: 'local', criadoEm: new Date('2026-01-01'), atualizadoEm: new Date('2026-01-01') }

test('o mesmo treino pode ser programado em dois dias e define o treino do dia', () => {
  const treinos = [treino(1, 'Treino A', [1, 4]), treino(2, 'Treino B', [2])]
  assert.equal(obterTreinoDoDia(treinos, 1).nome, 'Treino A')
  assert.equal(obterTreinoDoDia(treinos, 4).id, 1)
  assert.equal(obterTreinoDoDia(treinos, 3), null)
  assert.equal(conflitoDeDia(treinos, [1]), 1)
  assert.equal(conflitoDeDia(treinos, [1], 1), null)
})

test('programas diferentes podem repetir dias sem conflito entre si', () => {
  const programaAtual = [treino(1, 'Atual A', [1, 3])]
  const importado = [treino(9, 'Importado A', [1, 3])]
  assert.equal(conflitoDeDia([], importado[0].diasDaSemana), null)
  assert.equal(obterTreinoDoDia(programaAtual, 1).nome, 'Atual A')
  assert.equal(conflitoDeDia(importado, [1]), 1)
  assert.equal(obterTreinoDoDia(importado, 1).nome, 'Importado A')
})

test('snapshot da programação retém nomes e dias depois de uma edição', () => {
  const treinoA = treino(1, 'Treino A', [1, 4])
  const snapshot = snapshotProgramacao(ficha, [treinoA], 'ativacao', new Date('2026-11-08T12:00:00Z'))
  treinoA.nome = 'Renomeado'
  treinoA.diasDaSemana.splice(0, 2, 2)
  assert.equal(snapshot.fichaNome, 'Programa ABC')
  assert.deepEqual(snapshot.treinos[0], { treinoId: 1, treinoNome: 'Treino A', diasDaSemana: [1, 4] })
  assert.equal(snapshot.efetivaEm.toISOString(), '2026-11-08T12:00:00.000Z')
})
