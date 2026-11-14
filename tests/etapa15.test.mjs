import test from 'node:test'
import assert from 'node:assert/strict'
import { diasDoMes, sessoesPorDia } from '../src/utils/calendarioHistorico.ts'
import { calcularRecorte } from '../src/utils/recorteFoto.ts'
import { projetarGrafico } from '../src/utils/graficos.ts'
import { agruparExercicios } from '../src/utils/seletorDesempenho.ts'
import { corOcupada, validarCorTreino } from '../src/utils/coresTreino.ts'
import { validarMedida } from '../src/utils/evolucao.ts'
import { exportarBackup, validarBackup, restaurarBackup } from '../src/services/backup.ts'
import { filtrarCatalogo } from '../src/utils/catalogo.ts'

test('calendário começa na segunda, preserva meses e múltiplas sessões e ignora cancelamento', () => {
  const sessoes = [{id:1,estado:'finalizado',dataFim:new Date('2026-10-31T12:00:00'),diaConclusaoLocal:'2026-10-31'},{id:2,estado:'finalizado',dataFim:new Date('2026-11-01T01:00:00Z'),diaConclusaoLocal:'2026-10-31'},{id:3,estado:'cancelado',dataFim:new Date('2026-11-01')},{id:4,dataFim:new Date('2026-11-02T12:00:00')}]
  const mapa = sessoesPorDia(sessoes)
  assert.equal(mapa.get('2026-10-31').length,2)
  assert.equal(mapa.has('2026-11-01'),false)
  const novembro = diasDoMes(2026,10)
  assert.equal(novembro[6],'2026-11-01')
  assert.equal(novembro.filter(Boolean).length,30)
  assert.equal(diasDoMes(2024,1).filter(Boolean).length,29)
})
test('novas medidas são opcionais, independentes e não reinterpretam valores antigos', () => {
  const antiga = {dataLocal:'2026-01-01',bracoDireitoCm:32}
  assert.equal(validarMedida(antiga),null)
  assert.equal(antiga.bracoDireitoRelaxadoCm,undefined)
  assert.equal(validarMedida({...antiga,bracoDireitoRelaxadoCm:31,bracoDireitoFlexionadoCm:35,bracoEsquerdoRelaxadoCm:30,bracoEsquerdoFlexionadoCm:34}),null)
  assert.match(validarMedida({...antiga,bracoEsquerdoFlexionadoCm:-1}),/Confira/)
})
test('backup v5 preserva braços e arquivos arquivados e mantém leitura v1–v4', async () => {
  const tabelas={perfil:[],catalogo:[{id:1,exercicioCanonicoId:'gy:personalizado:etapa15teste',nome:'Teste',grupoMuscular:'Peito',equipamento:'',videoUrl:'',defaultSeries:1,defaultReps:'8',arquivado:true}],fichas:[],treinos:[],configuracoes:[],programacoes:[],historico:[],medidasCorporais:[{id:1,dataLocal:'2026-01-01',bracoDireitoCm:32,bracoDireitoRelaxadoCm:31,bracoDireitoFlexionadoCm:35,bracoEsquerdoRelaxadoCm:30,bracoEsquerdoFlexionadoCm:34}]}
  let restaurado
  const adaptador={lerSnapshot:async()=>structuredClone(tabelas),substituir:async t=>{restaurado=structuredClone(t)}}
  const backup=await exportarBackup(adaptador)
  assert.equal(backup.versao,5)
  await restaurarBackup(adaptador,backup)
  assert.deepEqual(restaurado.medidasCorporais,tabelas.medidasCorporais)
  assert.equal(restaurado.catalogo[0].arquivado,true)
  for(const versao of [1,2,3,4]) {
    const antigo=structuredClone(backup);antigo.versao=versao;antigo.tabelas.catalogo=[];antigo.tabelas.medidasCorporais=versao<3?[]:[{id:1,dataLocal:'2026-01-01',bracoDireitoCm:32}]
    assert.equal(validarBackup(antigo).versao,versao)
  }
})
test('gráfico não converte ausência em zero, mantém datas e valores e expõe escala finita',()=>{
  const g=projetarGrafico([{data:'A',dataCivil:'2026-01-01',valor:20},{data:'Ausente',valor:null},{data:'B',dataCivil:'2026-01-11',valor:30},{data:'C',dataCivil:'2026-01-21',valor:25}])
  assert.deepEqual(g.pontos.map(p=>p.valor),[20,30,25])
  assert.equal(g.pontos[1].x,340)
  assert.ok(g.minimo<20 && g.maximo>30)
  assert.ok(projetarGrafico([{data:'A',valor:20}]).pontos.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))
})
test('seletor agrupa executados sem juntar identidades com mesmo nome e ignora acentos na busca',()=>{
  const lista=[{identidade:'a',nome:'Flexão',grupoMuscular:'Peito'},{identidade:'b',nome:'Flexão',grupoMuscular:'Peito'},{identidade:'c',nome:'Remada',grupoMuscular:'Costas'}]
  assert.equal(agruparExercicios(lista,'flexao')[0][1].length,2)
  assert.equal(agruparExercicios(lista,'inexistente').length,0)
})
test('cores exclusivas preservam edição legada, liberam cor alterada ou excluída e isolam ficha',()=>{
  const treinos=[{id:1,corTema:'teal'},{id:2,corTema:'teal'},{id:3,corTema:'rose'}]
  assert.equal(corOcupada(treinos,'teal',1),false)
  assert.throws(()=>validarCorTreino(treinos,'teal',4),/outro treino/)
  assert.equal(corOcupada(treinos,'rose',1),true)
  assert.equal(corOcupada(treinos.filter(t=>t.id!==3),'rose',1),false)
  assert.equal(corOcupada([],'teal'),false)
})
test('recorte mantém proporção em fotos horizontais e verticais e limita enquadramento',()=>{
  assert.deepEqual(calcularRecorte(800,400,1),{x:200,y:0,lado:400})
  assert.deepEqual(calcularRecorte(400,800,2,1,-1),{x:200,y:0,lado:200})
  assert.deepEqual(calcularRecorte(400,400,1),{x:0,y:0,lado:400})
  assert.throws(()=>calcularRecorte(0,800,1))
  assert.throws(()=>calcularRecorte(800,400,4))
})
test('arquivados somem da seleção sem remover a referência original',()=>{
  const c=[{id:1,nome:'Supino',grupoMuscular:'Peito',arquivado:true},{id:2,nome:'Remada',grupoMuscular:'Costas'}]
  assert.deepEqual(filtrarCatalogo(c).map(e=>e.id),[2]);assert.equal(c.length,2)
})

test('finalização compartilhada rejeita sessão vazia, incompleta ou com dados inválidos',async()=>{
  const {sessaoProntaParaFinalizar}=await import('../src/utils/exercicioSessao.ts')
  const e={concluido:true,seriesRealizadas:[{numero:1,pesoFito:10,repsFeitas:'8',finalizada:true}]}
  assert.equal(sessaoProntaParaFinalizar([]),false)
  assert.equal(sessaoProntaParaFinalizar([e]),true)
  assert.equal(sessaoProntaParaFinalizar([{...e,concluido:false}]),false)
  assert.equal(sessaoProntaParaFinalizar([{...e,seriesRealizadas:[{...e.seriesRealizadas[0],repsFeitas:'-1'}]}]),false)
})
