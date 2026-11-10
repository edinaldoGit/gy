import test from 'node:test'
import assert from 'node:assert/strict'
import { criarDeslocamento, compromissoNoDia } from '../src/utils/programacaoEfetiva.ts'
import { calcularSequencia } from '../src/utils/sequencia.ts'
import { concluiuNoDia, diaDaConclusao } from '../src/utils/limiteDiario.ts'
import { criarLinkFicha, lerLinkFicha } from '../src/utils/fichaLink.ts'
import { criarDocumentoFichas } from '../src/utils/fichaCompartilhamento.ts'

const segunda = new Date(2026, 10, 2, 12)
const terca = new Date(2026, 10, 3, 12)
const programacao = () => ({ id: 1, fichaId: 1, fichaNome: 'Fictícia', motivo: 'ativacao', efetivaEm: segunda, diaLocalVigencia: '2026-11-02', treinos: [1,2,3,4,5].map((dia, i) => ({ treinoId: i+1, treinoNome: `Treino ${'ABCDE'[i]}`, diasDaSemana: [dia] })) })
const concluida = (dia, treinoId = 1) => ({ id: treinoId, fichaId: 1, treinoId, estado: 'finalizado', dataFim: new Date(`${dia}T18:00:00`), diaConclusaoLocal: dia })

test('desloca segunda–sexta para terça–sábado sem alterar a rotina original', () => {
  const original = programacao()
  const antes = structuredClone(original)
  const { agenda, alteracoes } = criarDeslocamento(original, [], terca)
  assert.deepEqual(alteracoes.map(x => [x.de, x.para]), [['2026-11-02','2026-11-03'],['2026-11-03','2026-11-04'],['2026-11-04','2026-11-05'],['2026-11-05','2026-11-06'],['2026-11-06','2026-11-07']])
  assert.deepEqual(original, antes)
  assert.equal(compromissoNoDia({ ...original, agenda }, '2026-11-03').treinoId, 1)
  assert.equal(compromissoNoDia({ ...original, agenda }, '2026-11-08'), null)
  assert.equal(compromissoNoDia({ ...original, agenda }, '2026-11-09').treinoId, 1)
})

test('rejeita repetição no mesmo dia e permite um novo deslocamento no dia seguinte', () => {
  const original = programacao()
  const { agenda } = criarDeslocamento(original, [], terca)
  const movida = { ...original, motivo: 'deslocamento', diaLocalVigencia: '2026-11-03', efetivaEm: terca, agenda }
  assert.throws(() => criarDeslocamento(movida, [], terca), /já foi deslocada/)
  const outra = criarDeslocamento(movida, [], new Date(2026,10,4,12))
  assert.equal(outra.alteracoes[0].para, '2026-11-04')
  assert.equal(outra.alteracoes.at(-1).para, '2026-11-08')
})

test('preserva a falta consolidada de segunda e considera os compromissos futuros deslocados', () => {
  const original = programacao()
  const { agenda } = criarDeslocamento(original, [], terca)
  const movida = { ...original, id: 2, motivo: 'deslocamento', efetivaEm: terca, diaLocalVigencia: '2026-11-03', agenda }
  const resultado = calcularSequencia([original,movida], [concluida('2026-11-03'), concluida('2026-11-04',2)], new Date(2026,10,4,20))
  assert.deepEqual(resultado.diasPerdidos, ['2026-11-02'])
  assert.equal(resultado.quantidade, 2)
})

test('não move sessões finalizadas, bloqueia sessão ativa e conclusão no dia', () => {
  assert.throws(() => criarDeslocamento(programacao(), [{ estado: 'em_andamento' }], terca), /sessão em andamento/)
  assert.throws(() => criarDeslocamento(programacao(), [concluida('2026-11-03')], terca), /já concluiu/)
  const { alteracoes } = criarDeslocamento(programacao(), [concluida('2026-11-02')], terca)
  assert.equal(alteracoes[0].de, '2026-11-03')
})

test('recusa mover pendências antigas para datas ainda passadas', () => {
  assert.throws(() => criarDeslocamento(programacao(), [], new Date(2026,10,4,12)), /anteriores a ontem/)
})

test('encadeia conflitos ao atravessar domingo e preserva fins de mês', () => {
  const p = { ...programacao(), efetivaEm: new Date(2026,9,31,12), diaLocalVigencia: '2026-10-31', treinos: [{treinoId:1,treinoNome:'Sábado',diasDaSemana:[6]},{treinoId:2,treinoNome:'Domingo',diasDaSemana:[0]},{treinoId:3,treinoNome:'Segunda',diasDaSemana:[1]}] }
  const resultado = criarDeslocamento(p, [], new Date(2026,10,1,12))
  assert.deepEqual(resultado.alteracoes.map(x=>x.para), ['2026-11-01','2026-11-02','2026-11-03'])
})

test('uma rotina diária sem folga não é sobrescrita por uma cadeia infinita', () => {
  const p = { ...programacao(), treinos: [{treinoId:1,treinoNome:'Diário',diasDaSemana:[0,1,2,3,4,5,6]}] }
  assert.throws(() => criarDeslocamento(p, [], terca), /folga disponível/)
})

test('conclusão usa o dia civil registrado, cancelamento não conta e legado é preservado', () => {
  assert.equal(concluiuNoDia([concluida('2026-11-03')], terca), true)
  assert.equal(concluiuNoDia([{ ...concluida('2026-11-03'), estado:'cancelado' }], terca), false)
  assert.equal(diaDaConclusao({ estado:'finalizado',dataFim:new Date('2026-11-04T01:00:00Z'),diaConclusaoLocal:'2026-11-03' }), '2026-11-03')
  assert.equal(concluiuNoDia([concluida('2026-11-03')], new Date(2026,10,4,0,1)), false)
  assert.ok(diaDaConclusao({ dataFim: terca }))
})

const catalogo = [{id:1,nome:'Exercício fictício',grupoMuscular:'Peito',equipamento:'Halter',videoUrl:'',defaultSeries:3,defaultReps:'10',exercicioCanonicoId:'gy:personalizado:compartilhar13'}]
const fichas = [{id:1,nome:'Ficha fictícia',foco:'Geral',corTema:'cerulean',origem:'local',criadoEm:segunda,atualizadoEm:segunda,treinos:[{id:1,fichaId:1,nome:'Treino A',foco:'Peito',ordem:1,diasDaSemana:[1],criadoEm:segunda,atualizadoEm:segunda,exercicios:[{exercicioId:1,ordem:1,series:3,repsAlvo:'10',taxaAumentoKg:0,descansoSegundos:60,pesoBaseAtual:99,substitutosIds:[]}]}]}]

test('link compactado recompõe documento validado sem carga pessoal nem dados do perfil', async () => {
  const documento = criarDocumentoFichas(fichas,catalogo)
  const link = await criarLinkFicha(documento,'https://edinaldogit.github.io/gy/fichas/')
  const recebido = await lerLinkFicha(new URL(link).hash)
  assert.deepEqual(recebido,documento)
  assert.equal(JSON.stringify(recebido).includes('pesoBaseAtual'),false)
  assert.equal(JSON.stringify(recebido).includes('fotoPerfil'),false)
})

test('rejeita links inválidos, truncados, excessivos e conteúdo que não é uma ficha', async () => {
  await assert.rejects(lerLinkFicha('#gy-ficha=v1.invalid'), /Não foi possível/)
  await assert.rejects(lerLinkFicha('#gy-ficha=v1.'+'A'.repeat(6001)), /grande/)
  const link = await criarLinkFicha(criarDocumentoFichas(fichas,catalogo),'https://exemplo.test/gy/fichas/')
  await assert.rejects(lerLinkFicha(new URL(link).hash.slice(0,-8)), /Não foi possível/)
})


test('bloqueia destino com sessão finalizada e preserva dias concluídos em ajustes posteriores', () => {
  assert.throws(() => criarDeslocamento(programacao(), [concluida('2026-11-07')], terca), /conflita/)
  const original = programacao()
  const { agenda } = criarDeslocamento(original, [], terca)
  const movida = { ...original, motivo: 'deslocamento', diaLocalVigencia:'2026-11-03', efetivaEm:terca, agenda }
  const nova = criarDeslocamento(movida, [concluida('2026-11-03')], new Date(2026,10,4,12))
  assert.equal(nova.alteracoes[0].de,'2026-11-04')
})

test('limita expansão de payload comprimido malicioso e não trunca fichas grandes', async () => {
  const { gzipSync } = await import('node:zlib')
  const { createHash } = await import('node:crypto')
  const bomba = '#gy-ficha=v1.' + gzipSync('A'.repeat(1_000_001)).toString('base64url')
  await assert.rejects(lerLinkFicha(bomba), /Não foi possível/)
  const muitos = Array.from({length:100},(_,i)=>({...catalogo[0],id:i+1,exercicioCanonicoId:`gy:personalizado:grande-teste-${i}`,nome:createHash('sha512').update(String(i)).digest('hex').slice(0,120)}))
  const grande = structuredClone(fichas)
  grande[0].treinos[0].exercicios=muitos.map((_,i)=>({...fichas[0].treinos[0].exercicios[0],exercicioId:i+1,ordem:i+1}))
  const documento=criarDocumentoFichas(grande,muitos)
  await assert.rejects(criarLinkFicha(documento,'https://exemplo.test/gy/fichas/'),/grande demais/)
  assert.equal(documento.exercicios.length,100)
})
