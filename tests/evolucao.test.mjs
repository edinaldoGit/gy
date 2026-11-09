import test from 'node:test'
import assert from 'node:assert/strict'
import { agregarDesempenho, dataCivilValida, dataLocalHoje, medidasNoPeriodo, ordenarMedidas, validarMedida, variacaoPeso } from '../src/utils/evolucao.ts'

const catalogo = [
  { id: 1, nome: 'Supino', grupoMuscular: 'Peito', equipamento: 'Barra', videoUrl: '', defaultSeries: 3, defaultReps: '8-12', exercicioCanonicoId: 'gy:personalizado:aaaaaaaa' },
  { id: 2, nome: 'Chest press', grupoMuscular: 'Peito', equipamento: 'Máquina', videoUrl: '', defaultSeries: 3, defaultReps: '8-12', exercicioCanonicoId: 'gy:personalizado:bbbbbbbb' }
]

const exercicio = (id, nome, canonico, seriesRealizadas, planejado) => ({ exercicioId: id, exercicioCanonicoId: canonico, ...(planejado ? { planejado } : {}), nome, grupoMuscular: 'Peito', ordem: 1, seriesPlanejadas: 3, repsAlvo: '8-12', pesoBasePlanejado: 40, taxaAumentoKg: 2.5, temDescanso: true, descansoSegundos: 90, seriesRealizadas })
const serie = (peso, reps, finalizada = true) => ({ numeroDaSerie: 1, peso, reps, finalizada })
const sessao = (id, fichaId, data, estado, exerciciosRealizados, treinoNome = 'Treino A') => ({ id, fichaId, treinoId: id, fichaNome: `Ficha ${fichaId}`, treinoNome, dataInicio: new Date(`${data}T08:00:00`), dataFim: new Date(`${data}T09:00:00`), estado, duracaoMinutos: 60, exerciciosRealizados })

test('valida campos opcionais, datas civis locais e limites das medições', () => {
  const hoje = dataLocalHoje()
  assert.equal(dataCivilValida('2024-02-29'), true)
  assert.equal(dataCivilValida('2026-02-30'), false)
  assert.equal(validarMedida({ dataLocal: hoje, cinturaCm: 80 }), null)
  assert.match(validarMedida({ dataLocal: hoje }), /pelo menos uma medida/)
  assert.match(validarMedida({ dataLocal: '2026-02-30', pesoKg: 80 }), /data válida/)
  assert.match(validarMedida({ dataLocal: hoje, pesoKg: 0 }), /peso/)
  assert.match(validarMedida({ dataLocal: hoje, cinturaCm: 501 }), /cintura/)
})

test('ordena medições e calcula variação sem presumir direção boa ou ruim', () => {
  const medidas = [
    { id: 1, dataLocal: '2026-01-01', pesoKg: 80 },
    { id: 2, dataLocal: '2026-02-01', cinturaCm: 90 },
    { id: 3, dataLocal: '2026-03-01', pesoKg: 78.5 }
  ]
  assert.deepEqual(ordenarMedidas(medidas).map(item => item.id), [3, 2, 1])
  assert.equal(variacaoPeso(medidas), -1.5)
  assert.equal(variacaoPeso([{ dataLocal: '2026-01-01', pesoKg: 80 }]), null)
  assert.equal(medidasNoPeriodo(medidas, 'todos').length, 3)
})

test('agrega maior carga e volume por sessão entre fichas sem contar séries como sessões', () => {
  const dados = [
    sessao(10, 1, '2026-11-01', 'finalizado', [exercicio(1, 'Supino', 'gy:personalizado:aaaaaaaa', [serie(50, 8), serie(55, 6), serie(90, 3, false)])]),
    sessao(11, 2, '2026-11-03', 'finalizado', [exercicio(1, 'Supino', 'gy:personalizado:aaaaaaaa', [serie(60, 5), serie(0, 8)])], 'Treino B'),
    sessao(12, 1, '2026-11-04', 'cancelado', [exercicio(1, 'Supino', 'gy:personalizado:aaaaaaaa', [serie(100, 1)])]),
    sessao(13, 1, '2026-11-05', 'em_andamento', [exercicio(1, 'Supino', 'gy:personalizado:aaaaaaaa', [serie(100, 1)])])
  ]
  const itens = agregarDesempenho(dados, catalogo, new Date('2026-11-08T23:00:00'))
  assert.equal(itens.length, 2)
  assert.deepEqual(itens.map(item => item.maiorCargaKg), [60, 55])
  assert.equal(itens[1].volumeKgRepeticoes, 730)
  assert.equal(itens[0].volumeKgRepeticoes, 300)
  assert.deepEqual(itens[1].series, [{ peso: 50, repeticoes: 8 }, { peso: 55, repeticoes: 6 }])
})

test('mantém exercício substituto com identidade própria, ignora cargas não concluídas e não cria volume zero', () => {
  const planejado = { exercicioId: 1, exercicioCanonicoId: 'gy:personalizado:aaaaaaaa', nome: 'Supino', grupoMuscular: 'Peito' }
  const substituto = exercicio(2, 'Chest press', 'gy:personalizado:bbbbbbbb', [serie(0, 10)], planejado)
  const dados = [
    sessao(21, 1, '2026-11-06', 'finalizado', [substituto]),
    sessao(22, 1, '2026-11-07', 'finalizado', [exercicio(1, 'Supino', 'gy:personalizado:aaaaaaaa', [serie(80, 4, false)])])
  ]
  const itens = agregarDesempenho(dados, catalogo, new Date('2026-11-08T23:00:00'))
  assert.equal(itens.length, 1)
  assert.equal(itens[0].identidade, 'gy:personalizado:bbbbbbbb')
  assert.equal(itens[0].nome, 'Chest press')
  assert.equal(itens[0].maiorCargaKg, null)
  assert.equal(itens[0].volumeKgRepeticoes, null)
})

test('junta ocorrências do mesmo exercício numa sessão e não mistura exercícios diferentes', () => {
  const mesmaSessao = sessao(30, 1, '2026-11-02', 'finalizado', [
    exercicio(1, 'Supino', 'gy:personalizado:aaaaaaaa', [serie(30, 10)]),
    exercicio(1, 'Supino', 'gy:personalizado:aaaaaaaa', [serie(35, 8)]),
    exercicio(2, 'Chest press', 'gy:personalizado:bbbbbbbb', [serie(45, 6)])
  ])
  const itens = agregarDesempenho([mesmaSessao], catalogo, new Date('2026-11-08T23:00:00'))
  assert.equal(itens.length, 2)
  assert.equal(itens.find(item => item.identidade.endsWith('aaaaaaaa')).maiorCargaKg, 35)
  assert.equal(itens.find(item => item.identidade.endsWith('aaaaaaaa')).series.length, 2)
})
