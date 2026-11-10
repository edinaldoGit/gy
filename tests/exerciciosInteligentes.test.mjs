import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { exerciciosSeed } from '../src/data/catalogoOficial.ts'
import { auditoriaExercicios, VERSAO_CURADORIA } from '../src/data/exerciseSubstitutions.ts'
import { consultarSubstitutos } from '../src/services/substituicoes.ts'
import { identidadeDoCatalogo, identidadeHistorica, identidadeOficial } from '../src/utils/identidadeExercicio.ts'
import { execucoesDoExercicio } from '../src/utils/historicoExercicio.ts'
import { trocarExercicio, usarReferencia, serializarExercicio, recuperarExercicio, temRegistros } from '../src/utils/exercicioSessao.ts'
import { filtrarCatalogo } from '../src/utils/catalogo.ts'
import { criarDocumentoFichas, resolverExercicios, validarDocumentoFichas } from '../src/utils/fichaCompartilhamento.ts'
import { exportarBackup, restaurarBackup, validarBackup } from '../src/services/backup.ts'
import { calcularSequencia } from '../src/utils/sequencia.ts'

const cat = exerciciosSeed.map(e => ({ ...e, id: e.id + 1000 }))
const deck = cat.find(e => e.exercicioCanonicoId === 'gy:oficial:24')
const polia = cat.find(e => e.exercicioCanonicoId === 'gy:oficial:16')
const agora = new Date('2026-11-12T15:00:00Z')
const slot = () => ({ idUnico: 'ex_0', exercicioId: deck.id, exercicioCanonicoId: deck.exercicioCanonicoId, nome: deck.nome, grupoMuscular: deck.grupoMuscular, videoUrl: deck.videoUrl, ordem: 1, seriesTotais: 3, repsAlvo: '10-12', pesoBasePlanejado: 40, taxaAumentoKg: 2.5, temDescanso: true, descansoSegundos: 90, concluido: false, registrosEditados: false, seriesRealizadas: [40,40,45].map((peso, i) => ({ numero: i+1, pesoFito: peso, repsFeitas: '10', finalizada: false })) })
const sessao = (id, fim, ex, estado = 'finalizado', fichaId = 1, treinoId = 1) => ({ id, fichaId, treinoId, fichaNome: `Ficha ${fichaId}`, treinoNome: `Treino ${treinoId}`, estado, dataInicio: new Date(fim), dataFim: new Date(fim), duracaoMinutos: 30, exerciciosRealizados: [ex] })
const realizado = (ex = slot()) => serializarExercicio({ ...ex, registrosEditados: true, seriesRealizadas: ex.seriesRealizadas.map(s => ({ ...s, finalizada: true })) }, 0)

 test('auditoria cobre todos os 233 exercícios e detecta mudanças futuras no seed', () => {
  assert.equal(VERSAO_CURADORIA, 1)
  assert.equal(exerciciosSeed.length, 233)
  assert.deepEqual(auditoriaExercicios.map(e => e.codigo), exerciciosSeed.map(e => e.id))
  const hash = createHash('sha256').update(JSON.stringify(exerciciosSeed.map(e => [e.id,e.nome,e.grupoMuscular,e.equipamento,e.videoUrl]))).digest('hex')
  assert.equal(hash, 'd05b49855ae0dd2acdfd11f8a514544fd36c2884f5c275d7a6dd02ace74a6ba2')
  for (const e of auditoriaExercicios) { assert.equal(e.nome, exerciciosSeed.find(s => s.id === e.codigo).nome); assert.ok(e.principal && e.padrao && e.natureza && e.equipamento) }
})

test('relações são explícitas, válidas, sem autorreferências/duplicatas e com ordem e justificativa', () => {
  const ids = new Set(exerciciosSeed.map(e => e.exercicioCanonicoId))
  assert.equal(auditoriaExercicios.filter(e => e.alternativas.length).length, 186)
  assert.equal(auditoriaExercicios.reduce((n,e) => n+e.alternativas.length,0),250)
  for (const e of auditoriaExercicios) {
    assert.ok(ids.has(e.exercicioCanonicoId))
    const destinos = e.alternativas.map(a => a.exercicioCanonicoId)
    assert.equal(new Set(destinos).size,destinos.length)
    e.alternativas.forEach((a,i) => { assert.ok(ids.has(a.exercicioCanonicoId)); assert.notEqual(a.exercicioCanonicoId,e.exercicioCanonicoId); assert.equal(a.prioridade,i+1); assert.ok(a.justificativa.trim().length>15) })
  }
})

test('curadoria é direcional, usa identidades canônicas e retorna vazio sem sugestão', () => {
  assert.ok(consultarSubstitutos(cat.find(e=>e.exercicioCanonicoId==='gy:oficial:14'),cat).some(a=>a.exercicioCanonicoId==='gy:oficial:12'))
  assert.ok(!consultarSubstitutos(cat.find(e=>e.exercicioCanonicoId==='gy:oficial:12'),cat).some(a=>a.exercicioCanonicoId==='gy:oficial:14'))
  assert.deepEqual(consultarSubstitutos(cat.find(e=>e.exercicioCanonicoId==='gy:oficial:25'),cat),[])
  assert.equal(consultarSubstitutos(deck,cat)[0].exercicio.id,polia.id)
  assert.deepEqual(consultarSubstitutos(deck,cat),consultarSubstitutos(deck,cat))
})

test('identidade oficial independe do ID local e não é inferida por nome parecido', () => {
  assert.equal(identidadeOficial({ ...deck,id:9999 }),deck.exercicioCanonicoId)
  assert.equal(identidadeOficial({ ...deck,nome:'Peck Deck' }),undefined)
  const custom = { ...deck, exercicioCanonicoId: 'gy:personalizado:abcdefgh-1234' }
  assert.equal(identidadeDoCatalogo(custom),custom.exercicioCanonicoId)
  assert.deepEqual(consultarSubstitutos(custom,cat),[])
})

test('busca manual compartilhada oferece catálogo sem depender da curadoria', () => {
  assert.ok(filtrarCatalogo(cat,'rotacao externa').length>=2)
  assert.ok(filtrarCatalogo(cat,'','Peito').every(e=>e.grupoMuscular==='Peito'))
  assert.deepEqual(filtrarCatalogo(cat,'inexistente'),[])
})

test('Peck Deck recupera séries de outra ficha/treino pela identidade realmente executada', () => {
  const historico=[sessao(1,'2026-11-09T15:00:00Z',realizado(), 'finalizado',5,2),sessao(2,'2026-11-10T15:00:00Z',realizado(), 'cancelado',7,8),sessao(3,'2026-11-11T15:00:00Z',realizado(), 'em_andamento',9,3)]
  const referencia=execucoesDoExercicio(historico,cat,deck.exercicioCanonicoId,agora)[0]
  assert.equal(referencia.sessaoId,1)
  assert.deepEqual(referencia.series.map(s=>s.peso),[40,40,45])
  assert.equal(referencia.fichaNome,'Ficha 5')
})

test('última execução usa conclusão, desempata por sessão/slot e ignora séries sem registro válido', () => {
  const parcial=realizado();parcial.seriesRealizadas[0].finalizada=false;parcial.seriesRealizadas[1].reps='';
  const registros=[sessao(1,'2026-11-09T15:00:00Z',realizado()),sessao(2,'2026-11-11T15:00:00Z',parcial),sessao(3,'2026-11-13T15:00:00Z',realizado())]
  const resultado=execucoesDoExercicio(registros,cat,deck.exercicioCanonicoId,agora)
  assert.equal(resultado[0].sessaoId,2)
  assert.deepEqual(resultado[0].series.map(s=>s.numeroDaSerie),[3])
  assert.deepEqual(execucoesDoExercicio(registros,cat,'gy:oficial:25',agora),[])
})

test('substituição mantém o planejado, zera carga de outro exercício e não muda a ficha', () => {
  const original=slot(),antes=structuredClone(original)
  const substituto=trocarExercicio(original,polia)
  assert.deepEqual(original,antes)
  assert.equal(substituto.exercicioId,polia.id)
  assert.equal(substituto.planejado.exercicioId,deck.id)
  assert.deepEqual(substituto.seriesRealizadas.map(s=>s.pesoFito),[0,0,0])
  assert.ok(substituto.seriesRealizadas.every(s=>!s.finalizada))
  assert.equal(substituto.seriesTotais,original.seriesTotais)
  assert.equal(substituto.descansoSegundos,original.descansoSegundos)
})

test('histórico do substituto é próprio e não atribui cargas ao planejado', () => {
  const substituto=trocarExercicio(slot(),polia)
  const historico=[sessao(10,'2026-11-11T15:00:00Z',realizado(substituto))]
  assert.equal(execucoesDoExercicio(historico,cat,polia.exercicioCanonicoId,agora).length,1)
  assert.equal(execucoesDoExercicio(historico,cat,deck.exercicioCanonicoId,agora).length,0)
})

test('referência só preenche séries existentes correspondentes e nunca conclui série', () => {
  const ex=slot(),serie=realizado();serie.seriesRealizadas=[serie.seriesRealizadas[2]]
  const referencia=execucoesDoExercicio([sessao(1,'2026-11-09T15:00:00Z',serie)],cat,deck.exercicioCanonicoId,agora)[0]
  const atualizado=usarReferencia(ex,referencia)
  assert.equal(atualizado.seriesRealizadas[0].pesoFito,ex.seriesRealizadas[0].pesoFito)
  assert.equal(atualizado.seriesRealizadas[2].pesoFito,45)
  assert.ok(atualizado.seriesRealizadas.every(s=>!s.finalizada))
  assert.equal(atualizado.concluido,false)
  assert.throws(()=>usarReferencia({ ...ex,registrosEditados:true },referencia),/preservadas/)
  assert.throws(()=>usarReferencia(trocarExercicio(ex,polia),referencia),/outro exercício/)
})

test('desfaz antes de registrar e bloqueia trocas após edição ou série concluída', () => {
  const original=slot(),substituto=trocarExercicio(original,polia),restaurado=trocarExercicio(substituto)
  assert.equal(restaurado.exercicioId,original.exercicioId)
  assert.equal(restaurado.seriesRealizadas[0].pesoFito,40)
  assert.throws(()=>trocarExercicio({ ...substituto,registrosEditados:true }),/bloqueada/)
  const feito=slot();feito.seriesRealizadas[0].finalizada=true
  assert.ok(temRegistros(feito));assert.throws(()=>trocarExercicio(feito,polia),/bloqueada/)
})

test('snapshot recupera substituição, planejado e duas séries sem depender do catálogo atual', () => {
  const ex=trocarExercicio(slot(),polia);ex.seriesRealizadas[0]={ numero:1,pesoFito:12,repsFeitas:'12',finalizada:true };ex.seriesRealizadas[1]={ numero:2,pesoFito:15,repsFeitas:'10',finalizada:true };ex.registrosEditados=true
  const persistido=JSON.parse(JSON.stringify(serializarExercicio(ex,0)))
  const recuperado=recuperarExercicio(persistido,[],0)
  assert.equal(recuperado.nome,polia.nome);assert.equal(recuperado.planejado.nome,deck.nome)
  assert.deepEqual(recuperado.seriesRealizadas,ex.seriesRealizadas)
  assert.equal(recuperado.exercicioCanonicoId,polia.exercicioCanonicoId)
})

test('sessões legadas usam vínculo local verificável e preservam dados de edição desconhecida', () => {
  const legado=realizado();delete legado.exercicioCanonicoId;delete legado.planejado;delete legado.registrosEditados
  assert.equal(identidadeHistorica(legado,cat),deck.exercicioCanonicoId)
  assert.equal(recuperarExercicio(legado,cat,0).registrosEditados,true)
  assert.equal(identidadeHistorica({ ...legado,nome:'Outro exercício' },cat),`gy:legado-local:${deck.id}`)
})

test('compartilhamento v3 conserva identidade, aceita v2 e não incorpora substituições da sessão', () => {
  const ficha={ id:1,nome:'Ficha',foco:'Peito',corTema:'amethyst',origem:'local',criadoEm:agora,atualizadoEm:agora,treinos:[{id:1,fichaId:1,nome:'A',foco:'Peito',corTema:'amethyst',ordem:1,diasDaSemana:[1],criadoEm:agora,atualizadoEm:agora,exercicios:[{exercicioId:deck.id,ordem:1,series:3,repsAlvo:'10',taxaAumentoKg:0,descansoSegundos:60,pesoBaseAtual:0,substitutosIds:[]}]}]}
  trocarExercicio(slot(),polia)
  const doc=criarDocumentoFichas([ficha],cat)
  assert.equal(doc.exercicios[0].exercicioCanonicoId,deck.exercicioCanonicoId)
  assert.equal(resolverExercicios(doc.exercicios,[{...deck,id:9999}]).get('ex-1').id,9999)
  assert.ok(!JSON.stringify(doc).includes('planejado'))
  const v2=structuredClone(doc);v2.versao=2;v2.exercicios.forEach(e=>delete e.exercicioCanonicoId)
  assert.equal(validarDocumentoFichas(v2).exercicios[0].nome,deck.nome)
})

test('backup v4 preserva substituição e histórico global; v1 e v2 continuam aceitos', async () => {
  const ex=realizado(trocarExercicio(slot(),polia))
  const tabelas={perfil:[],catalogo:cat,fichas:[],treinos:[],configuracoes:[],programacoes:[],historico:[sessao(1,'2026-11-09T15:00:00Z',ex)]}
  let recuperado
  const backup=await exportarBackup({lerSnapshot:async()=>tabelas,substituir:async()=>{}},agora)
  assert.equal(backup.versao,4)
  await restaurarBackup({lerSnapshot:async()=>tabelas,substituir:async t=>{recuperado=t}},backup)
  assert.deepEqual(recuperado,{...tabelas,medidasCorporais:[]})
  assert.equal(execucoesDoExercicio(recuperado.historico,recuperado.catalogo,polia.exercicioCanonicoId,agora)[0].series.length,3)
  assert.deepEqual(calcularSequencia(recuperado.programacoes,recuperado.historico,agora),calcularSequencia(tabelas.programacoes,tabelas.historico,agora))
  const v1=structuredClone(backup);v1.versao=1;v1.tabelas.catalogo.forEach(e=>delete e.exercicioCanonicoId);v1.tabelas.historico.forEach(s=>s.exerciciosRealizados.forEach(e=>{delete e.exercicioCanonicoId;delete e.planejado;delete e.registrosEditados}))
  assert.equal(validarBackup(v1).versao,1)
  const v2=structuredClone(backup);v2.versao=2;delete v2.tabelas.medidasCorporais
  assert.deepEqual(validarBackup(v2).tabelas.medidasCorporais,[])
  const identidadeExecutadaIncorreta=structuredClone(backup)
  identidadeExecutadaIncorreta.tabelas.historico[0].exerciciosRealizados[0].exercicioCanonicoId='gy:oficial:24'
  assert.throws(()=>validarBackup(identidadeExecutadaIncorreta),/dados inválidos/)
  const identidadePlanejadaIncorreta=structuredClone(backup)
  identidadePlanejadaIncorreta.tabelas.historico[0].exerciciosRealizados[0].planejado.exercicioCanonicoId='gy:oficial:16'
  assert.throws(()=>validarBackup(identidadePlanejadaIncorreta),/dados inválidos/)
  const idExercicioInvalido=structuredClone(backup)
  idExercicioInvalido.tabelas.historico[0].exerciciosRealizados[0].exercicioId=0
  assert.throws(()=>validarBackup(idExercicioInvalido),/dados inválidos/)
})
