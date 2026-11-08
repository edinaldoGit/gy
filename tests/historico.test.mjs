import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularResumoHistorico, contarSeriesConcluidas, ordenarHistorico } from '../src/utils/historico.ts'

const sessao = (overrides = {}) => ({
  fichaId: 1,
  estado: 'finalizado',
  dataInicio: new Date('2026-11-01T10:00:00'),
  dataFim: new Date('2026-11-01T11:00:00'),
  duracaoMinutos: 60,
  exerciciosRealizados: [],
  ...overrides
})

test('ordena por conclusão e mantém legado concluído, excluindo estados ativos e cancelados', () => {
  const antiga = sessao({ fichaId: 1, dataFim: new Date('2026-11-01T11:00:00') })
  const recente = sessao({ fichaId: 2, dataFim: new Date('2026-11-07T11:00:00') })
  const legado = sessao({ fichaId: 3, estado: undefined, dataFim: new Date('2026-11-03T11:00:00') })
  const incompleta = sessao({ fichaId: 4, estado: undefined, dataFim: undefined })
  const resultado = ordenarHistorico([antiga, recente, legado, sessao({ estado: 'em_andamento' }), sessao({ estado: 'cancelado' }), incompleta])

  assert.deepEqual(resultado, [recente, legado, antiga])
})

test('calcula resumo apenas com sessões concluídas dentro dos últimos sete dias locais', () => {
  const agora = new Date(2026, 10, 8, 12, 0)
  const inicioSeteDias = new Date(2026, 10, 2, 0, 0)
  const resumo = calcularResumoHistorico([
    sessao({ dataFim: new Date(2026, 10, 8, 9, 0), duracaoMinutos: 45 }),
    sessao({ dataFim: inicioSeteDias, duracaoMinutos: 30 }),
    sessao({ dataFim: new Date(2026, 10, 1, 23, 59), duracaoMinutos: 90 }),
    sessao({ estado: 'cancelado', dataFim: new Date(2026, 10, 8, 10, 0), duracaoMinutos: 100 }),
    sessao({ estado: 'em_andamento', dataFim: new Date(2026, 10, 8, 10, 0), duracaoMinutos: 100 })
  ], agora)

  assert.deepEqual(resumo, { totalTreinos: 3, treinosUltimosSeteDias: 2, tempoTotalMinutos: 165 })
})

test('ignora duração inválida, deriva duração por datas válidas e preserva reps em texto', () => {
  const resumo = calcularResumoHistorico([
    sessao({ duracaoMinutos: Number.NaN, dataInicio: new Date('2026-11-08T10:00:00'), dataFim: new Date('2026-11-08T10:25:00') }),
    sessao({ duracaoMinutos: -4, dataInicio: new Date('invalid'), dataFim: new Date('invalid') })
  ], new Date('2026-11-08T12:00:00'))

  assert.equal(resumo.tempoTotalMinutos, 25)
  assert.equal(contarSeriesConcluidas([{ numeroDaSerie: 1, peso: 20, reps: '8-10', finalizada: true }, { numeroDaSerie: 2, peso: 20, reps: '9', finalizada: false }]), 1)
})
