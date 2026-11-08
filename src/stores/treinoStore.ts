import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, type Ficha, type ExercicioCatalogo } from '@/database/db'

export interface SerieExecucao {
  numero: number;
  pesoFito: number;
  repsFeitas: string;
  finalizada: boolean;
}

export interface ExercicioExecucao {
  idUnico: string;
  exercicioId: number;
  nome: string;
  grupoMuscular: string;
  videoUrl?: string; 
  seriesTotais: number;
  repsAlvo: string;
  taxaAumentoKg: number;
  temDescanso: boolean;
  descansoSegundos: number;
  concluido: boolean;
  seriesRealizadas: SerieExecucao[];
}

export const useTreinoStore = defineStore('treino', () => {
  const estadoAtual = ref<'preview' | 'execucao' | 'concluido'>('preview')
  const fichasSalvas = ref<Ficha[]>([])
  const catalogo = ref<ExercicioCatalogo[]>([])
  
  const treinoHoje = ref<Ficha | null>(null)
  const treinoAmanha = ref<Ficha | null>(null) // Para a prévia do concluído
  const treinoFinalizadoHoje = ref(false) // Flag de sucesso

  const exerciciosExecucao = ref<ExercicioExecucao[]>([])
  const exercicioExpandido = ref<string | null>(null)
  
  const segundosTreino = ref(0)
  let intervaloCronometro: ReturnType<typeof setInterval> | null = null

  // --- ESTADOS DO CRONÔMETRO DE DESCANSO ---
  const descansoTempoRestante = ref(0)
  const descansoRodando = ref(false)
  const descansoZerado = ref(false)
  let intervaloDescanso: ReturnType<typeof setInterval> | null = null

  const modalTrocaAberto = ref(false)
  const modalVideoAberto = ref(false)
  const videoUrlAtivo = ref('')
  const videoTituloAtivo = ref('')

  const carregarTreinoDoDia = async () => {
    fichasSalvas.value = await db.fichas.toArray()
    catalogo.value = await db.catalogo.toArray()

    const hoje = new Date().getDay() 
    const amanha = (hoje + 1) % 7 
    
    // Descobre o treino de hoje
    const fichaHoje = fichasSalvas.value.find(f => f.diasDaSemana?.includes(hoje))
    if (fichaHoje) {
      treinoHoje.value = fichaHoje
    } else {
      treinoHoje.value = fichasSalvas.value.find(f => !f.diasDaSemana || f.diasDaSemana.length === 0) || null
    }

    // Descobre o treino de amanhã
    treinoAmanha.value = fichasSalvas.value.find(f => f.diasDaSemana?.includes(amanha)) || null
  }

  const cronometroFormatado = computed(() => {
    const min = Math.floor(segundosTreino.value / 60).toString().padStart(2, '0')
    const seg = (segundosTreino.value % 60).toString().padStart(2, '0')
    return `${min}:${seg}`
  })

  // --- LÓGICA DO TEMPORIZADOR DE DESCANSO ---
  const iniciarDescanso = (segundos: number) => {
    if (intervaloDescanso) clearInterval(intervaloDescanso)
    descansoTempoRestante.value = segundos
    descansoRodando.value = true
    descansoZerado.value = false

    intervaloDescanso = setInterval(() => {
      descansoTempoRestante.value--
      if (descansoTempoRestante.value <= 0) {
        clearInterval(intervaloDescanso!)
        descansoRodando.value = false
        descansoZerado.value = true
        // O efeito visual de 'BORA' fica por 6 segundos e depois some suavemente
        setTimeout(() => { descansoZerado.value = false }, 6000)
      }
    }, 1000)
  }

  const pularDescanso = () => {
    if (intervaloDescanso) clearInterval(intervaloDescanso)
    descansoRodando.value = false
    descansoZerado.value = false
  }

  const iniciarTreino = () => {
    if (!treinoHoje.value) return
    treinoFinalizadoHoje.value = false
    exerciciosExecucao.value = treinoHoje.value.exercicios.map((ex: any, index) => {
      const cat = catalogo.value.find(c => c.id === ex.exercicioId)
      return {
        idUnico: `ex_${index}`, 
        exercicioId: ex.exercicioId, 
        nome: cat?.nome || 'Desconhecido',
        grupoMuscular: cat?.grupoMuscular || 'Geral', 
        videoUrl: cat?.videoUrl,
        seriesTotais: ex.series, 
        repsAlvo: ex.repsAlvo, 
        taxaAumentoKg: ex.taxaAumentoKg, 
        temDescanso: ex.temDescanso !== false, // Default true se não existir
        descansoSegundos: ex.descansoSegundos || 60,
        concluido: false,
        seriesRealizadas: Array.from({ length: ex.series }).map((_, sIndex) => ({
          numero: sIndex + 1, 
          pesoFito: ex.pesoBaseAtual + (sIndex * ex.taxaAumentoKg),
          repsFeitas: ex.repsAlvo.split('-')[0], 
          finalizada: false
        }))
      }
    })

    if (exerciciosExecucao.value.length > 0) exercicioExpandido.value = exerciciosExecucao.value[0].idUnico
    estadoAtual.value = 'execucao'
    segundosTreino.value = 0
    intervaloCronometro = setInterval(() => segundosTreino.value++, 1000)
  }

  const atualizarPesoSequencial = (idUnico: string, serieModificadaIndex: number) => {
    const ex = exerciciosExecucao.value.find(e => e.idUnico === idUnico)
    if (!ex || !ex.taxaAumentoKg) return
    const pesoBaseModificado = Number(ex.seriesRealizadas[serieModificadaIndex].pesoFito) || 0
    const taxa = Number(ex.taxaAumentoKg) || 0
    ex.seriesRealizadas.forEach((serie, i) => {
      if (i > serieModificadaIndex) {
        const diffIndex = i - serieModificadaIndex
        serie.pesoFito = Math.round((pesoBaseModificado + (diffIndex * taxa)) * 100) / 100
      }
    })
  }

  const concluirSerie = (idUnico: string, serieIndex: number) => {
    const ex = exerciciosExecucao.value.find(e => e.idUnico === idUnico)
    if (!ex) return

    const serieAtual = ex.seriesRealizadas[serieIndex]

    if (!serieAtual.finalizada) {
      if (serieIndex > 0 && !ex.seriesRealizadas[serieIndex - 1].finalizada) {
        alert("Complete a série anterior antes de avançar!")
        return
      }
      serieAtual.finalizada = true
      
      // Dispara o Descanso apenas se não for a última série (opcional) ou se estiver ativado
      if (ex.temDescanso && ex.descansoSegundos > 0) {
        iniciarDescanso(ex.descansoSegundos)
      }

    } else {
      for (let i = serieIndex; i < ex.seriesRealizadas.length; i++) {
        ex.seriesRealizadas[i].finalizada = false
      }
      pularDescanso() // Interrompe descanso se desmarcou
    }

    const todasFinalizadas = ex.seriesRealizadas.every(s => s.finalizada)
    ex.concluido = todasFinalizadas
    if (todasFinalizadas) setTimeout(() => autoExpandirProximo(idUnico), 400)
  }

  const concluirTodasSeries = (idUnico: string) => {
    const ex = exerciciosExecucao.value.find(e => e.idUnico === idUnico)
    if (ex) {
      ex.seriesRealizadas.forEach(s => s.finalizada = true)
      ex.concluido = true
      pularDescanso()
      setTimeout(() => autoExpandirProximo(idUnico), 400)
    }
  }

  const resetarExercicio = (idUnico: string) => {
    const ex = exerciciosExecucao.value.find(e => e.idUnico === idUnico)
    if (ex) {
      ex.seriesRealizadas.forEach(s => s.finalizada = false)
      ex.concluido = false
      pularDescanso()
    }
  }

  const autoExpandirProximo = (atualIdUnico: string) => {
    const indexAtual = exerciciosExecucao.value.findIndex(e => e.idUnico === atualIdUnico)
    const proximo = exerciciosExecucao.value[indexAtual + 1]
    if (proximo && !proximo.concluido) exercicioExpandido.value = proximo.idUnico
    else exercicioExpandido.value = null 
  }

  const abrirVideo = (nome: string, url?: string) => {
    videoTituloAtivo.value = nome
    if (!url || url.trim() === '') {
      const query = encodeURIComponent(`como fazer ${nome}`)
      videoUrlAtivo.value = `https://www.youtube.com/embed?listType=search&list=${query}`
      modalVideoAberto.value = true
      return
    }
    let videoId = ''
    if (url.includes('embed/')) videoId = url.split('embed/')[1]?.split('?')[0]
    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0]
    else if (url.includes('watch?v=')) videoId = url.split('watch?v=')[1]?.split('&')[0]

    if (videoId) videoUrlAtivo.value = `https://www.youtube.com/embed/${videoId}?autoplay=1`
    else videoUrlAtivo.value = url
    modalVideoAberto.value = true
  }

  const finalizarTreino = () => {
    if (intervaloCronometro) clearInterval(intervaloCronometro)
    pularDescanso() // Mata qualquer timer ativo
    estadoAtual.value = 'concluido'
    treinoFinalizadoHoje.value = true
  }

  const efetuarTrocaTreino = async (fichaEscolhida: Ficha, empurrarRotina: boolean) => {
    if (empurrarRotina) {
      const fichasParaAtualizar = fichasSalvas.value.map(f => {
        if (f.diasDaSemana && f.diasDaSemana.length > 0) {
          f.diasDaSemana = f.diasDaSemana.map(d => (d + 1) % 7) 
          return JSON.parse(JSON.stringify(f))
        }
        return null
      }).filter(Boolean) as Ficha[]
      for (const f of fichasParaAtualizar) { await db.fichas.put(f) }
      fichasSalvas.value = await db.fichas.toArray()
    }
    treinoHoje.value = fichaEscolhida
    modalTrocaAberto.value = false
  }

  const progressoTreino = computed(() => {
    const total = exerciciosExecucao.value.length
    if (total === 0) return { concluidos: 0, total: 0, porcentagem: 0 }
    const concluidos = exerciciosExecucao.value.filter(e => e.concluido).length
    return { concluidos, total, porcentagem: Math.round((concluidos / total) * 100) }
  })

  const getCorObj = (idCor: string) => {
    const paletaCores = [
      { id: 'amethyst', bg: 'bg-amethyst-500', text: 'text-amethyst-500', light: 'bg-amethyst-50' },
      { id: 'cerulean', bg: 'bg-cerulean-500', text: 'text-cerulean-500', light: 'bg-cerulean-50' },
      { id: 'teal', bg: 'bg-teal-500', text: 'text-teal-500', light: 'bg-teal-50' },
      { id: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50' }, 
      { id: 'bubblegum', bg: 'bg-bubblegum-500', text: 'text-bubblegum-500', light: 'bg-bubblegum-50' },
      { id: 'orange', bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50' }, 
      { id: 'rose', bg: 'bg-rose-500', text: 'text-rose-500', light: 'bg-rose-50' } 
    ]
    return paletaCores.find(c => c.id === idCor) || paletaCores[1]
  }

  return {
    estadoAtual, fichasSalvas, treinoHoje, treinoAmanha, treinoFinalizadoHoje, exerciciosExecucao, exercicioExpandido, 
    cronometroFormatado, progressoTreino, modalTrocaAberto, modalVideoAberto, videoUrlAtivo, videoTituloAtivo,
    descansoTempoRestante, descansoRodando, descansoZerado,
    carregarTreinoDoDia, iniciarTreino, finalizarTreino, efetuarTrocaTreino, getCorObj,
    concluirSerie, concluirTodasSeries, resetarExercicio, atualizarPesoSequencial, abrirVideo, pularDescanso
  }
})