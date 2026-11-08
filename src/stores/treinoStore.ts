import { feedback } from '@/composables/useFeedback'
import { confirmation } from '@/composables/useConfirm'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { db, type Ficha, type Treino, type ExercicioCatalogo, type ExercicioRealizado, type HistoricoTreino } from '@/database/db'
import { obterTreinoDoDia } from '@/utils/programacao'

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
  ordem: number;
  seriesTotais: number;
  repsAlvo: string;
  pesoBasePlanejado: number;
  taxaAumentoKg: number;
  temDescanso: boolean;
  descansoSegundos: number;
  concluido: boolean;
  seriesRealizadas: SerieExecucao[];
}

type EstadoSessao = NonNullable<HistoricoTreino['estado']>
type TreinoDoDia = Treino & { corTema: string; fichaNome: string }

const TEMPO_DEBOUNCE_SALVAMENTO = 300

export const useTreinoStore = defineStore('treino', () => {
  const estadoAtual = ref<'preview' | 'execucao' | 'concluido'>('preview')
  const fichasSalvas = ref<TreinoDoDia[]>([])
  const catalogo = ref<ExercicioCatalogo[]>([])

  const fichaAtual = ref<Ficha | null>(null)
  const treinoHoje = ref<TreinoDoDia | null>(null)
  const treinoAmanha = ref<TreinoDoDia | null>(null)
  const treinoFinalizadoHoje = ref(false)

  const exerciciosExecucao = ref<ExercicioExecucao[]>([])
  const exercicioExpandido = ref<string | null>(null)

  const sessaoId = ref<number | null>(null)
  const sessaoDataInicio = ref<Date | null>(null)
  const sessaoEstado = ref<EstadoSessao | null>(null)
  const estadoPersistencia = ref<'salvando' | 'salvo' | 'erro'>('salvo')
  const erroPersistencia = ref<string | null>(null)
  const segundosTreino = ref(0)
  let intervaloCronometro: ReturnType<typeof setInterval> | null = null
  let timeoutSalvamento: ReturnType<typeof setTimeout> | null = null
  let filaPersistencia: Promise<boolean> = Promise.resolve(true)
  let criacaoSessaoPendente: Promise<boolean> | null = null

  const descansoTempoRestante = ref(0)
  const descansoRodando = ref(false)
  const descansoZerado = ref(false)
  let intervaloDescanso: ReturnType<typeof setInterval> | null = null

  const modalTrocaAberto = ref(false)
  const modalVideoAberto = ref(false)
  const videoUrlAtivo = ref('')
  const videoTituloAtivo = ref('')

  const carregarTreinoDoDia = async () => {
    try {
      erroPersistencia.value = null
      estadoPersistencia.value = 'salvo'
      const config = await db.configuracoes.get('principal')
      fichaAtual.value = config?.fichaAtivaId == null ? null : await db.fichas.get(config.fichaAtivaId) || null
      const treinosAtuais = fichaAtual.value?.id ? await db.treinos.where('fichaId').equals(fichaAtual.value.id).toArray() : []
      fichasSalvas.value = treinosAtuais.sort((a, b) => a.ordem - b.ordem).map(treino => ({ ...treino, corTema: treino.corTema || fichaAtual.value!.corTema || 'cerulean', fichaNome: fichaAtual.value!.nome }))
      catalogo.value = await db.catalogo.toArray()
      const hoje = new Date().getDay()
      const amanha = (hoje + 1) % 7
      treinoHoje.value = fichaAtual.value ? obterTreinoDoDia(fichasSalvas.value, hoje) : null
      treinoAmanha.value = fichaAtual.value ? obterTreinoDoDia(fichasSalvas.value, amanha) : null

      const sessaoAtiva = await buscarSessaoAtiva()
      if (sessaoAtiva) {
        restaurarSessao(sessaoAtiva)
      } else if (sessaoEstado.value !== 'finalizado') {
        estadoAtual.value = 'preview'
        sessaoId.value = null
        sessaoDataInicio.value = null
        sessaoEstado.value = null
        exerciciosExecucao.value = []
        pararCronometro()
        segundosTreino.value = 0
      }
    } catch (error) {
      console.error('Não foi possível carregar os dados do treino:', error)
      erroPersistencia.value = 'Não foi possível carregar o treino salvo. Tente novamente.'
      estadoPersistencia.value = 'erro'
    }
  }

  const calcularSegundosDecorridos = () => {
    if (!sessaoDataInicio.value) return 0
    return Math.max(0, Math.floor((Date.now() - sessaoDataInicio.value.getTime()) / 1000))
  }

  const atualizarCronometro = () => {
    segundosTreino.value = calcularSegundosDecorridos()
  }

  const iniciarCronometro = () => {
    pararCronometro()
    atualizarCronometro()
    intervaloCronometro = setInterval(atualizarCronometro, 1000)
  }

  const pararCronometro = () => {
    if (intervaloCronometro) clearInterval(intervaloCronometro)
    intervaloCronometro = null
  }

  const cronometroFormatado = computed(() => {
    const min = Math.floor(segundosTreino.value / 60).toString().padStart(2, '0')
    const seg = (segundosTreino.value % 60).toString().padStart(2, '0')
    return `${min}:${seg}`
  })

  const buscarSessaoAtiva = async () => db.historico
    .where('estado')
    .equals('em_andamento')
    .first()

  const criarRegistroSessao = (estado: EstadoSessao = 'em_andamento'): Omit<HistoricoTreino, 'id'> => {
    if (!treinoHoje.value?.id || !sessaoDataInicio.value) {
      throw new Error('A ficha ou o horário de início da sessão não está disponível.')
    }

    return {
      fichaId: treinoHoje.value.fichaId,
      treinoId: treinoHoje.value.id ?? null,
      fichaNome: treinoHoje.value.fichaNome,
      treinoNome: treinoHoje.value.nome,
      fichaFoco: treinoHoje.value.foco,
      fichaCorTema: treinoHoje.value.corTema,
      dataInicio: new Date(sessaoDataInicio.value),
      ...(estado === 'em_andamento' ? {} : { dataFim: new Date() }),
      estado,
      duracaoMinutos: calcularSegundosDecorridos() / 60,
      exerciciosRealizados: exerciciosExecucao.value.map((ex, index): ExercicioRealizado => ({
        exercicioId: ex.exercicioId,
        nome: ex.nome,
        grupoMuscular: ex.grupoMuscular,
        videoUrl: ex.videoUrl,
        ordem: ex.ordem ?? index + 1,
        seriesPlanejadas: ex.seriesTotais,
        repsAlvo: ex.repsAlvo,
        pesoBasePlanejado: ex.pesoBasePlanejado,
        taxaAumentoKg: ex.taxaAumentoKg,
        temDescanso: ex.temDescanso,
        descansoSegundos: ex.descansoSegundos,
        seriesRealizadas: ex.seriesRealizadas.map(serie => ({
          numeroDaSerie: serie.numero,
          peso: Number(serie.pesoFito) || 0,
          reps: serie.repsFeitas,
          finalizada: serie.finalizada
        }))
      }))
    }
  }

  const mostrarFalhaPersistencia = (error: unknown) => {
    console.error('Erro ao salvar a sessão de treino:', error)
    if (estadoPersistencia.value !== 'erro') feedback.error('Não foi possível salvar a sessão. Confira o aviso no treino.')
    estadoPersistencia.value = 'erro'
    erroPersistencia.value = 'Não foi possível salvar suas alterações. Mantenha o aplicativo aberto e tente novamente.'
  }

  const persistirNovaSessao = () => {
    if (criacaoSessaoPendente) return criacaoSessaoPendente

    const criacao = (async () => {
      try {
        const registro = criarRegistroSessao()
        const id = await db.transaction('rw', db.historico, async () => {
          const existente = await buscarSessaoAtiva()
          if (existente) throw new Error('Já existe outra sessão de treino em andamento.')
          return db.historico.add(registro)
        })
        sessaoId.value = id
        estadoPersistencia.value = 'salvo'
        erroPersistencia.value = null
        return true
      } catch (error) {
        const existente = await buscarSessaoAtiva().catch(() => undefined)
        if (existente) {
          restaurarSessao(existente)
          return false
        }
        mostrarFalhaPersistencia(error)
        return false
      }
    })()

    criacaoSessaoPendente = criacao
    void criacao.finally(() => {
      if (criacaoSessaoPendente === criacao) criacaoSessaoPendente = null
    })
    return criacao
  }

  const persistirSessaoAgora = () => {
    if (timeoutSalvamento) clearTimeout(timeoutSalvamento)
    timeoutSalvamento = null

    if (sessaoEstado.value !== 'em_andamento') return Promise.resolve(false)
    if (sessaoId.value === null) return persistirNovaSessao()

    const id = sessaoId.value
    const registro = criarRegistroSessao()
    estadoPersistencia.value = 'salvando'
    erroPersistencia.value = null

    filaPersistencia = filaPersistencia.then(async () => {
      try {
        const atualizado = await db.historico.update(id, registro)
        if (!atualizado) throw new Error('A sessão não foi encontrada no banco local.')
        estadoPersistencia.value = 'salvo'
        erroPersistencia.value = null
        return true
      } catch (error) {
        mostrarFalhaPersistencia(error)
        return false
      }
    })

    return filaPersistencia
  }

  const agendarSalvamento = () => {
    if (sessaoEstado.value !== 'em_andamento') return
    estadoPersistencia.value = 'salvando'
    if (timeoutSalvamento) clearTimeout(timeoutSalvamento)
    timeoutSalvamento = setTimeout(() => {
      void persistirSessaoAgora()
    }, TEMPO_DEBOUNCE_SALVAMENTO)
  }

  watch(exerciciosExecucao, agendarSalvamento, { deep: true })

  const exerciciosDaFicha = (ficha: TreinoDoDia): ExercicioExecucao[] => ficha.exercicios.map((ex, index) => {
    const cat = catalogo.value.find(c => c.id === ex.exercicioId)
    const seriesTotais = Math.max(0, Math.floor(Number(ex.series) || 0))
    const pesoBasePlanejado = Number(ex.pesoBaseAtual) || 0
    const taxaAumentoKg = Number(ex.taxaAumentoKg) || 0

    return {
      idUnico: `ex_${index}`,
      exercicioId: ex.exercicioId,
      nome: cat?.nome || 'Exercício desconhecido',
      grupoMuscular: cat?.grupoMuscular || 'Geral',
      videoUrl: cat?.videoUrl,
      ordem: ex.ordem || index + 1,
      seriesTotais,
      repsAlvo: ex.repsAlvo,
      pesoBasePlanejado,
      taxaAumentoKg,
      temDescanso: (ex as typeof ex & { temDescanso?: boolean }).temDescanso !== false,
      descansoSegundos: ex.descansoSegundos || 60,
      concluido: false,
      seriesRealizadas: Array.from({ length: seriesTotais }, (_, serieIndex) => ({
        numero: serieIndex + 1,
        pesoFito: pesoBasePlanejado + (serieIndex * taxaAumentoKg),
        repsFeitas: ex.repsAlvo.split('-')[0],
        finalizada: false
      }))
    }
  })

  const fichaDoSnapshot = (sessao: HistoricoTreino): TreinoDoDia => ({
    id: sessao.treinoId ?? undefined,
    fichaId: sessao.fichaId ?? 0,
    nome: sessao.treinoNome || 'Treino salvo',
    foco: sessao.fichaFoco || '',
    corTema: sessao.fichaCorTema || 'cerulean',
    fichaNome: sessao.fichaNome || 'Ficha salva',
    ordem: 1,
    diasDaSemana: [],
    criadoEm: sessao.dataInicio || new Date(),
    atualizadoEm: sessao.dataInicio || new Date(),
    exercicios: sessao.exerciciosRealizados.map((ex, index) => ({
      exercicioId: ex.exercicioId, ordem: ex.ordem ?? index + 1,
      series: ex.seriesPlanejadas ?? ex.seriesRealizadas.length, repsAlvo: ex.repsAlvo || '',
      taxaAumentoKg: ex.taxaAumentoKg ?? 0, descansoSegundos: ex.descansoSegundos ?? 60,
      pesoBaseAtual: ex.pesoBasePlanejado ?? 0, substitutosIds: []
    }))
  })

  const restaurarSessao = (sessao: HistoricoTreino) => {
    if (sessao.id === undefined || sessao.estado !== 'em_andamento') return

    sessaoId.value = sessao.id
    sessaoDataInicio.value = sessao.dataInicio ? new Date(sessao.dataInicio) : new Date()
    sessaoEstado.value = 'em_andamento'
    treinoHoje.value = fichaDoSnapshot(sessao)
    exerciciosExecucao.value = sessao.exerciciosRealizados.map((ex, index) => {
      const series = ex.seriesRealizadas.map(serie => ({
        numero: serie.numeroDaSerie,
        pesoFito: Number(serie.peso) || 0,
        repsFeitas: String(serie.reps),
        finalizada: serie.finalizada === true
      }))

      return {
        idUnico: `ex_${index}`,
        exercicioId: ex.exercicioId,
        nome: ex.nome || catalogo.value.find(cat => cat.id === ex.exercicioId)?.nome || 'Exercício desconhecido',
        grupoMuscular: ex.grupoMuscular || catalogo.value.find(cat => cat.id === ex.exercicioId)?.grupoMuscular || 'Geral',
        videoUrl: ex.videoUrl || catalogo.value.find(cat => cat.id === ex.exercicioId)?.videoUrl,
        ordem: ex.ordem ?? index + 1,
        seriesTotais: ex.seriesPlanejadas ?? series.length,
        repsAlvo: ex.repsAlvo || '',
        pesoBasePlanejado: ex.pesoBasePlanejado ?? 0,
        taxaAumentoKg: ex.taxaAumentoKg ?? 0,
        temDescanso: ex.temDescanso !== false,
        descansoSegundos: ex.descansoSegundos ?? 60,
        concluido: series.length > 0 && series.every(serie => serie.finalizada),
        seriesRealizadas: series
      }
    })
    exercicioExpandido.value = exerciciosExecucao.value.find(ex => !ex.concluido)?.idUnico || null
    treinoFinalizadoHoje.value = false
    estadoAtual.value = 'execucao'
    estadoPersistencia.value = 'salvo'
    erroPersistencia.value = null
    iniciarCronometro()
  }

  const cancelarSessao = async (sessao: HistoricoTreino) => {
    if (sessao.id === undefined) return false

    if (sessao.id === sessaoId.value && !(await persistirSessaoAgora())) return false

    try {
      await db.transaction('rw', db.historico, async () => {
        const atual = await db.historico.get(sessao.id!)
        if (!atual || atual.estado !== 'em_andamento') return
        await db.historico.update(sessao.id!, {
          estado: 'cancelado',
          dataFim: new Date(),
          duracaoMinutos: Math.max(0, ((Date.now() - new Date(atual.dataInicio || Date.now()).getTime()) / 60000))
        })
      })
      return true
    } catch (error) {
      mostrarFalhaPersistencia(error)
      return false
    }
  }

  const iniciarTreino = async (fichaSolicitada?: TreinoDoDia) => {
    const ficha = fichaSolicitada || treinoHoje.value
    if (!ficha) return false

    let sessaoAtiva: HistoricoTreino | undefined
    try {
      sessaoAtiva = await buscarSessaoAtiva()
    } catch (error) {
      mostrarFalhaPersistencia(error)
      return false
    }

    if (sessaoAtiva) {
      if (sessaoAtiva.id === sessaoId.value) {
        restaurarSessao(sessaoAtiva)
        return true
      }

      const descartar = await confirmation.ask({
        title: 'Cancelar treino em andamento?',
        message: 'O treino será cancelado e não contará como sessão concluída.',
        details: 'Depois do cancelamento, o novo treino será iniciado.', variant: 'error', icon: 'warning',
        cancelText: 'Continuar treino', confirmText: 'Cancelar treino', action: () => cancelarSessao(sessaoAtiva!)
      })
      if (!descartar) {
        restaurarSessao(sessaoAtiva)
        return false
      }
      feedback.info('Treino anterior cancelado.')
    }

    if (!ficha.id || !ficha.fichaId) {
      erroPersistencia.value = 'Não foi possível iniciar: salve a ficha antes de começar o treino.'
      estadoPersistencia.value = 'erro'
      return false
    }

    treinoFinalizadoHoje.value = false
    treinoHoje.value = ficha
    exerciciosExecucao.value = exerciciosDaFicha(ficha)
    exercicioExpandido.value = exerciciosExecucao.value[0]?.idUnico || null
    sessaoId.value = null
    sessaoDataInicio.value = new Date()
    sessaoEstado.value = 'em_andamento'
    estadoAtual.value = 'execucao'
    estadoPersistencia.value = 'salvando'
    erroPersistencia.value = null
    iniciarCronometro()

    return await persistirNovaSessao()
  }

  const tentarSalvarNovamente = async () => {
    if (sessaoEstado.value !== 'em_andamento') return false
    return sessaoId.value === null ? persistirNovaSessao() : persistirSessaoAgora()
  }

  const atualizarPesoSequencial = (idUnico: string, serieModificadaIndex: number) => {
    const ex = exerciciosExecucao.value.find(e => e.idUnico === idUnico)
    const serieModificada = ex?.seriesRealizadas[serieModificadaIndex]
    if (!ex || !serieModificada || !ex.taxaAumentoKg) return
    const pesoBaseModificado = Number(serieModificada.pesoFito) || 0
    const taxa = Number(ex.taxaAumentoKg) || 0
    ex.seriesRealizadas.forEach((serie, index) => {
      if (index > serieModificadaIndex) {
        serie.pesoFito = Math.round((pesoBaseModificado + ((index - serieModificadaIndex) * taxa)) * 100) / 100
      }
    })
  }

  const iniciarDescanso = (segundos: number) => {
    if (intervaloDescanso) clearInterval(intervaloDescanso)
    descansoTempoRestante.value = segundos
    descansoRodando.value = true
    descansoZerado.value = false

    intervaloDescanso = setInterval(() => {
      descansoTempoRestante.value--
      if (descansoTempoRestante.value <= 0) {
        if (intervaloDescanso) clearInterval(intervaloDescanso)
        intervaloDescanso = null
        descansoRodando.value = false
        descansoZerado.value = true
        setTimeout(() => { descansoZerado.value = false }, 6000)
      }
    }, 1000)
  }

  const pularDescanso = () => {
    if (intervaloDescanso) clearInterval(intervaloDescanso)
    intervaloDescanso = null
    descansoRodando.value = false
    descansoZerado.value = false
  }

  const concluirSerie = (idUnico: string, serieIndex: number) => {
    const ex = exerciciosExecucao.value.find(e => e.idUnico === idUnico)
    const serieAtual = ex?.seriesRealizadas[serieIndex]
    if (!ex || !serieAtual) return

    if (!serieAtual.finalizada) {
      if (serieIndex > 0 && !ex.seriesRealizadas[serieIndex - 1].finalizada) {
        feedback.warning('Complete a série anterior antes de avançar!')
        return
      }
      serieAtual.finalizada = true
      if (ex.temDescanso && ex.descansoSegundos > 0) iniciarDescanso(ex.descansoSegundos)
    } else {
      for (let index = serieIndex; index < ex.seriesRealizadas.length; index++) {
        ex.seriesRealizadas[index].finalizada = false
      }
      pularDescanso()
    }

    ex.concluido = ex.seriesRealizadas.length > 0 && ex.seriesRealizadas.every(serie => serie.finalizada)
    if (ex.concluido) setTimeout(() => autoExpandirProximo(idUnico), 400)
  }

  const concluirTodasSeries = (idUnico: string) => {
    const ex = exerciciosExecucao.value.find(e => e.idUnico === idUnico)
    if (ex) {
      ex.seriesRealizadas.forEach(serie => { serie.finalizada = true })
      ex.concluido = ex.seriesRealizadas.length > 0
      pularDescanso()
      setTimeout(() => autoExpandirProximo(idUnico), 400)
    }
  }

  const resetarExercicio = (idUnico: string) => {
    const ex = exerciciosExecucao.value.find(e => e.idUnico === idUnico)
    if (ex) {
      ex.seriesRealizadas.forEach(serie => { serie.finalizada = false })
      ex.concluido = false
      pularDescanso()
    }
  }

  const autoExpandirProximo = (atualIdUnico: string) => {
    const indexAtual = exerciciosExecucao.value.findIndex(ex => ex.idUnico === atualIdUnico)
    const proximo = exerciciosExecucao.value[indexAtual + 1]
    exercicioExpandido.value = proximo && !proximo.concluido ? proximo.idUnico : null
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

    videoUrlAtivo.value = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url
    modalVideoAberto.value = true
  }

  const finalizando = ref(false)
  const finalizarTreino = async () => {
    if (finalizando.value) return false
    finalizando.value = true
    try { return await executarFinalizacao() } finally { finalizando.value = false }
  }
  const executarFinalizacao = async () => {
    if (sessaoEstado.value === 'finalizado') {
      estadoAtual.value = 'concluido'
      treinoFinalizadoHoje.value = true
      return true
    }
    if (sessaoEstado.value !== 'em_andamento' || exerciciosExecucao.value.some(ex => !ex.concluido)) return false

    if (!(await persistirSessaoAgora()) || sessaoId.value === null) return false
    atualizarCronometro()

    try {
      const id = sessaoId.value
      await db.transaction('rw', db.historico, async () => {
        const atual = await db.historico.get(id)
        if (!atual) throw new Error('A sessão não foi encontrada no banco local.')
        if (atual.estado === 'finalizado') return
        if (atual.estado !== 'em_andamento') throw new Error('A sessão não está mais em andamento.')

        await db.historico.update(id, {
          ...criarRegistroSessao('finalizado'),
          dataFim: new Date(),
          duracaoMinutos: calcularSegundosDecorridos() / 60,
          estado: 'finalizado'
        })
      })

      pararCronometro()
      pularDescanso()
      sessaoEstado.value = 'finalizado'
      estadoPersistencia.value = 'salvo'
      erroPersistencia.value = null
      estadoAtual.value = 'concluido'
      treinoFinalizadoHoje.value = true
      feedback.success('Treino concluído! Sessão salva no histórico.')
      return true
    } catch (error) {
      mostrarFalhaPersistencia(error)
      return false
    }
  }

  const efetuarTrocaTreino = (treinoEscolhido: TreinoDoDia) => {
    treinoHoje.value = treinoEscolhido
    modalTrocaAberto.value = false
  }

  const progressoTreino = computed(() => {
    const total = exerciciosExecucao.value.length
    if (total === 0) return { concluidos: 0, total: 0, porcentagem: 0 }
    const concluidos = exerciciosExecucao.value.filter(ex => ex.concluido).length
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
    return paletaCores.find(cor => cor.id === idCor) || paletaCores[1]
  }

  return {
    finalizando, estadoAtual, fichasSalvas, fichaAtual, treinoHoje, treinoAmanha, treinoFinalizadoHoje, exerciciosExecucao, exercicioExpandido,
    sessaoId, sessaoEstado, estadoPersistencia, erroPersistencia,
    cronometroFormatado, progressoTreino, modalTrocaAberto, modalVideoAberto, videoUrlAtivo, videoTituloAtivo,
    descansoTempoRestante, descansoRodando, descansoZerado,
    carregarTreinoDoDia, iniciarTreino, finalizarTreino, efetuarTrocaTreino, getCorObj,
    concluirSerie, concluirTodasSeries, resetarExercicio, atualizarPesoSequencial, abrirVideo, pularDescanso,
    tentarSalvarNovamente, persistirSessaoAgora
  }
})
