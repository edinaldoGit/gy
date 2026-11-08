import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularSequencia, EstadoSequencia, feedbackDaSequencia } from '../src/utils/sequencia.ts'
import { contextoConclusao, contextoLocal, dataCivil, diaLocal, proximoDia } from '../src/utils/diasLocais.ts'
import { snapshotProgramacao } from '../src/utils/programacao.ts'
import { FeedbackManager } from '../src/utils/feedbackManager.ts'

const data = (dia, hora = 12, minuto = 0) => {
  const [ano, mes, numero] = dia.split('-').map(Number)
  return new Date(ano, mes - 1, numero, hora, minuto)
}
const plano = (dias, dia = '2026-11-02', id = 1, hora = 8) => ({
  id, efetivaEm: data(dia, hora), diaLocalVigencia: dia,
  treinos: dias.length ? [{ treinoId: id, treinoNome: 'Teste', diasDaSemana: dias }] : []
})
const sessao = (dia, estado = 'finalizado', id = 1, hora = 10) => ({ id, estado, dataInicio: data(dia, hora - 1), dataFim: data(dia, hora), ...contextoConclusao(data(dia, hora)) })
const calcular = (dias, concluidas, hoje, extras = []) => calcularSequencia([plano(dias), ...extras], concluidas.map((d, i) => sessao(d, 'finalizado', i + 1)), data(hoje))

test('A: ausência de programação e sessões inicia congelada em zero', () => {
  const estado = calcularSequencia([], [], data('2026-11-08'))
  assert.equal(estado.quantidade, 0)
  assert.equal(estado.desbloqueada, false)
  assert.deepEqual(estado.diasPerdidos, [])
})
test('B/C/D: primeiro dia congelado; fogo no segundo e crescimento no terceiro', () => {
  for (const [fim, dias, quantidade] of [
    ['2026-11-02', ['2026-11-02'], 1],
    ['2026-11-04', ['2026-11-02', '2026-11-04'], 2],
    ['2026-11-06', ['2026-11-02', '2026-11-04', '2026-11-06'], 3]
  ]) {
    const estado = calcular([1, 3, 5], dias, fim)
    assert.equal(estado.quantidade, quantidade)
    assert.equal(estado.desbloqueada, quantidade >= 2)
    assert.equal(estado.ultimoDiaConcluido, fim)
  }
})
test('E/F: um ou três dias de descanso preservam a sequência', () => {
  assert.equal(calcular([1, 3], ['2026-11-02', '2026-11-04'], '2026-11-05').quantidade, 2)
  assert.equal(calcular([1, 5], ['2026-11-02'], '2026-11-05').quantidade, 1)
  assert.equal(calcular([1, 5], ['2026-11-02', '2026-11-06'], '2026-11-06').quantidade, 2)
})
test('G/H: só consolida falta depois de encerrar o dia programado', () => {
  const aberto = calcular([1, 3], ['2026-11-02'], '2026-11-04')
  const encerrado = calcular([1, 3], ['2026-11-02'], '2026-11-05')
  assert.equal(aberto.quantidade, 1)
  assert.deepEqual(aberto.diasPerdidos, [])
  assert.equal(encerrado.quantidade, 0)
  assert.deepEqual(encerrado.diasPerdidos, ['2026-11-04'])
})
test('I: conclusão depois de falta reinicia em um congelado', () => {
  const estado = calcular([1, 3, 5], ['2026-11-02', '2026-11-06'], '2026-11-06')
  assert.equal(estado.quantidade, 1)
  assert.equal(estado.desbloqueada, false)
})
test('J: treino extra no descanso não aumenta nem cria obrigação', () => {
  const estado = calcular([1, 5], ['2026-11-02', '2026-11-03'], '2026-11-05')
  assert.equal(estado.quantidade, 1)
  assert.deepEqual(estado.diasConcluidos, ['2026-11-02'])
})
test('K: várias sessões no mesmo dia e treino substituído contam um único dia', () => {
  const sessoes = [sessao('2026-11-02'), { ...sessao('2026-11-02', 'finalizado', 2), fichaId: 999, treinoId: 999 }]
  assert.equal(calcularSequencia([plano([1])], sessoes, data('2026-11-02')).quantidade, 1)
})
test('L/M: sessões em andamento, canceladas ou legadas sem estado não contam', () => {
  for (const estado of ['em_andamento', 'cancelado', undefined]) {
    assert.equal(calcularSequencia([plano([1])], [{ ...sessao('2026-11-02'), estado }], data('2026-11-02')).quantidade, 0)
  }
})
test('N: troca de ficha não reinterpreta dias anteriores', () => {
  const estado = calcular([1, 3], ['2026-11-02', '2026-11-04', '2026-11-05', '2026-11-07'], '2026-11-08', [plano([2, 4, 6], '2026-11-05', 2)])
  assert.equal(estado.quantidade, 4)
  assert.deepEqual(estado.diasPerdidos, [])
  assert.deepEqual(estado.diasProgramados, ['2026-11-02', '2026-11-04', '2026-11-05', '2026-11-07'])
})
test('O: edição não apaga falta já encerrada nem compromisso do próprio dia', () => {
  const passado = calcular([1, 3], ['2026-11-02'], '2026-11-05', [plano([5], '2026-11-05', 2)])
  assert.equal(passado.quantidade, 0)
  assert.deepEqual(passado.diasPerdidos, ['2026-11-04'])
  const proprioDia = calcular([1, 3], ['2026-11-02'], '2026-11-05', [plano([5], '2026-11-04', 2)])
  assert.deepEqual(proprioDia.diasPerdidos, ['2026-11-04'])
})
test('mudanças no dia usam união de compromissos e última programação nos dias futuros', () => {
  const estado = calcular([1], ['2026-11-02', '2026-11-04', '2026-11-06'], '2026-11-07', [plano([3], '2026-11-04', 2), plano([5], '2026-11-04', 3, 16)])
  assert.equal(estado.quantidade, 3)
  assert.deepEqual(estado.diasProgramados, ['2026-11-02', '2026-11-04', '2026-11-06'])
})
test('P: desativação/exclusão preserva snapshots e deixa de exigir novos dias', () => {
  const programacoes = [plano([1, 3, 5]), plano([], '2026-11-03', 2)]
  const antes = structuredClone(programacoes)
  const estado = calcularSequencia(programacoes, [sessao('2026-11-02')], data('2026-12-20'))
  assert.equal(estado.quantidade, 1)
  assert.deepEqual(estado.diasPerdidos, [])
  assert.deepEqual(programacoes, antes)
})
test('Q/T: relógio controlado atualiza virada do dia e retorno após segundo plano', () => {
  let agora = data('2026-11-04', 23, 59)
  const dominio = new EstadoSequencia(() => agora)
  assert.equal(dominio.atualizar([plano([1, 3])], [sessao('2026-11-02')]).quantidade, 1)
  agora = data('2026-11-05', 0)
  assert.equal(dominio.recalcular().quantidade, 0)
  agora = data('2026-11-12')
  assert.deepEqual(dominio.recalcular().diasPerdidos, ['2026-11-04', '2026-11-09', '2026-11-11'])
})
test('R: sessão que atravessa meia-noite pertence ao dia da conclusão', () => {
  const registro = { ...sessao('2026-11-03', 'finalizado', 1, 0), dataInicio: data('2026-11-02', 23) }
  assert.equal(calcularSequencia([plano([1])], [registro], data('2026-11-03')).quantidade, 0)
  assert.equal(calcularSequencia([plano([2])], [registro], data('2026-11-03')).quantidade, 1)
})
test('S: dia local difere do UTC e não muda depois de trocar o fuso', () => {
  const anterior = process.env.TZ
  try {
    process.env.TZ = 'America/Sao_Paulo'
    const fim = new Date('2026-11-03T01:30:00Z')
    assert.equal(diaLocal(fim), '2026-11-02')
    const registro = { ...sessao('2026-11-02'), dataFim: fim, ...contextoConclusao(fim) }
    const programacao = { ...plano([1]), efetivaEm: new Date('2026-11-02T11:00:00Z'), ...{ diaLocalVigencia: '2026-11-02' } }
    process.env.TZ = 'Pacific/Auckland'
    assert.equal(diaLocal(fim), '2026-11-03')
    const estado = calcularSequencia([programacao], [registro], new Date('2026-11-03T02:00:00Z'))
    assert.deepEqual(estado.diasConcluidos, ['2026-11-02'])
    assert.equal(estado.quantidade, 1)
  } finally { if (anterior === undefined) delete process.env.TZ; else process.env.TZ = anterior }
})
test('datas civis avançam entre meses/anos e DST sem dividir durações por 24 horas', () => {
  assert.equal(proximoDia('2026-12-31'), '2027-01-01')
  assert.equal(proximoDia('2028-02-28'), '2028-02-29')
  assert.equal(proximoDia('2028-02-29'), '2028-03-01')
  assert.equal(dataCivil('2026-02-30'), null)
  const anterior = process.env.TZ
  try {
    process.env.TZ = 'America/New_York'
    assert.equal((data('2026-03-09', 0) - data('2026-03-08', 0)) / 3600000, 23)
    const programacao = plano([0, 1], '2026-03-08', 1, 0)
    assert.equal(calcularSequencia([programacao], [sessao('2026-03-08'), sessao('2026-03-09')], data('2026-03-09')).quantidade, 2)
  } finally { if (anterior === undefined) delete process.env.TZ; else process.env.TZ = anterior }
})
test('U: novo domínio recompõe o mesmo resultado dos registros persistidos', () => {
  const programacoes = [plano([1, 3])], sessoes = [sessao('2026-11-02'), sessao('2026-11-04')]
  const primeiro = new EstadoSequencia(() => data('2026-11-05')).atualizar(programacoes, sessoes)
  assert.deepEqual(new EstadoSequencia(() => data('2026-11-05')).atualizar(structuredClone(programacoes), structuredClone(sessoes)), primeiro)
})
test('V: estado do domínio independe da fila e duração do feedback', () => {
  let relogio = 0
  const feedback = new FeedbackManager(() => {}, () => relogio)
  const dominio = new EstadoSequencia(() => data('2026-11-04'))
  const estado = dominio.atualizar([plano([1, 3])], [sessao('2026-11-02'), sessao('2026-11-04')])
  feedback.push('success', 'Teste')
  assert.deepEqual(dominio.recalcular(), estado)
  relogio = 4000
  feedback.tick()
  assert.equal(feedback.current, null)
  assert.deepEqual(dominio.recalcular(), estado)
})
test('primeira ativação não atribui faltas anteriores e snapshot congela contexto local', () => {
  const ficha = { id: 1, nome: 'Teste' }
  const snapshot = snapshotProgramacao(ficha, [{ id: 1, nome: 'A', diasDaSemana: [1, 3, 5] }], 'ativacao', data('2026-11-06', 8))
  assert.equal(snapshot.diaLocalVigencia, '2026-11-06')
  assert.equal(snapshot.fusoHorario, contextoLocal(data('2026-11-06')).fuso)
  const estado = calcularSequencia([snapshot], [sessao('2026-11-06')], data('2026-11-06'))
  assert.equal(estado.quantidade, 1)
  assert.deepEqual(estado.diasPerdidos, [])
})
test('conclusão inválida, futura e programação futura não influenciam o resultado', () => {
  const registros = [{ ...sessao('2026-11-02'), dataFim: undefined }, { ...sessao('2026-11-02'), diaConclusaoLocal: 'invalido' }, sessao('2026-11-04')]
  assert.equal(calcularSequencia([plano([1]), plano([2], '2026-11-03')], registros, data('2026-11-02')).quantidade, 0)
})
test('feedback apenas no primeiro dia e desbloqueio; duplicatas e continuação silenciosas', () => {
  const zero = calcular([1, 3, 5], [], '2026-11-02')
  const um = calcular([1, 3, 5], ['2026-11-02'], '2026-11-02')
  const dois = calcular([1, 3, 5], ['2026-11-02', '2026-11-04'], '2026-11-04')
  const tres = calcular([1, 3, 5], ['2026-11-02', '2026-11-04', '2026-11-06'], '2026-11-06')
  assert.match(feedbackDaSequencia(zero, um), /Primeiro treino/)
  assert.match(feedbackDaSequencia(um, dois), /acendeu/)
  assert.equal(feedbackDaSequencia(dois, dois), null)
  assert.equal(feedbackDaSequencia(dois, tres), null)
})
test('sem limite artificial: 401 dias programados cumpridos preservam a contagem completa', () => {
  const registros = []
  let dia = '2025-01-01'
  for (let i = 0; i < 401; i++, dia = proximoDia(dia)) registros.push(sessao(dia, 'finalizado', i + 1))
  assert.equal(calcularSequencia([plano([0, 1, 2, 3, 4, 5, 6], '2025-01-01')], registros, data(dia)).quantidade, 401)
})

test('viagem recuando a data local preserva conclusões anteriores e não reabre a vigência passada', () => {
  const anterior = process.env.TZ
  try {
    process.env.TZ = 'Pacific/Auckland'
    const instante = new Date('2026-11-02T12:00:00Z')
    const registro = { id: 1, estado: 'finalizado', dataFim: instante, ...contextoConclusao(instante) }
    assert.equal(registro.diaConclusaoLocal, '2026-11-03')
    const programacao = { ...plano([2], '2026-11-03'), efetivaEm: new Date('2026-11-02T11:00:00Z') }
    process.env.TZ = 'Pacific/Honolulu'
    const agora = new Date('2026-11-02T13:00:00Z')
    assert.equal(diaLocal(agora), '2026-11-02')
    assert.equal(calcularSequencia([programacao], [registro], agora).quantidade, 1)
    const nova = snapshotProgramacao(null, [], 'desativacao', agora, '2026-11-03')
    assert.equal(nova.diaLocalVigencia, '2026-11-03')
    assert.equal(calcularSequencia([programacao, nova], [registro], agora).quantidade, 1)
  } finally { if (anterior === undefined) delete process.env.TZ; else process.env.TZ = anterior }
})
