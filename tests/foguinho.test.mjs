import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularFoguinho } from '../src/utils/sequencia.ts'
import { contextoConclusao, proximoDia } from '../src/utils/diasLocais.ts'

const data = (dia, hora = 12) => {
  const [ano, mes, numero] = dia.split('-').map(Number)
  return new Date(ano, mes - 1, numero, hora)
}
const grade = (inicio, dias) => ({
  id: 1, fichaId: 1, efetivaEm: data(inicio), diaLocalVigencia: inicio, motivo: 'ativacao', fichaNome: 'Ficha A',
  treinos: dias.map(({ treinoId, dia, nome = `Treino ${treinoId}` }) => ({ treinoId, treinoNome: nome, diasDaSemana: [dia] }))
})
const sessao = (dia, treinoId, id = 1, estado = 'finalizado') => ({ id, treinoId, estado, dataInicio: data(dia, 9), dataFim: data(dia, 10), ...contextoConclusao(data(dia, 10)) })
const sessoesDaSemana = (segunda, treinos) => treinos.map((treino, index) => {
  let dia = segunda
  for (let i = 0; i < treino.offset; i++) dia = proximoDia(dia)
  return sessao(dia, treino.treinoId, index + 1)
})

test('estado inicial não inventa ciclo, treino ou nível', () => {
  const estado = calcularFoguinho([], [], data('2026-11-10'))
  assert.equal(estado.nivel, 0)
  assert.equal(estado.obrigacoesNoCiclo, 0)
  assert.equal(estado.concluidosNoCiclo, 0)
  assert.equal(estado.semanasConsecutivas, 0)
})

test('contador representa treinos programados da semana e Faísca requer dois consecutivos', () => {
  const programacao = grade('2026-11-02', [
    { treinoId: 1, dia: 1 }, { treinoId: 2, dia: 3 }, { treinoId: 3, dia: 5 }
  ])
  const registros = [sessao('2026-11-02', 1), sessao('2026-11-04', 2, 2)]
  const estado = calcularFoguinho([programacao], registros, data('2026-11-05'))
  assert.equal(estado.nivel, 1)
  assert.equal(estado.concluidosNoCiclo, 2)
  assert.equal(estado.obrigacoesNoCiclo, 3)
  assert.equal(estado.dias.find(dia => dia.dia === '2026-11-03').estado, 'descanso')
})

test('ativação no meio da semana não concede ciclo completo retroativamente', () => {
  const programacao = grade('2026-11-05', [{ treinoId: 4, dia: 4 }, { treinoId: 6, dia: 6 }])
  const registros = [sessao('2026-11-05', 4), sessao('2026-11-07', 6, 2)]
  const domingo = calcularFoguinho([programacao], registros, data('2026-11-08'))
  assert.equal(domingo.semanasConsecutivas, 0)
  assert.equal(domingo.nivel, 1)
  const segunda = calcularFoguinho([programacao], registros, data('2026-11-09'))
  assert.equal(segunda.semanasConsecutivas, 0)
})

test('cada semana completa só é consolidada depois do domingo local', () => {
  const programacao = grade('2026-11-02', [{ treinoId: 2, dia: 2 }, { treinoId: 4, dia: 4 }, { treinoId: 6, dia: 6 }])
  const registros = [sessao('2026-11-03', 2), sessao('2026-11-05', 4, 2), sessao('2026-11-07', 6, 3)]
  assert.equal(calcularFoguinho([programacao], registros, data('2026-11-08')).nivel, 1)
  const estado = calcularFoguinho([programacao], registros, data('2026-11-09'))
  assert.equal(estado.nivel, 2)
  assert.equal(estado.semanasConsecutivas, 1)
})

test('as quatro primeiras semanas elevam os níveis Brasa, Labareda, Fogaréu e Gy Prime', () => {
  const treinos = [{ treinoId: 1, dia: 1 }, { treinoId: 2, dia: 3 }, { treinoId: 3, dia: 5 }]
  const programacao = grade('2026-10-05', treinos)
  let segunda = '2026-10-05'
  const registros = []
  const niveisEsperados = [2, 3, 4, 5]
  for (let semana = 0; semana < 4; semana++) {
    registros.push(...sessoesDaSemana(segunda, treinos.map((item, index) => ({ treinoId: item.treinoId, offset: [0, 2, 4][index] }))))
    for (let i = 0; i < 7; i++) segunda = proximoDia(segunda)
    const estado = calcularFoguinho([programacao], registros.map((registro, index) => ({ ...registro, id: index + semana * 3 + 1 })), data(segunda))
    assert.equal(estado.nivel, niveisEsperados[semana])
    assert.equal(estado.semanasConsecutivas, semana + 1)
  }
})

test('quatro semanas válidas desbloqueiam Gy Prime e a semana seguinte conserva o nível', () => {
  const treinos = [1, 2, 3, 4, 5].map((dia, index) => ({ treinoId: index + 1, dia }))
  const programacao = grade('2026-10-05', treinos)
  const registros = []
  let segunda = '2026-10-05'
  for (let semana = 0; semana < 4; semana++) {
    registros.push(...sessoesDaSemana(segunda, treinos.map((item, index) => ({ treinoId: item.treinoId, offset: index }))))
    for (let i = 0; i < 7; i++) segunda = proximoDia(segunda)
  }
  const estado = calcularFoguinho([programacao], registros.map((registro, index) => ({ ...registro, id: index + 1 })), data('2026-11-02'))
  assert.equal(estado.nivel, 5)
  assert.equal(estado.semanasConsecutivas, 4)
  assert.equal(estado.concluidosNoCiclo, 0)
  assert.equal(estado.obrigacoesNoCiclo, 5)
})

test('uma falta após o prazo local quebra a sequência, mas sessão cancelada ou extra não a completa', () => {
  const treinos = [1, 2, 3, 4, 5].map((dia, index) => ({ treinoId: index + 1, dia }))
  const programacao = grade('2026-11-02', treinos)
  const registros = [sessao('2026-11-04', 3, 3), sessao('2026-11-03', 2, 20, 'cancelado'), sessao('2026-11-03', 99, 21)]
  const estado = calcularFoguinho([programacao], registros, data('2026-11-04'))
  assert.equal(estado.nivel, 0)
  assert.equal(estado.semanasConsecutivas, 0)
  assert.deepEqual(estado.diasPerdidos, ['2026-11-02', '2026-11-03'])
})

test('deslocamento move a obrigação, sem apagar a falta do dia original', () => {
  const treinos = [1, 2, 3, 4, 5].map((dia, index) => ({ treinoId: index + 1, dia }))
  const inicial = grade('2026-11-02', treinos)
  const deslocamento = { ...inicial, id: 2, motivo: 'deslocamento', efetivaEm: data('2026-11-03'), diaLocalVigencia: '2026-11-03', agenda: {
    inicio: '2026-11-03', fim: '2026-11-07', itens: treinos.map((item, index) => ({ dia: `2026-11-0${index + 3}`, treinoId: item.treinoId, treinoNome: `Treino ${item.treinoId}` }))
  } }
  const registros = treinos.map((item, index) => sessao(`2026-11-0${index + 3}`, item.treinoId, index + 1))
  const estado = calcularFoguinho([inicial, deslocamento], registros, data('2026-11-08'))
  assert.equal(estado.semanasConsecutivas, 0)
  assert.deepEqual(estado.diasPerdidos, ['2026-11-02'])
})

test('trocar a ficha durante a semana preserva uma falta já consolidada', () => {
  const anterior = grade('2026-11-02', [{ treinoId: 1, dia: 1 }, { treinoId: 3, dia: 3 }])
  const nova = { ...grade('2026-11-05', [{ treinoId: 5, dia: 5 }]), id: 2, motivo: 'troca' }
  const estado = calcularFoguinho([anterior, nova], [sessao('2026-11-04', 3)], data('2026-11-06'))
  assert.deepEqual(estado.diasPerdidos, ['2026-11-02'])
  assert.equal(estado.semanasConsecutivas, 0)
})

test('o treino extra não pontua e conclusões locais sobrevivem à mudança de fuso', () => {
  const anterior = process.env.TZ
  try {
    process.env.TZ = 'America/Los_Angeles'
    const programacao = grade('2026-11-02', [{ treinoId: 5, dia: 1 }])
    const fim = new Date('2026-11-03T01:30:00Z')
    const registro = { id: 1, treinoId: 5, estado: 'finalizado', dataFim: fim, ...contextoConclusao(fim) }
    process.env.TZ = 'Pacific/Auckland'
    const estado = calcularFoguinho([programacao], [registro, sessao('2026-11-03', 99, 2)], new Date('2026-11-03T03:00:00Z'))
    assert.equal(registro.diaConclusaoLocal, '2026-11-02')
    assert.equal(estado.concluidosNoCiclo, 1)
    assert.equal(estado.obrigacoesNoCiclo, 1)
  } finally { if (anterior === undefined) delete process.env.TZ; else process.env.TZ = anterior }
})
