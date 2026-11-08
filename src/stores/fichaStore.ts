import { feedback } from '@/composables/useFeedback'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { db, type ConfiguracaoApp, type ExercicioCatalogo, type Ficha, type FichaCompleta, type Treino } from '@/database/db'
import { conflitoDeDia, snapshotProgramacao } from '@/utils/programacao'

type ModoFicha = 'lista' | 'detalhe' | 'step1' | 'treino-info' | 'step2' | 'step3'
type ContextoWizard = 'nova-ficha' | 'editar-ficha' | 'novo-treino' | 'editar-treino'
type TreinoRascunho = Omit<Treino, 'id' | 'fichaId' | 'criadoEm' | 'atualizadoEm'> & { id?: number }

export const useFichaStore = defineStore('ficha', () => {
  const salvando = ref(false)
  const erroSalvamento = ref('')
  const criandoExercicio = ref(false)
  const erroExercicio = ref('')
  const modo = ref<ModoFicha>('lista')
  const contextoWizard = ref<ContextoWizard>('nova-ficha')
  const fichasSalvas = ref<FichaCompleta[]>([])
  const fichaAtivaId = ref<number | null>(null)
  const catalogo = ref<ExercicioCatalogo[]>([])
  const termoBusca = ref('')
  const descansoGlobal = ref(60)
  const modalCriarExAberto = ref(false)
  const fichaSelecionada = ref<FichaCompleta | null>(null)
  const filtroOrigem = ref<'todas' | 'local' | 'importada'>('todas')
  const paletaCores = [
    { id: 'amethyst', bg: 'bg-amethyst-500', text: 'text-amethyst-500', light: 'bg-amethyst-50' },
    { id: 'cerulean', bg: 'bg-cerulean-600', text: 'text-cerulean-600', light: 'bg-cerulean-50' },
    { id: 'teal', bg: 'bg-teal-500', text: 'text-teal-500', light: 'bg-teal-50' },
    { id: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50' },
    { id: 'bubblegum', bg: 'bg-bubblegum-500', text: 'text-bubblegum-500', light: 'bg-bubblegum-50' },
    { id: 'orange', bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50' },
    { id: 'rose', bg: 'bg-rose-500', text: 'text-rose-500', light: 'bg-rose-50' }
  ]
  const fichaEditando = ref<Partial<Ficha> & { treinos: Treino[] }>({ nome: '', foco: '', corTema: 'cerulean', origem: 'local', criadoEm: new Date(), atualizadoEm: new Date(), treinos: [] })
  const treinoEditando = ref<TreinoRascunho>({ nome: '', foco: '', ordem: 1, corTema: 'cerulean', diasDaSemana: [], exercicios: [] })
  const novoEx = ref({ nome: '', grupoMuscular: 'Peito', equipamento: 'Halter', videoUrl: '', defaultSeries: 3, defaultReps: '10-12' })

  const fichaAtual = computed(() => fichasSalvas.value.find(ficha => ficha.id === fichaAtivaId.value) ?? null)
  const fichasBiblioteca = computed(() => fichasSalvas.value.filter(ficha => ficha.id !== fichaAtivaId.value && (filtroOrigem.value === 'todas' || ficha.origem === filtroOrigem.value)))
  const diasOcupados = computed(() => [] as number[])
  const corEstaEmUso = (_idCor: string) => false
  const getCorObj = (idCor: string) => paletaCores.find(cor => cor.id === idCor) || paletaCores[1]
  const exerciciosAgrupados = computed(() => {
    const grupos: Record<string, ExercicioCatalogo[]> = {}
    catalogo.value.forEach(ex => (grupos[ex.grupoMuscular] ||= []).push(ex))
    return grupos
  })
  const resultadosBusca = computed(() => {
    const termo = termoBusca.value.toLowerCase()
    return catalogo.value.filter(ex => ex.nome.toLowerCase().includes(termo) || ex.grupoMuscular.toLowerCase().includes(termo))
  })
  const isExercicioSelecionado = (id: number) => treinoEditando.value.exercicios.some(ex => ex.exercicioId === id)

  const carregarDados = async () => {
    const [registrosFicha, treinos, listaCatalogo, config] = await Promise.all([
      db.fichas.toArray(), db.treinos.toArray(), db.catalogo.toArray(), db.configuracoes.get('principal')
    ])
    // Registros do modelo anterior permanecem no banco até uma limpeza manual explícita.
    // Eles não são apresentados como fichas válidas porque não têm identidade do programa.
    const fichas = registrosFicha.filter(ficha =>
      (ficha.origem === 'local' || ficha.origem === 'importada') &&
      ficha.criadoEm instanceof Date && ficha.atualizadoEm instanceof Date
    )
    fichaAtivaId.value = config?.fichaAtivaId ?? null
    catalogo.value = listaCatalogo
    fichasSalvas.value = fichas.map(ficha => ({
      ...ficha,
      treinos: treinos.filter(treino => treino.fichaId === ficha.id).sort((a, b) => a.ordem - b.ordem)
    }))
    if (fichaSelecionada.value?.id) fichaSelecionada.value = fichasSalvas.value.find(f => f.id === fichaSelecionada.value?.id) || null
  }

  const abrirNovaFicha = () => {
    contextoWizard.value = 'nova-ficha'
    fichaEditando.value = { nome: '', foco: '', corTema: 'cerulean', origem: 'local', criadoEm: new Date(), atualizadoEm: new Date(), treinos: [] }
    modo.value = 'step1'
  }
  const abrirDetalhes = (ficha: FichaCompleta) => { fichaSelecionada.value = ficha; modo.value = 'detalhe' }
  const voltar = () => {
    if (modo.value === 'step3') modo.value = 'step2'
    else if (modo.value === 'step2') modo.value = 'treino-info'
    else if (modo.value === 'treino-info') modo.value = 'detalhe'
    else if (modo.value === 'step1') modo.value = fichaSelecionada.value ? 'detalhe' : 'lista'
    else if (modo.value === 'detalhe') modo.value = 'lista'
    else modo.value = 'lista'
    void carregarDados()
  }
  const abrirEdicaoFicha = (ficha = fichaSelecionada.value) => {
    if (!ficha) return
    fichaSelecionada.value = ficha
    fichaEditando.value = { ...ficha, treinos: ficha.treinos.map(treino => ({ ...treino, exercicios: treino.exercicios.map(ex => ({ ...ex })) })) }
    contextoWizard.value = 'editar-ficha'
    modo.value = 'step1'
  }
  const persistirDadosFicha = async () => {
    if (!fichaEditando.value.nome?.trim()) return false
    const agora = new Date()
    const existente = fichaEditando.value.id ? await db.fichas.get(fichaEditando.value.id) : undefined
    const ficha: Ficha = {
      id: fichaEditando.value.id,
      nome: fichaEditando.value.nome.trim(), foco: fichaEditando.value.foco?.trim() || 'Geral',
      descricao: fichaEditando.value.descricao?.trim() || '', corTema: fichaEditando.value.corTema || 'cerulean',
      origem: fichaEditando.value.origem || 'local', criadoEm: existente?.criadoEm || fichaEditando.value.criadoEm || agora, atualizadoEm: agora
    }
    ficha.id = await db.fichas.put(ficha)
    fichaEditando.value.id = ficha.id
    if (existente) {
      const config = await db.configuracoes.get('principal')
      if (config?.fichaAtivaId === ficha.id) await registrarProgramacao(ficha.id, 'edicao')
    }
    await carregarDados()
    feedback.success(existente ? 'Ficha atualizada com sucesso!' : 'Ficha criada com sucesso!')
    return true
  }
  const continuarParaTreinos = async () => {
    if (salvando.value) return
    salvando.value = true
    erroSalvamento.value = ''
    try {
      if (!(await persistirDadosFicha())) return
      if (contextoWizard.value === 'editar-ficha') {
        fichaSelecionada.value = fichaAtivaLocalizada()
        modo.value = 'detalhe'
        return
      }
      fichaSelecionada.value = fichaAtivaLocalizada()
      prepararNovoTreino()
      modo.value = 'treino-info'
    } catch (error) {
      erroSalvamento.value = error instanceof Error ? error.message : 'Não foi possível salvar a ficha.'
      feedback.error('Não foi possível salvar a ficha.')
    } finally { salvando.value = false }
  }
  const prepararNovoTreino = () => {
    const treinosExistentes = fichaSelecionada.value && fichaSelecionada.value.id === fichaEditando.value.id ? fichaSelecionada.value.treinos : []
    treinoEditando.value = { nome: '', foco: '', ordem: (treinosExistentes?.length || 0) + 1, corTema: 'cerulean', diasDaSemana: [], exercicios: [] }
    termoBusca.value = ''
    contextoWizard.value = 'novo-treino'
  }
  const adicionarTreino = () => {
    if (!fichaSelecionada.value?.id) return abrirEdicaoFicha(fichaSelecionada.value)
    fichaEditando.value = { ...fichaSelecionada.value, treinos: fichaSelecionada.value.treinos }
    treinoEditando.value = { nome: '', foco: '', ordem: fichaSelecionada.value.treinos.length + 1, corTema: 'cerulean', diasDaSemana: [], exercicios: [] }
    termoBusca.value = ''
    contextoWizard.value = 'novo-treino'
    modo.value = 'treino-info'
  }
  const editarTreino = (treino: Treino) => {
    if (!fichaSelecionada.value) return
    fichaEditando.value = { ...fichaSelecionada.value, treinos: fichaSelecionada.value.treinos }
    treinoEditando.value = { ...treino, corTema: treino.corTema || fichaSelecionada.value.corTema || 'cerulean', diasDaSemana: [...treino.diasDaSemana], exercicios: treino.exercicios.map(ex => ({ ...ex, substitutosIds: [...(ex.substitutosIds || [])] })) }
    termoBusca.value = ''
    contextoWizard.value = 'editar-treino'
    modo.value = 'treino-info'
  }
  const salvarDadosTreino = async () => {
    const fichaId = fichaEditando.value.id
    if (!fichaId || !treinoEditando.value.nome.trim() || !treinoEditando.value.foco.trim() || treinoEditando.value.exercicios.length === 0) return false
    const dias = [...new Set(treinoEditando.value.diasDaSemana)].sort()
    if (dias.length !== 1) throw new Error('Escolha um único dia da semana para este treino.')
    const treinosExistentes = await db.treinos.where('fichaId').equals(fichaId).toArray()
    const conflito = conflitoDeDia(treinosExistentes, dias, treinoEditando.value.id)
    if (conflito !== null) throw new Error(`Já existe um treino marcado para ${['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'][conflito]}.`)
    const agora = new Date()
    const anterior = treinoEditando.value.id ? await db.treinos.get(treinoEditando.value.id) : undefined
    const treino: Treino = {
      id: treinoEditando.value.id, fichaId, nome: treinoEditando.value.nome.trim(), foco: treinoEditando.value.foco.trim() || 'Geral',
      ordem: treinoEditando.value.ordem, corTema: treinoEditando.value.corTema || 'cerulean', diasDaSemana: dias,
      // O IndexedDB exige arrays comuns, sem os proxies reativos do formulário.
      exercicios: treinoEditando.value.exercicios.map((ex, index) => ({
        ...ex, ordem: index + 1, substitutosIds: [...(ex.substitutosIds || [])]
      })),
      criadoEm: anterior?.criadoEm || agora, atualizadoEm: agora
    }
    await db.transaction('rw', db.treinos, async () => { await db.treinos.put(treino) })
    if ((await db.configuracoes.get('principal'))?.fichaAtivaId === fichaId) await registrarProgramacao(fichaId, 'edicao')
    await carregarDados()
    fichaSelecionada.value = fichaAtivaLocalizada()
    modo.value = 'detalhe'
    feedback.success(anterior ? 'Treino atualizado com sucesso!' : 'Treino adicionado à ficha!')
    return true
  }
  const fichaAtivaLocalizada = () => fichasSalvas.value.find(ficha => ficha.id === fichaEditando.value.id) || fichaSelecionada.value
  const registrarProgramacao = async (fichaId: number | null, motivo: 'ativacao' | 'troca' | 'edicao' | 'desativacao') => {
    const ficha = fichaId === null ? null : await db.fichas.get(fichaId)
    const treinos = fichaId === null ? [] : await db.treinos.where('fichaId').equals(fichaId).toArray()
    await db.programacoes.add(snapshotProgramacao(ficha || null, treinos, motivo))
  }
  const ativarFicha = async (id: number) => {
    const ficha = await db.fichas.get(id)
    if (!ficha) return { ok: false as const, sessaoAtiva: false as const }
    if ((await db.treinos.where('fichaId').equals(id).count()) === 0) return { ok: false as const, sessaoAtiva: false as const }
    let sessaoAtiva = false
    await db.transaction('rw', db.configuracoes, db.programacoes, db.historico, db.fichas, db.treinos, async () => {
      // A sessão e a troca disputam o mesmo escopo transacional do histórico.
      const sessao = await db.historico.where('estado').equals('em_andamento').first()
      if (sessao) { sessaoAtiva = true; return }
      const anterior = await db.configuracoes.get('principal')
      if (anterior?.fichaAtivaId === id) return
      const config: ConfiguracaoApp = { chave: 'principal', fichaAtivaId: id }
      await db.configuracoes.put(config)
      const treinos = await db.treinos.where('fichaId').equals(id).toArray()
      await db.programacoes.add(snapshotProgramacao(ficha, treinos, anterior?.fichaAtivaId == null ? 'ativacao' : 'troca'))
    })
    if (sessaoAtiva) return { ok: false as const, sessaoAtiva: true as const }
    await carregarDados()
    return { ok: true as const, sessaoAtiva: false as const }
  }
  const ativarFichaAposSessao = async (id: number) => {
    const sessao = await db.historico.where('estado').equals('em_andamento').first()
    if (sessao) return false
    return (await ativarFicha(id)).ok
  }
  const excluirFicha = async (ficha: FichaCompleta) => {
    if (ficha.id == null) return false
    const sessao = await db.historico.where('estado').equals('em_andamento').first()
    if (sessao?.fichaId === ficha.id) throw new Error('Finalize ou cancele a sessão em andamento antes de excluir esta ficha.')
    await db.transaction('rw', db.fichas, db.treinos, db.configuracoes, db.programacoes, async () => {
      const config = await db.configuracoes.get('principal')
      if (config?.fichaAtivaId === ficha.id) {
        await db.configuracoes.put({ chave: 'principal', fichaAtivaId: null })
        await db.programacoes.add(snapshotProgramacao(null, [], 'desativacao'))
      }
      await db.treinos.where('fichaId').equals(ficha.id!).delete()
      await db.fichas.delete(ficha.id!)
    })
    fichaSelecionada.value = null
    modo.value = 'lista'
    await carregarDados()
    return true
  }
  const duplicarFicha = async (ficha: FichaCompleta) => {
    await db.transaction('rw', db.fichas, db.treinos, async () => {
      const agora = new Date()
      const id = await db.fichas.add({ nome: `${ficha.nome} (cópia)`, foco: ficha.foco, descricao: ficha.descricao, corTema: ficha.corTema, origem: 'local', criadoEm: agora, atualizadoEm: agora })
      for (const treino of ficha.treinos) await db.treinos.add({ ...treino, id: undefined, fichaId: id, exercicios: treino.exercicios.map(ex => ({ ...ex, substitutosIds: [...ex.substitutosIds] })), criadoEm: agora, atualizadoEm: agora })
    })
    await carregarDados()
    feedback.success('Ficha duplicada com sucesso!')
  }
  const deletarFichaSelecionada = async () => { if (fichaSelecionada.value) await excluirFicha(fichaSelecionada.value) }
  const editarFichaSelecionada = () => abrirEdicaoFicha()
  const toggleExercicio = (exCatalogo: ExercicioCatalogo) => {
    if (exCatalogo.id == null) return
    const lista = treinoEditando.value.exercicios
    const index = lista.findIndex(ex => ex.exercicioId === exCatalogo.id)
    if (index >= 0) lista.splice(index, 1)
    else lista.push({ exercicioId: exCatalogo.id, ordem: lista.length + 1, series: exCatalogo.defaultSeries, repsAlvo: exCatalogo.defaultReps, taxaAumentoKg: 0, descansoSegundos: 60, pesoBaseAtual: 10, substitutosIds: [] })
  }
  const removerExercicioDaFicha = (index: number) => treinoEditando.value.exercicios.splice(index, 1)
  const aplicarDescansoGlobal = () => treinoEditando.value.exercicios.forEach(ex => { ex.descansoSegundos = descansoGlobal.value })
  const salvarFicha = async () => {
    if (salvando.value) return
    salvando.value = true
    erroSalvamento.value = ''
    try {
      if (contextoWizard.value === 'nova-ficha' || contextoWizard.value === 'editar-ficha') {
        if (!(await persistirDadosFicha())) return
        if (contextoWizard.value === 'nova-ficha') { prepararNovoTreino(); modo.value = 'treino-info' }
        else { fichaSelecionada.value = fichaAtivaLocalizada(); modo.value = 'detalhe' }
      } else {
        await salvarDadosTreino()
      }
    } catch (error) {
      erroSalvamento.value = error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.'
      feedback.error(contextoWizard.value === 'novo-treino' || contextoWizard.value === 'editar-treino'
        ? 'Não foi possível salvar o treino. Confira os detalhes no formulário.'
        : 'Não foi possível salvar a ficha. Confira os detalhes no formulário.')
    } finally { salvando.value = false }
  }
  const salvarNovoExercicio = async () => {
    if (criandoExercicio.value) return
    erroExercicio.value = ''
    if (!novoEx.value.nome.trim()) { erroExercicio.value = 'Dê um nome para o exercício.'; return }
    criandoExercicio.value = true
    const urlFinal = novoEx.value.videoUrl || `https://www.youtube.com/results?search_query=execucao+${encodeURIComponent(novoEx.value.nome.trim())}`
    try {
      const novo: ExercicioCatalogo = { ...novoEx.value, nome: novoEx.value.nome.trim(), videoUrl: urlFinal }
      const id = await db.catalogo.add(novo)
      catalogo.value = await db.catalogo.toArray()
      toggleExercicio({ ...novo, id })
      termoBusca.value = ''
      modalCriarExAberto.value = false
      feedback.success('Exercício criado com sucesso!')
      novoEx.value = { nome: '', grupoMuscular: 'Peito', equipamento: 'Halter', videoUrl: '', defaultSeries: 3, defaultReps: '10-12' }
    } catch (error) { console.error('Erro ao criar exercício', error); erroExercicio.value = 'Não foi possível criar o exercício. Tente novamente.' }
    finally { criandoExercicio.value = false }
  }

  return {
    criandoExercicio, erroExercicio, salvando, erroSalvamento, modo, contextoWizard, fichasSalvas, fichaAtivaId, fichaAtual, fichasBiblioteca, catalogo, termoBusca, descansoGlobal,
    modalCriarExAberto, fichaSelecionada, filtroOrigem, paletaCores, fichaEditando, treinoEditando, novoEx, diasOcupados,
    corEstaEmUso, getCorObj, exerciciosAgrupados, resultadosBusca, isExercicioSelecionado,
    carregarDados, abrirNovaFicha, abrirDetalhes, voltar, abrirEdicaoFicha, continuarParaTreinos, adicionarTreino, editarTreino,
    ativarFicha, ativarFichaAposSessao, excluirFicha, duplicarFicha, deletarFichaSelecionada, editarFichaSelecionada,
    toggleExercicio, removerExercicioDaFicha, aplicarDescansoGlobal, salvarFicha, salvarNovoExercicio
  }
})
