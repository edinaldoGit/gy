import Dexie from 'dexie'
import { router } from '../src/router'
import { createPinia, setActivePinia } from 'pinia'
import { db, type Ficha, type Treino } from '../src/database/db'
import { useFichaStore } from '../src/stores/fichaStore'
import { useTreinoStore } from '../src/stores/treinoStore'
import { snapshotProgramacao } from '../src/utils/programacao'
import { calcularSequencia } from '../src/utils/sequencia'
import { previaDeslocamento, aplicarDeslocamento } from '../src/services/deslocamento'
import { salvarPerfil } from '../src/services/perfil'
import { adaptadorDexie, exportarBackup, restaurarBackup } from '../src/services/backup'
import { criarDocumentoFichas } from '../src/utils/fichaCompartilhamento'
import { importarDocumentoFichas } from '../src/services/fichaCompartilhamento'
import { criarLinkFicha, lerLinkFicha } from '../src/utils/fichaLink'

const botao = document.querySelector<HTMLButtonElement>('#executar')!
const resultado = document.querySelector<HTMLElement>('#resultado')!
const permitido = location.hostname === '127.0.0.1' && location.port === '5193'
botao.disabled = !permitido
const assert = (ok: unknown, texto: string) => { if (!ok) throw new Error(texto) }
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const ex = { exercicioId: 1, ordem: 1, series: 1, repsAlvo: '8', taxaAumentoKg: 0, descansoSegundos: 0, pesoBaseAtual: 10, substitutosIds: [] }
const catalogo = { id: 1, nome: 'Exercício fictício', grupoMuscular: 'Peito', equipamento: 'Halter', videoUrl: '', defaultSeries: 1, defaultReps: '8', exercicioCanonicoId: 'gy:personalizado:integracao13' }

botao.addEventListener('click', async () => {
  if (!permitido) return
  botao.disabled = true
  const linhas: string[] = []
  const passou = (texto: string) => { linhas.push(`APROVADO · ${texto}`); resultado.textContent = linhas.join('\n') }
  const DataReal = Date
  let agora = new DataReal(2026,10,2,12).getTime()
  globalThis.Date = new Proxy(DataReal, { construct(alvo, args) { return Reflect.construct(alvo, args.length ? args : [agora]) }, get(alvo, chave) { return chave === 'now' ? () => agora : Reflect.get(alvo, chave) } })
  try {
    db.close()
    await Dexie.delete('GyDB')
    const antigo = new Dexie('GyDB')
    antigo.version(5).stores({perfil:'++id',catalogo:'++id, grupoMuscular',fichas:'++id, origem, atualizadoEm',treinos:'++id, fichaId, ordem, *diasDaSemana',configuracoes:'&chave',programacoes:'++id, fichaId, efetivaEm',historico:'++id, fichaId, treinoId, dataFim, estado, dataInicio',medidasCorporais:'++id, &dataLocal'})
    await antigo.table('perfil').put({id:1,nome:'Etapa 13 fictícia',idade:30,peso:75,altura:175,criadoEm:new Date()})
    antigo.close()
    await db.open()
    assert(db.verno === 6 && (await db.perfil.get(1))?.peso === 75,'Migração perdeu perfil v5.')
    await db.catalogo.add(catalogo)
    passou('Migração real de schema 5 para 6 preserva o perfil.')

    setActivePinia(createPinia())
    let fichas = useFichaStore()
    fichas.abrirNovaFicha(); fichas.fichaEditando.nome='Primeira fictícia'
    await fichas.continuarParaTreinos()
    const primeira = fichas.fichaEditando.id!
    assert((await db.configuracoes.get('principal'))?.fichaAtivaId === primeira,'Primeira ficha não ativou.')
    Object.assign(fichas.treinoEditando,{nome:'Treino A',foco:'Peito',diasDaSemana:[1],exercicios:[{...ex}]})
    await fichas.salvarFicha()
    assert(await db.treinos.count() === 1,'Treino não foi salvo.')
    passou('Jornada A: primeira ficha e primeiro treino salvos e ativados.')

    const cadastro = async (nome: string) => {
      setActivePinia(createPinia()); const outra = useFichaStore(); outra.abrirNovaFicha(); outra.fichaEditando.nome=nome; await outra.continuarParaTreinos()
    }
    await Promise.all([cadastro('Segunda fictícia'),cadastro('Terceira fictícia')])
    assert((await db.configuracoes.get('principal'))?.fichaAtivaId === primeira,'Concorrência trocou ficha ativa.')
    passou('Cadastros concorrentes posteriores preservam uma única ficha ativa.')
    const antesConcorrencia = await exportarBackup(adaptadorDexie)
    await db.transaction('rw',db.fichas,db.treinos,db.configuracoes,db.programacoes,async()=>{await db.treinos.clear();await db.fichas.clear();await db.configuracoes.clear();await db.programacoes.clear()})
    const falhar = () => { throw new Error('Falha fictícia de gravação') }
    db.fichas.hook('creating',falhar)
    try { await cadastro('Falha fictícia') } finally { db.fichas.hook('creating').unsubscribe(falhar) }
    assert(await db.fichas.count()===0 && await db.configuracoes.count()===0,'Falha criou ficha/configuração parcial.')
    await Promise.all([cadastro('Primeira concorrente'),cadastro('Outra concorrente')])
    assert(await db.fichas.count()===2 && !!(await db.fichas.get((await db.configuracoes.get('principal'))!.fichaAtivaId!)),'Primeiro cadastro concorrente inválido.')
    await restaurarBackup(adaptadorDexie,antesConcorrencia)
    passou('Falha de criação faz rollback e primeiros cadastros concorrentes deixam somente uma ficha ativa.')


    setActivePinia(createPinia())
    let treino = useTreinoStore(); await treino.carregarTreinoDoDia()
    setActivePinia(createPinia()); const concorrente=useTreinoStore(); await concorrente.carregarTreinoDoDia()
    const inicios=await Promise.all([treino.iniciarTreino(),concorrente.iniciarTreino()])
    assert(inicios.some(Boolean) && await db.historico.where('estado').equals('em_andamento').count()===1,'Início concorrente criou duas sessões.')
    treino.concluirTodasSeries('ex_0'); assert(await treino.finalizarTreino(),'Finalização falhou.')
    await concorrente.atualizarLimiteDiario()
    assert(concorrente.estadoAtual==='preview' && concorrente.treinoFinalizadoHoje,'Store concorrente não recebeu conclusão.')
    setActivePinia(createPinia()); let outraSessao = useTreinoStore(); await outraSessao.carregarTreinoDoDia()
    assert(!await outraSessao.iniciarTreino() && outraSessao.treinoFinalizadoHoje,'Segundo treino permitido.')
    agora = new DataReal(2026,10,3,12).getTime()
    await outraSessao.carregarTreinoDoDia()
    assert(!outraSessao.treinoFinalizadoHoje,'Mudança de data não liberou.')
    passou('Jornada A: sessão finalizada bloqueia novo início, recarrega e libera no dia seguinte.')

    await db.historico.clear(); await db.programacoes.clear(); await db.treinos.clear()
    const ficha = (await db.fichas.get(primeira)) as Ficha
    const treinos: Treino[] = [1,2,3,4,5].map((dia,i)=>({id:i+1,fichaId:primeira,nome:`Treino ${'ABCDE'[i]}`,foco:'Geral',corTema:'amethyst',ordem:i+1,diasDaSemana:[dia],exercicios:[{...ex}],criadoEm:new Date(),atualizadoEm:new Date()}))
    await db.treinos.bulkAdd(treinos)
    await db.programacoes.add(snapshotProgramacao(ficha,treinos,'ativacao',new DataReal(2026,10,2,12)))
    const previa = await previaDeslocamento()
    const aplicar = await Promise.allSettled([aplicarDeslocamento(previa.assinatura),aplicarDeslocamento(previa.assinatura)])
    assert(aplicar.filter(x=>x.status==='fulfilled').length===1 && await db.programacoes.count()===2,'Deslocamento duplicou.')
    const backup = await exportarBackup(adaptadorDexie)
    assert(backup.versao===4,'Backup não está em v4.')
    const snapshot = await adaptadorDexie.lerSnapshot()
    await restaurarBackup(adaptadorDexie,backup)
    assert(igual(snapshot,await adaptadorDexie.lerSnapshot()),'Backup alterou agenda.')
    passou('Jornada B: deslocamento concorrente grava uma única versão e round-trip de backup preserva a agenda.')
    for (let dia=3;dia<=7;dia++) {
      agora=new DataReal(2026,10,dia,12).getTime()
      setActivePinia(createPinia()); treino=useTreinoStore(); await treino.carregarTreinoDoDia()
      assert(treino.treinoHoje?.nome===`Treino ${'ABCDE'[dia-3]}`,'Ordem deslocada incorreta.')
      assert(await treino.iniciarTreino(),'Treino deslocado não iniciou.')
      treino.concluirTodasSeries('ex_0'); assert(await treino.finalizarTreino(),'Treino deslocado não finalizou.')
    }
    const sequencia=calcularSequencia(await db.programacoes.toArray(),await db.historico.toArray(),new Date())
    assert(sequencia.diasPerdidos.includes('2026-11-02') && sequencia.quantidade===5,'Foguinho apagou falta ou ignorou sábado.')
    assert(igual((await db.treinos.toArray()).map(x=>x.diasDaSemana),[[1],[2],[3],[4],[5]]),'Ficha original foi alterada.')
    passou('Jornada B: A–E executados terça–sábado; falta de segunda e rotina original preservadas.')

    await db.medidasCorporais.put({dataLocal:'2026-11-07',pesoKg:74,cinturaCm:82})
    const perfil=(await db.perfil.get(1))!
    await salvarPerfil({...perfil,idade:31,altura:176,peso:73,fotoPerfil:'data:image/jpeg;base64,/9j/2Q=='},true)
    await salvarPerfil({...perfil,idade:31,altura:176,peso:72,fotoPerfil:undefined},true)
    db.close(); await db.open()
    assert((await db.perfil.get(1))?.idade===31 && (await db.perfil.get(1))?.fotoPerfil===undefined,'Perfil não persistiu.')
    const medida=await db.medidasCorporais.where('dataLocal').equals('2026-11-07').first()
    assert(await db.medidasCorporais.count()===1 && medida?.pesoKg===72 && medida?.cinturaCm===82,'Peso duplicou ou apagou medidas.')
    const backupPerfil=await exportarBackup(adaptadorDexie); await restaurarBackup(adaptadorDexie,backupPerfil)
    passou('Jornada C: perfil, remoção da foto, peso diário e outras medidas persistem após reabrir e restaurar backup.')

    const documento=criarDocumentoFichas([{...ficha,treinos}],await db.catalogo.toArray())
    const link=await criarLinkFicha(documento,'https://edinaldogit.github.io/gy/fichas/')
    const recebida=await lerLinkFicha(new URL(link).hash)
    const idAtivo=(await db.configuracoes.get('principal'))?.fichaAtivaId
    await importarDocumentoFichas(recebida)
    assert((await db.configuracoes.get('principal'))?.fichaAtivaId===idAtivo,'Importação trocou ficha ativa.')
    assert(await db.fichas.where('origem').equals('importada').count()===1,'Ficha importada ausente.')
    passou('Jornada D: link validado importa ficha sem ativação e sem dados pessoais.')
    const antesRecebimento=await exportarBackup(adaptadorDexie)
    await db.perfil.clear()
    await router.push(`/fichas/${new URL(link).hash}`)
    assert(router.currentRoute.value.path==='/fichas/','Recebimento sem perfil foi bloqueado.')
    await router.replace('/fichas/')
    assert(router.currentRoute.value.path==='/fichas/','Limpar link interrompeu a prévia.')
    await router.push('/evolucao')
    assert(router.currentRoute.value.path==='/onboarding','Guarda do cadastro não foi retomada ao sair.')
    await restaurarBackup(adaptadorDexie,antesRecebimento)
    history.replaceState(history.state,'','/tests/etapa13-integracao.html')
    passou('Link sem perfil permanece na prévia após limpar o hash; sair retoma a proteção do cadastro.')

    passou('10/10 jornadas de IndexedDB real concluídas. Somente dados fictícios nesta origem.')
  } catch(erro) { linhas.push(`FALHOU · ${erro instanceof Error ? erro.stack : erro}`) }
  finally { globalThis.Date=DataReal; resultado.textContent=linhas.join('\n'); botao.disabled=false }
})
