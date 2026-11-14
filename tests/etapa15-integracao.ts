import Dexie from 'dexie'
import { createPinia, setActivePinia } from 'pinia'
import { useFichaStore } from '../src/stores/fichaStore'
import { db, type HistoricoTreino } from '../src/database/db'
import { exerciciosSeed } from '../src/data/catalogoOficial'
import { atualizarExercicioPersonalizado, arquivarExercicioPersonalizado } from '../src/services/exerciciosPersonalizados'
import { adaptadorDexie, exportarBackup, restaurarBackup } from '../src/services/backup'
import { filtrarCatalogo } from '../src/utils/catalogo'
import { diaLocal } from '../src/utils/diasLocais'
const resultado = document.querySelector<HTMLPreElement>('#resultado')!
const frame = document.querySelector<HTMLIFrameElement>('#aplicativo')!
const permitido = location.hostname === '127.0.0.1' && location.port === '5198'
const linhas: string[] = []
const log = (texto: string) => { linhas.push(texto); resultado.textContent = linhas.join('\n') }
function conferir(condicao: unknown, texto: string) { if (!condicao) throw new Error(texto); log(`OK · ${texto}`) }
const esperar = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
async function aguardar(condicao: () => unknown) { for (let i = 0; i < 100; i++) { if (condicao()) return; await esperar(100) } throw new Error('Tempo excedido ao aguardar a interface.') }
function botao(texto: string) { return [...(frame.contentDocument?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find(b => b.textContent?.trim() === texto) }
function abrir(rota: string) { frame.src = rota }
document.querySelector<HTMLButtonElement>('#executar')!.disabled = !permitido
if (!permitido) resultado.textContent = 'Bloqueado: somente 127.0.0.1:5198.'
document.querySelector('#executar')!.addEventListener('click', async () => {
  if (!permitido) return
  try {
    frame.src = 'about:blank'; await esperar(100); db.close(); await Dexie.delete('GyDB')
    const antiga = new Dexie('GyDB')
    antiga.version(5).stores({perfil:'++id',catalogo:'++id, grupoMuscular',fichas:'++id, origem, atualizadoEm',treinos:'++id, fichaId, ordem, *diasDaSemana',configuracoes:'&chave',programacoes:'++id, fichaId, efetivaEm',historico:'++id, fichaId, treinoId, dataFim, estado, dataInicio',medidasCorporais:'++id, &dataLocal'})
    await antiga.table('medidasCorporais').add({id:1,dataLocal:'2026-01-01',bracoDireitoCm:32})
    antiga.close(); await db.open()
    const antigaMedida = await db.medidasCorporais.get(1)
    conferir(db.verno === 6 && antigaMedida?.bracoDireitoCm === 32 && antigaMedida.bracoDireitoRelaxadoCm === undefined, 'Abertura de banco v5 em v6 preserva braço legado sem reinterpretar')
    const agora = new Date(), hoje = diaLocal(agora)
    const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 180; const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#fc6471'; ctx.fillRect(0,0,160,180); ctx.fillStyle = '#16a085'; ctx.fillRect(160,0,160,180)
    await db.perfil.add({nome:'Pessoa fictícia Etapa 15',idade:30,peso:70,altura:170,criadoEm:agora,fotoPerfil:canvas.toDataURL('image/png')})
    await db.catalogo.bulkAdd(exerciciosSeed.map((e,i)=>({...e,id:i+1})))
    await db.catalogo.add({id:900,exercicioCanonicoId:'gy:personalizado:etapa15teste',nome:'Exercício fictício',grupoMuscular:'Peito',equipamento:'Halter',videoUrl:'',defaultSeries:1,defaultReps:'8'})
    await db.fichas.add({id:1,nome:'Ficha fictícia',foco:'Teste',corTema:'teal',origem:'local',criadoEm:agora,atualizadoEm:agora})
    await db.treinos.add({id:1,fichaId:1,nome:'Treino fictício',foco:'Peito',corTema:'teal',ordem:1,diasDaSemana:[agora.getDay()],exercicios:[{exercicioId:900,ordem:1,series:1,repsAlvo:'8',pesoBaseAtual:10,taxaAumentoKg:0,descansoSegundos:0,substitutosIds:[]}],criadoEm:agora,atualizadoEm:agora})
    await db.configuracoes.put({chave:'principal',fichaAtivaId:1})
    const snapshot={exercicioId:900,exercicioCanonicoId:'gy:personalizado:etapa15teste',nome:'Exercício fictício',grupoMuscular:'Peito',ordem:1,seriesPlanejadas:1,repsAlvo:'8',pesoBasePlanejado:10,taxaAumentoKg:0,temDescanso:false,descansoSegundos:0,seriesRealizadas:[{numeroDaSerie:1,peso:10,reps:'8',finalizada:true}]}
    for (let i=1;i<=6;i++) { const fim = new Date(agora.getFullYear(),agora.getMonth(),agora.getDate()-i*7,12); await db.historico.add({id:i,fichaId:1,treinoId:1,fichaNome:'Ficha fictícia',treinoNome:'Treino fictício',dataInicio:new Date(fim.getTime()-600000),dataFim:fim,diaConclusaoLocal:diaLocal(fim),estado:'finalizado',duracaoMinutos:10,exerciciosRealizados:[{...snapshot,seriesRealizadas:[{numeroDaSerie:1,peso:10+i,reps:'8',finalizada:true}]}]}) }
    const treinoBase = (await db.treinos.get(1))!
    await db.treinos.add({...treinoBase,id:2,nome:'Treino B',corTema:'rose',diasDaSemana:[(agora.getDay()+1)%7]})
    await db.treinos.add({...treinoBase,id:3,nome:'Treino legado',corTema:'teal',diasDaSemana:[(agora.getDay()+2)%7]})
    setActivePinia(createPinia())
    const fichas = useFichaStore(); await fichas.carregarDados(); fichas.abrirDetalhes(fichas.fichasSalvas[0]!); fichas.editarTreino(treinoBase)
    fichas.treinoEditando.corTema='rose';await fichas.salvarFicha()
    conferir((await db.treinos.get(1))?.corTema==='teal' && !!fichas.erroSalvamento,'Salvamento bloqueia cor ocupada na mesma ficha')
    fichas.treinoEditando.corTema='teal';await fichas.salvarFicha()
    conferir(!fichas.erroSalvamento && (await db.treinos.get(1))?.corTema==='teal','Edição mantém cor própria inclusive em duplicação legada')
    const antes=JSON.stringify(await db.historico.toArray())
    await atualizarExercicioPersonalizado(900,{nome:'Exercício corrigido',grupoMuscular:'Peito',equipamento:'Halter',videoUrl:'',defaultSeries:2,defaultReps:'10'})
    await arquivarExercicioPersonalizado(900)
    conferir(JSON.stringify(await db.historico.toArray())===antes && (await db.treinos.get(1))?.exercicios[0]?.exercicioId===900,'Editar e arquivar preserva snapshots e referências de ficha')
    conferir(!filtrarCatalogo(await db.catalogo.toArray()).some(e=>e.id===900) && (await db.catalogo.get(900))?.exercicioCanonicoId==='gy:personalizado:etapa15teste','Arquivado indisponível para novas seleções com identidade preservada')
    let oficialProtegido=false;try{await arquivarExercicioPersonalizado(1)}catch{oficialProtegido=true}conferir(oficialProtegido,'Catálogo oficial protegido')
    await db.medidasCorporais.add({dataLocal:hoje,pesoKg:70,bracoDireitoRelaxadoCm:31,bracoDireitoFlexionadoCm:35,bracoEsquerdoRelaxadoCm:30,bracoEsquerdoFlexionadoCm:34})
    const backup=await exportarBackup(adaptadorDexie);await restaurarBackup(adaptadorDexie,backup)
    conferir((await db.medidasCorporais.where('dataLocal').equals(hoje).first())?.bracoDireitoFlexionadoCm===35 && (await db.catalogo.get(900))?.arquivado,'Restauração transacional preserva novos campos, arquivo e avatar')
    const antesFalha = JSON.stringify(await db.historico.toArray())
    const falhar = () => { throw new Error('Falha fictícia de restauração') }
    db.medidasCorporais.hook('creating', falhar)
    let revertido = false
    try { await restaurarBackup(adaptadorDexie, backup) } catch { revertido = true }
    finally { db.medidasCorporais.hook('creating').unsubscribe(falhar) }
    conferir(revertido && JSON.stringify(await db.historico.toArray()) === antesFalha && !!(await db.perfil.toCollection().first()), 'Falha de restauração reverte transação sem perder histórico ou perfil')
    const ativo:HistoricoTreino={id:100,fichaId:1,treinoId:1,fichaNome:'Ficha fictícia',treinoNome:'Treino fictício',dataInicio:agora,estado:'em_andamento',duracaoMinutos:0,exerciciosRealizados:[{...snapshot,seriesRealizadas:[{numeroDaSerie:1,peso:10,reps:'8',finalizada:false}]}]}
    await db.historico.add(ativo);abrir('/perfil')
    await aguardar(()=>frame.contentDocument?.querySelector('button[aria-label="Finalizar treino"]'))
    ;(frame.contentDocument!.querySelector('button[aria-label="Finalizar treino"]') as HTMLButtonElement).click()
    await aguardar(()=>frame.contentDocument?.getElementById('confirm-title')?.textContent?.includes('pendentes'))
    conferir(!!botao('Ir para o treino'),'TopBar na aba Perfil oferece retorno para corrigir séries pendentes')
    botao('Continuar aqui')!.click();await esperar(350)
    frame.src='about:blank';await esperar(150)
    await db.historico.update(100,{exerciciosRealizados:[snapshot]});abrir('/perfil')
    await aguardar(()=>frame.contentDocument?.querySelector('button[aria-label="Finalizar treino"]'))
    ;(frame.contentDocument!.querySelector('button[aria-label="Finalizar treino"]') as HTMLButtonElement).click()
    await aguardar(()=>frame.contentDocument?.getElementById('confirm-title')?.textContent==='Finalizar treino?')
    const confirmar=botao('Finalizar treino')!;confirmar.click();confirmar.click()
    await aguardar(()=>!frame.contentDocument?.getElementById('confirm-title'))
    conferir((await db.historico.get(100))?.estado==='finalizado','Finalização pela TopBar na aba Perfil persistida e sem duplicação')
    conferir((await db.historico.toArray()).filter(s=>s.diaConclusaoLocal===hoje && s.estado==='finalizado').length===1,'Uma conclusão por dia após confirmação repetida')
    conferir(!frame.contentDocument?.querySelector('button[aria-label="Finalizar treino"]'),'Cronômetro e ação de finalizar encerrados na TopBar')
    botao('Editar meus dados')!.click()
    await aguardar(()=>frame.contentDocument?.getElementById('editar-perfil-titulo'))
    const fotoAnterior = frame.contentDocument!.querySelector<HTMLImageElement>('img[alt="Prévia da foto"]')!.src
    const blob = await new Promise<Blob>(resolve=>canvas.toBlob(b=>resolve(b!), 'image/png'))
    function escolherFoto() {
      const input = frame.contentDocument!.querySelector<HTMLInputElement>('input[type="file"][accept="image/jpeg,image/png,image/webp"]')!
      const dados = new DataTransfer(); dados.items.add(new File([blob], 'foto-ficticia.png', {type:'image/png'})); input.files=dados.files;input.dispatchEvent(new Event('change',{bubbles:true}))
    }
    escolherFoto();await aguardar(()=>frame.contentDocument?.getElementById('recorte-titulo'));botao('Cancelar')!.click();await esperar(100)
    conferir(frame.contentDocument!.querySelector<HTMLImageElement>('img[alt="Prévia da foto"]')!.src===fotoAnterior,'Cancelar recorte preserva foto atual')
    escolherFoto();await aguardar(()=>frame.contentDocument?.getElementById('recorte-titulo'));await esperar(100)
    botao('Usar foto')!.click();botao('Salvar alterações')!.click()
    await aguardar(()=>!frame.contentDocument?.getElementById('editar-perfil-titulo'))
    const foto=(await db.perfil.toCollection().first())!.fotoPerfil!
    const imagem = new Image();imagem.src=foto;await imagem.decode()
    conferir(imagem.naturalWidth===320 && imagem.naturalHeight===320 && foto!==fotoAnterior,'Recorte confirmado produz avatar JPEG quadrado persistido')
    const backupFoto=await exportarBackup(adaptadorDexie);await restaurarBackup(adaptadorDexie,backupFoto)
    conferir((await db.perfil.toCollection().first())?.fotoPerfil===foto,'Backup e restauração preservam foto recortada')
    abrir('/historico');await aguardar(()=>frame.contentDocument?.querySelector('button[aria-current="date"]'))
    ;(frame.contentDocument!.querySelector('button[aria-current="date"]') as HTMLButtonElement).click();await esperar(100)
    conferir(frame.contentDocument!.querySelectorAll('button[aria-label^="Ver detalhes de"]').length===1,'Calendário filtra pela data civil selecionada')
    ;[...frame.contentDocument!.querySelectorAll('button')].find(b=>b.textContent?.startsWith('Limpar filtro'))!.click();await esperar(100)
    conferir(frame.contentDocument!.querySelectorAll('button[aria-label^="Ver detalhes de"]').length===7,'Limpar filtro recupera histórico geral')
    abrir('/evolucao?area=desempenho');await aguardar(()=>frame.contentDocument?.querySelector('svg g[role="button"]'))
    const ponto=frame.contentDocument!.querySelector<SVGGElement>('svg g[role="button"]')!;ponto.dispatchEvent(new MouseEvent('click',{bubbles:true}));await esperar(100)
    conferir(ponto.getAttribute('aria-pressed')==='true','Gráfico responde à seleção de ponto')
    const busca=frame.contentDocument!.querySelector<HTMLInputElement>('input[type="search"]')!;busca.value='inexistente';busca.dispatchEvent(new Event('input',{bubbles:true}));await esperar(100)
    conferir(frame.contentDocument!.body.textContent?.includes('Nenhum exercício encontrado.'),'Busca do desempenho apresenta estado vazio')
    log('INTEGRAÇÃO APROVADA. Dados fictícios limitados à porta 5198.')
  } catch(e) { log(`FALHA · ${e instanceof Error?e.message:e}`) }
})
document.querySelector('#largura')!.addEventListener('change',e=>{frame.style.width=`${(e.target as HTMLSelectElement).value}px`})
document.querySelector('#rota')!.addEventListener('change',e=>abrir((e.target as HTMLSelectElement).value))
document.querySelector('#telas')!.addEventListener('click',async()=>{
 if(!permitido)return
 try{for(const largura of [320,375,390,430,768,1280])for(const rota of ['/','/fichas','/historico','/evolucao','/evolucao?area=corporal','/evolucao?area=desempenho','/perfil']){frame.style.width=`${largura}px`;abrir(rota);await aguardar(()=>frame.contentDocument?.querySelector('header'));await esperar(700);const doc=frame.contentDocument!;conferir(doc.documentElement.scrollWidth<=largura,`${rota} em ${largura}px sem rolagem horizontal`)}log('RESPONSIVIDADE APROVADA nas cinco abas.')}catch(e){log(`FALHA · ${e instanceof Error?e.message:e}`)}
})

document.querySelector('#ativo')!.addEventListener('click', async () => {
  if (!permitido) return
  await db.historico.update(100, {estado: 'em_andamento', dataFim: undefined, diaConclusaoLocal: undefined})
  abrir('/fichas')
  log('Sessão fictícia ativa preparada para inspeção da TopBar.')
})
