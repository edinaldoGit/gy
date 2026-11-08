import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, type Ficha, type ExercicioCatalogo } from '@/database/db'

export const useFichaStore = defineStore('ficha', () => {
  const modo = ref<'lista' | 'step1' | 'step2' | 'step3'>('lista')
  const fichasSalvas = ref<Ficha[]>([])
  const catalogo = ref<ExercicioCatalogo[]>([])
  const termoBusca = ref('')
  const descansoGlobal = ref(60)
  
  const modalCriarExAberto = ref(false)
  const modalDetalhesAberto = ref(false)
  const fichaSelecionada = ref<Ficha | null>(null) 

  const paletaCores = [
    { id: 'amethyst', bg: 'bg-amethyst-500', text: 'text-amethyst-500', light: 'bg-amethyst-50' },
    { id: 'cerulean', bg: 'bg-cerulean-500', text: 'text-cerulean-500', light: 'bg-cerulean-50' },
    { id: 'teal', bg: 'bg-teal-500', text: 'text-teal-500', light: 'bg-teal-50' },
    { id: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50' }, 
    { id: 'bubblegum', bg: 'bg-bubblegum-500', text: 'text-bubblegum-500', light: 'bg-bubblegum-50' },
    { id: 'orange', bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50' }, 
    { id: 'rose', bg: 'bg-rose-500', text: 'text-rose-500', light: 'bg-rose-50' } 
  ]

  const fichaEditando = ref<Partial<Ficha>>({
    nome: '', foco: '', corTema: 'cerulean', diasDaSemana: [], exercicios: []
  })

  const novoEx = ref({
    nome: '', grupoMuscular: 'Peito', equipamento: 'Halter', videoUrl: '', defaultSeries: 3, defaultReps: '10-12'
  })
  
  const diasOcupados = computed(() => {
    const ocupados = new Set<number>()
    fichasSalvas.value.forEach(f => {
      if (f.id !== fichaEditando.value.id && f.diasDaSemana) {
        f.diasDaSemana.forEach(d => ocupados.add(d))
      }
    })
    return Array.from(ocupados)
  })

  const corEstaEmUso = (idCor: string) => fichasSalvas.value.some(f => f.corTema === idCor && f.id !== fichaEditando.value.id)
  const getCorObj = (idCor: string) => paletaCores.find(c => c.id === idCor) || paletaCores[1]

  const exerciciosAgrupados = computed(() => {
    const grupos: Record<string, ExercicioCatalogo[]> = {}
    catalogo.value.forEach(ex => {
      if (!grupos[ex.grupoMuscular]) grupos[ex.grupoMuscular] = []
      grupos[ex.grupoMuscular].push(ex)
    })
    return grupos
  })

  const resultadosBusca = computed(() => {
    const termo = termoBusca.value.toLowerCase()
    return catalogo.value.filter(ex => 
      ex.nome.toLowerCase().includes(termo) || ex.grupoMuscular.toLowerCase().includes(termo)
    )
  })

  const isExercicioSelecionado = (id: number) => fichaEditando.value.exercicios?.some(e => e.exercicioId === id)

  // --- ACTIONS BÁSICAS ---
  const carregarDados = async () => {
    fichasSalvas.value = await db.fichas.toArray()
    catalogo.value = await db.catalogo.toArray()
  }

  const abrirNovaFicha = (diaPreSelecionado?: number) => {
    const primeiraCorLivre = paletaCores.find(c => !corEstaEmUso(c.id))?.id || paletaCores[0].id
    fichaEditando.value = { 
      nome: '', foco: '', corTema: primeiraCorLivre, 
      diasDaSemana: typeof diaPreSelecionado === 'number' ? [diaPreSelecionado] : [], 
      exercicios: [] 
    }
    modo.value = 'step1'
  }

  const voltar = () => {
    if (modo.value === 'step3') modo.value = 'step2'
    else if (modo.value === 'step2') modo.value = 'step1'
    else { modo.value = 'lista'; carregarDados() }
  }

  const abrirDetalhes = (ficha: Ficha) => {
    fichaSelecionada.value = ficha
    modalDetalhesAberto.value = true
  }

  const deletarFichaSelecionada = async () => {
    if (fichaSelecionada.value?.id) {
      await db.fichas.delete(fichaSelecionada.value.id)
      modalDetalhesAberto.value = false
      await carregarDados()
    }
  }

  const editarFichaSelecionada = () => {
    if (!fichaSelecionada.value) return
    const exerciciosRemontados = fichaSelecionada.value.exercicios.map(ex => {
      const cat = catalogo.value.find(c => c.id === ex.exercicioId)
      return {
        ...ex, _nomeDisplay: cat?.nome || 'Exercício Desconhecido', _grupoDisplay: cat?.grupoMuscular || 'Outro'
      }
    })
    fichaEditando.value = { 
      id: fichaSelecionada.value.id, nome: fichaSelecionada.value.nome, foco: fichaSelecionada.value.foco,
      corTema: fichaSelecionada.value.corTema, diasDaSemana: JSON.parse(JSON.stringify(fichaSelecionada.value.diasDaSemana || [])),
      criadoEm: fichaSelecionada.value.criadoEm, exercicios: exerciciosRemontados 
    }
    modalDetalhesAberto.value = false
    modo.value = 'step1'
  }

  const toggleExercicio = (exCatalogo: ExercicioCatalogo) => {
    const lista = fichaEditando.value.exercicios || []
    const index = lista.findIndex(e => e.exercicioId === exCatalogo.id)
    if (index >= 0) lista.splice(index, 1)
    else {
      lista.push({
        exercicioId: exCatalogo.id!, ordem: lista.length + 1, series: exCatalogo.defaultSeries, repsAlvo: exCatalogo.defaultReps, taxaAumentoKg: 0, descansoSegundos: 60, pesoBaseAtual: 10, substitutosIds: [],
        _nomeDisplay: exCatalogo.nome, _grupoDisplay: exCatalogo.grupoMuscular
      } as any)
    }
  }

  const removerExercicioDaFicha = (index: number) => fichaEditando.value.exercicios?.splice(index, 1)

  const aplicarDescansoGlobal = () => {
    if (fichaEditando.value.exercicios) {
      fichaEditando.value.exercicios.forEach(ex => (ex as any).descansoSegundos = descansoGlobal.value)
    }
  }

  const salvarFicha = async () => {
    try {
      const exerciciosMapeados = fichaEditando.value.exercicios!.map(ex => {
        const { _nomeDisplay, _grupoDisplay, ...dadosLimpos } = ex as any
        return dadosLimpos
      })
      const exerciciosPuros = JSON.parse(JSON.stringify(exerciciosMapeados))
      const diasPuros = JSON.parse(JSON.stringify(fichaEditando.value.diasDaSemana || []))

      const novaFicha: Ficha = {
        nome: fichaEditando.value.nome!, foco: fichaEditando.value.foco || 'Geral', corTema: fichaEditando.value.corTema || 'cerulean',
        diasDaSemana: diasPuros, exercicios: exerciciosPuros,
        criadoEm: fichaEditando.value.criadoEm ? new Date(fichaEditando.value.criadoEm) : new Date()
      }
      if (fichaEditando.value.id) novaFicha.id = fichaEditando.value.id

      await db.fichas.put(novaFicha)
      modo.value = 'lista'
      await carregarDados()
    } catch (error) {
      console.error("Erro ao salvar a Ficha:", error)
      alert("Ops! Ocorreu um erro ao salvar o treino. Tente novamente.")
    }
  }

  const salvarNovoExercicio = async () => {
    if (!novoEx.value.nome) return alert('Dê um nome para o exercício!')
    let urlFinal = novoEx.value.videoUrl
    if (!urlFinal) {
      const termoBuscaYt = novoEx.value.nome.trim().toLowerCase().replace(/\s+/g, '+')
      urlFinal = `https://www.youtube.com/results?search_query=execucao+${termoBuscaYt}`
    }

    const exercicioCriado: ExercicioCatalogo = {
      nome: novoEx.value.nome,
      grupoMuscular: novoEx.value.grupoMuscular,
      equipamento: novoEx.value.equipamento,
      videoUrl: urlFinal,
      defaultSeries: novoEx.value.defaultSeries,
      defaultReps: novoEx.value.defaultReps
    }

    try {
      const id = await db.catalogo.add(exercicioCriado)
      exercicioCriado.id = id 
      catalogo.value = await db.catalogo.toArray()
      toggleExercicio(exercicioCriado)
      termoBusca.value = ''
      modalCriarExAberto.value = false
      novoEx.value = { nome: '', grupoMuscular: 'Peito', equipamento: 'Halter', videoUrl: '', defaultSeries: 3, defaultReps: '10-12' }
    } catch (error) {
      console.error("Erro ao criar exercício", error)
      alert("Erro ao criar exercício.")
    }
  }

  return {
    modo, fichasSalvas, catalogo, termoBusca, descansoGlobal, modalCriarExAberto, modalDetalhesAberto, fichaSelecionada, paletaCores, fichaEditando, novoEx, diasOcupados,
    corEstaEmUso, getCorObj, exerciciosAgrupados, resultadosBusca, isExercicioSelecionado,
    carregarDados, abrirNovaFicha, voltar, abrirDetalhes, deletarFichaSelecionada, editarFichaSelecionada, toggleExercicio, removerExercicioDaFicha, aplicarDescansoGlobal, salvarFicha, salvarNovoExercicio
  }
})