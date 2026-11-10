import { db, type ConfiguracaoApp, type ExercicioCatalogo, type Ficha, type HistoricoTreino, type MedidaCorporal, type Perfil, type ProgramacaoVigente, type Treino } from '../database/db.ts'

import { identidadeValida, identidadeOficial } from '../utils/identidadeExercicio.ts'
import { exerciciosSeed } from '../data/catalogoOficial.ts'
import { CHAVE_RASCUNHO_SESSAO } from '../utils/exercicioSessao.ts'

export const FORMATO_BACKUP = 'gy-backup'
export const VERSAO_BACKUP = 4
export const TAMANHO_MAXIMO_BACKUP = 50 * 1024 * 1024

export interface TabelasBackup {
  perfil: Perfil[]
  catalogo: ExercicioCatalogo[]
  fichas: Ficha[]
  treinos: Treino[]
  configuracoes: ConfiguracaoApp[]
  programacoes: ProgramacaoVigente[]
  historico: HistoricoTreino[]
  medidasCorporais: MedidaCorporal[]
}

export interface DocumentoBackup {
  formato: typeof FORMATO_BACKUP
  versao: 1 | 2 | 3 | 4
  criadoEm: string
  schemaOrigem: number
  tabelas: TabelasBackup
}

export interface ResumoBackup {
  criadoEm: Date
  versao: number
  possuiPerfil: boolean
  fichas: number
  fichaAtiva: string | null
  treinos: number
  exercicios: number
  sessoes: number
  sessaoEmAndamento: boolean
  programacoes: number
  medidasCorporais: number
}

export interface AdaptadorBackup {
  lerSnapshot(): Promise<TabelasBackup>
  substituir(tabelas: TabelasBackup): Promise<void>
}

const datasPorTabela: Record<keyof TabelasBackup, string[]> = {
  perfil: ['criadoEm'], catalogo: [], fichas: ['criadoEm', 'atualizadoEm'],
  treinos: ['criadoEm', 'atualizadoEm'], configuracoes: [],
  programacoes: ['efetivaEm'], historico: ['dataInicio', 'dataFim'], medidasCorporais: []
}

const erros = {
  json: 'Não foi possível ler o arquivo.',
  formato: 'Este arquivo não é um backup válido do Gy.',
  versao: 'Esta versão de backup não é compatível.',
  dados: 'O backup contém dados inválidos ou incompletos.'
}

export class ErroBackup extends Error {
  constructor(message: string) { super(message); this.name = 'ErroBackup' }
}

const objeto = (valor: unknown): Record<string, unknown> => {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor) || Object.getPrototypeOf(valor) !== Object.prototype) throw new ErroBackup(erros.dados)
  return valor as Record<string, unknown>
}
const chaves = (valor: Record<string, unknown>, permitidas: string[]) => {
  if (Object.keys(valor).some(chave => !permitidas.includes(chave))) throw new ErroBackup(erros.dados)
}
const campos = (valor: Record<string, unknown>, obrigatorios: string[]) => {
  if (obrigatorios.some(chave => !(chave in valor))) throw new ErroBackup(erros.dados)
}
const texto = (valor: unknown, max = 10000, opcional = false): valor is string => typeof valor === 'string' && valor.length <= max && (opcional || valor.trim().length > 0)
const numero = (valor: unknown, min = -1e9, max = 1e9, inteiro = false): valor is number => typeof valor === 'number' && Number.isFinite(valor) && valor >= min && valor <= max && (!inteiro || Number.isInteger(valor))
const id = (valor: unknown): valor is number => numero(valor, 1, Number.MAX_SAFE_INTEGER, true)
const urlSegura = (valor: unknown) => {
  if (!texto(valor, 2048, true)) return false
  if (!valor) return true
  try { return ['http:', 'https:'].includes(new URL(valor).protocol) } catch { return false }
}
const imagemLocal = (valor: unknown) => valor === undefined || valor === '' || typeof valor === 'string' && /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z\d+/]*={0,2}$/.test(valor)
const data = (valor: unknown, opcional = false): valor is string | undefined => opcional && valor === undefined || typeof valor === 'string' && Number.isFinite(Date.parse(valor)) && /^\d{4}-\d\d-\d\dT/.test(valor)
const lista = (valor: unknown, max: number): valor is unknown[] => Array.isArray(valor) && valor.length <= max
const idsUnicos = (valores: unknown[]) => valores.every(id) && new Set(valores).size === valores.length
const datasCivil = (valor: unknown, opcional = false) => {
  if (opcional && valor === undefined) return true
  if (typeof valor !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(valor)) return false
  const [ano, mes, dia] = valor.split('-').map(Number)
  const data = new Date(Date.UTC(ano!, mes! - 1, dia!))
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes! - 1 && data.getUTCDate() === dia
}
const identidadeOficialCompativel = (identidade: unknown, exercicio: Record<string, unknown>) => {
  if (typeof identidade !== 'string' || !identidade.startsWith('gy:oficial:')) return true
  const oficial = exerciciosSeed.find(item => item.exercicioCanonicoId === identidade)
  return !!oficial && oficial.nome === exercicio.nome && oficial.grupoMuscular === exercicio.grupoMuscular && (exercicio.videoUrl === undefined || oficial.videoUrl === exercicio.videoUrl)
}

function validarRegistro(chave: keyof TabelasBackup, valor: unknown, versao: number) {
  const r = objeto(valor)
  const permitidos: Record<keyof TabelasBackup, string[]> = {
    perfil: ['id', 'nome', 'idade', 'peso', 'altura', 'fotoPerfil', 'criadoEm'],
    catalogo: ['exercicioCanonicoId', 'id', 'nome', 'grupoMuscular', 'equipamento', 'videoUrl', 'defaultSeries', 'defaultReps'],
    fichas: ['id', 'nome', 'foco', 'corTema', 'descricao', 'origem', 'criadoEm', 'atualizadoEm'],
    treinos: ['id', 'fichaId', 'nome', 'foco', 'ordem', 'diasDaSemana', 'exercicios', 'criadoEm', 'atualizadoEm', 'corTema'],
    configuracoes: ['chave', 'fichaAtivaId'],
    programacoes: ['id', 'fichaId', 'efetivaEm', 'diaLocalVigencia', 'fusoHorario', 'offsetMinutos', 'motivo', 'fichaNome', 'treinos', 'agenda'],
    historico: ['id', 'fichaId', 'treinoId', 'fichaNome', 'treinoNome', 'fichaFoco', 'fichaCorTema', 'dataInicio', 'dataFim', 'diaConclusaoLocal', 'fusoConclusao', 'offsetConclusaoMinutos', 'estado', 'duracaoMinutos', 'exerciciosRealizados'],
    medidasCorporais: ['id', 'dataLocal', 'pesoKg', 'cinturaCm', 'quadrilCm', 'peitoralCm', 'bracoEsquerdoCm', 'bracoDireitoCm', 'coxaEsquerdaCm', 'coxaDireitaCm', 'panturrilhaEsquerdaCm', 'panturrilhaDireitaCm']
  }
  if (versao === 1 && chave === 'catalogo' && r.exercicioCanonicoId !== undefined) throw new ErroBackup(erros.dados)
  chaves(r, permitidos[chave])
  const obrigatorios: Record<keyof TabelasBackup, string[]> = {
    perfil: ['nome', 'idade', 'peso', 'altura', 'criadoEm'],
    catalogo: ['nome', 'grupoMuscular', 'equipamento', 'videoUrl', 'defaultSeries', 'defaultReps'],
    fichas: ['nome', 'foco', 'corTema', 'origem', 'criadoEm', 'atualizadoEm'],
    treinos: ['fichaId', 'nome', 'foco', 'ordem', 'diasDaSemana', 'exercicios', 'criadoEm', 'atualizadoEm'],
    configuracoes: ['chave', 'fichaAtivaId'],
    programacoes: ['fichaId', 'efetivaEm', 'motivo', 'fichaNome', 'treinos'],
    historico: ['fichaId', 'treinoId', 'fichaNome', 'treinoNome', 'dataInicio', 'estado', 'duracaoMinutos', 'exerciciosRealizados'],
    medidasCorporais: ['dataLocal']
  }
  campos(r, obrigatorios[chave])
  if (chave !== 'configuracoes' && !id(r.id) || r.id !== undefined && !id(r.id)) throw new ErroBackup(erros.dados)
  if (chave === 'perfil') {
    if (!texto(r.nome, 200) || !numero(r.idade, 0, 130, true) || !numero(r.peso, 0, 1000) || !numero(r.altura, 0, 300) || !data(r.criadoEm) || r.fotoPerfil !== undefined && (!texto(r.fotoPerfil, TAMANHO_MAXIMO_BACKUP, true) || !imagemLocal(r.fotoPerfil))) throw new ErroBackup(erros.dados)
  } else if (chave === 'catalogo') {
    if (r.exercicioCanonicoId !== undefined && (!identidadeValida(r.exercicioCanonicoId) || r.exercicioCanonicoId.startsWith('gy:oficial:') && identidadeOficial(r as unknown as ExercicioCatalogo) !== r.exercicioCanonicoId)) throw new ErroBackup(erros.dados)
    if (!texto(r.nome, 300) || !texto(r.grupoMuscular, 100) || !texto(r.equipamento, 200, true) || !urlSegura(r.videoUrl) || !numero(r.defaultSeries, 1, 100, true) || !texto(r.defaultReps, 100)) throw new ErroBackup(erros.dados)
  } else if (chave === 'fichas') {
    if (!texto(r.nome, 200) || !texto(r.foco, 200) || !texto(r.corTema, 80) || r.descricao !== undefined && !texto(r.descricao, 5000, true) || !['local', 'importada'].includes(String(r.origem)) || !data(r.criadoEm) || !data(r.atualizadoEm)) throw new ErroBackup(erros.dados)
  } else if (chave === 'treinos') {
    if (!id(r.fichaId) || !texto(r.nome, 200) || !texto(r.foco, 200) || !numero(r.ordem, 0, 10000, true) || r.corTema !== undefined && !texto(r.corTema, 80) || !data(r.criadoEm) || !data(r.atualizadoEm) || !lista(r.diasDaSemana, 7) || !r.diasDaSemana.every(d => numero(d, 0, 6, true)) || new Set(r.diasDaSemana).size !== r.diasDaSemana.length || !lista(r.exercicios, 1000)) throw new ErroBackup(erros.dados)
    for (const item of r.exercicios) {
      const e = objeto(item)
      chaves(e, ['exercicioId', 'ordem', 'series', 'repsAlvo', 'taxaAumentoKg', 'descansoSegundos', 'pesoBaseAtual', 'substitutosIds', 'temDescanso'])
      campos(e, ['exercicioId', 'ordem', 'series', 'repsAlvo', 'taxaAumentoKg', 'descansoSegundos', 'pesoBaseAtual', 'substitutosIds'])
      if (!id(e.exercicioId) || !numero(e.ordem, 0, 10000, true) || !numero(e.series, 1, 100, true) || !texto(e.repsAlvo, 100) || !numero(e.taxaAumentoKg, 0, 1000) || !numero(e.descansoSegundos, 0, 86400, true) || !numero(e.pesoBaseAtual, 0, 10000) || !lista(e.substitutosIds, 100) || !e.substitutosIds.every(id) || e.temDescanso !== undefined && typeof e.temDescanso !== 'boolean') throw new ErroBackup(erros.dados)
    }
  } else if (chave === 'configuracoes') {
    if (r.chave !== 'principal' || r.fichaAtivaId !== null && !id(r.fichaAtivaId)) throw new ErroBackup(erros.dados)
  } else if (chave === 'programacoes') {
    if (r.fichaId !== null && !id(r.fichaId) || !data(r.efetivaEm) || !['ativacao', 'troca', 'edicao', 'desativacao', ...(versao >= 4 ? ['deslocamento'] : [])].includes(String(r.motivo)) || r.fichaNome !== null && !texto(r.fichaNome, 200) || !lista(r.treinos, 1000) || r.diaLocalVigencia !== undefined && !datasCivil(r.diaLocalVigencia) || r.fusoHorario !== undefined && !texto(r.fusoHorario, 100) || r.offsetMinutos !== undefined && !numero(r.offsetMinutos, -840, 840, true)) throw new ErroBackup(erros.dados)
    for (const item of r.treinos) {
      const t = objeto(item); chaves(t, ['treinoId', 'treinoNome', 'diasDaSemana']); campos(t, ['treinoId', 'treinoNome', 'diasDaSemana'])
      if (!id(t.treinoId) || !texto(t.treinoNome, 200) || !lista(t.diasDaSemana, 7) || !t.diasDaSemana.every(d => numero(d, 0, 6, true)) || new Set(t.diasDaSemana).size !== t.diasDaSemana.length) throw new ErroBackup(erros.dados)
    }
    if (r.agenda !== undefined) {
      if (versao < 4 || r.motivo !== 'deslocamento') throw new ErroBackup(erros.dados)
      const agenda = objeto(r.agenda)
      chaves(agenda, ['inicio', 'fim', 'itens']); campos(agenda, ['inicio', 'fim', 'itens'])
      if (!datasCivil(agenda.inicio) || !datasCivil(agenda.fim) || String(agenda.fim) < String(agenda.inicio) || agenda.inicio !== r.diaLocalVigencia || !lista(agenda.itens, 28) || !agenda.itens.length) throw new ErroBackup(erros.dados)
      if ((Date.parse(`${agenda.fim}T00:00:00Z`) - Date.parse(`${agenda.inicio}T00:00:00Z`)) / 86400000 > 35) throw new ErroBackup(erros.dados)
      const dias = new Set<string>()
      for (const item of agenda.itens) {
        const a = objeto(item); chaves(a, ['dia', 'treinoId', 'treinoNome']); campos(a, ['dia', 'treinoId', 'treinoNome'])
        if (!datasCivil(a.dia) || String(a.dia) < String(agenda.inicio) || String(a.dia) > String(agenda.fim) || dias.has(String(a.dia)) || !id(a.treinoId) || !texto(a.treinoNome, 200) || !r.treinos.some(item => objeto(item).treinoId === a.treinoId)) throw new ErroBackup(erros.dados)
        dias.add(String(a.dia))
      }
    } else if (r.motivo === 'deslocamento') throw new ErroBackup(erros.dados)
  } else if (chave === 'historico') {
    if (r.fichaId !== null && !id(r.fichaId) || r.treinoId !== null && !id(r.treinoId) || !texto(r.fichaNome, 200, true) || !texto(r.treinoNome, 200) || r.fichaFoco !== undefined && !texto(r.fichaFoco, 200, true) || r.fichaCorTema !== undefined && !texto(r.fichaCorTema, 80, true) || !data(r.dataInicio) || !data(r.dataFim, true) || r.diaConclusaoLocal !== undefined && !datasCivil(r.diaConclusaoLocal) || r.fusoConclusao !== undefined && !texto(r.fusoConclusao, 100) || r.offsetConclusaoMinutos !== undefined && !numero(r.offsetConclusaoMinutos, -840, 840, true) || !['em_andamento', 'finalizado', 'cancelado'].includes(String(r.estado)) || !numero(r.duracaoMinutos, 0, 1e7) || !lista(r.exerciciosRealizados, 1000)) throw new ErroBackup(erros.dados)
    if (r.estado !== 'em_andamento' && !data(r.dataFim)) throw new ErroBackup(erros.dados)
    for (const item of r.exerciciosRealizados) {
      const e = objeto(item); chaves(e, ['exercicioCanonicoId', 'planejado', 'registrosEditados', 'exercicioId', 'nome', 'grupoMuscular', 'videoUrl', 'ordem', 'seriesPlanejadas', 'repsAlvo', 'pesoBasePlanejado', 'taxaAumentoKg', 'temDescanso', 'descansoSegundos', 'seriesRealizadas'])
      if (versao === 1 && ['exercicioCanonicoId', 'planejado', 'registrosEditados'].some(campo => e[campo] !== undefined)) throw new ErroBackup(erros.dados)
      if (e.exercicioCanonicoId !== undefined && (!identidadeValida(e.exercicioCanonicoId) || !identidadeOficialCompativel(e.exercicioCanonicoId, e)) || e.registrosEditados !== undefined && typeof e.registrosEditados !== 'boolean') throw new ErroBackup(erros.dados)
      if (e.planejado !== undefined) {
        const planejado = objeto(e.planejado)
        chaves(planejado, ['exercicioId', 'exercicioCanonicoId', 'nome', 'grupoMuscular', 'videoUrl', 'pesoBasePlanejado', 'taxaAumentoKg'])
        campos(planejado, ['exercicioId', 'nome', 'grupoMuscular'])
        if (!id(planejado.exercicioId) || !texto(planejado.nome, 300) || !texto(planejado.grupoMuscular, 100) || planejado.exercicioCanonicoId !== undefined && (!identidadeValida(planejado.exercicioCanonicoId) || !identidadeOficialCompativel(planejado.exercicioCanonicoId, planejado)) || planejado.videoUrl !== undefined && !urlSegura(planejado.videoUrl) || planejado.pesoBasePlanejado !== undefined && !numero(planejado.pesoBasePlanejado, 0, 10000) || planejado.taxaAumentoKg !== undefined && !numero(planejado.taxaAumentoKg, 0, 1000)) throw new ErroBackup(erros.dados)
      }
      campos(e, ['exercicioId', 'nome', 'grupoMuscular', 'ordem', 'seriesPlanejadas', 'repsAlvo', 'pesoBasePlanejado', 'taxaAumentoKg', 'temDescanso', 'descansoSegundos', 'seriesRealizadas'])
      if (!id(e.exercicioId) || !texto(e.nome, 300) || !texto(e.grupoMuscular, 100) || e.videoUrl !== undefined && !urlSegura(e.videoUrl) || !numero(e.ordem, 0, 10000, true) || !numero(e.seriesPlanejadas, 0, 100, true) || !texto(e.repsAlvo, 100, true) || !numero(e.pesoBasePlanejado, 0, 10000) || !numero(e.taxaAumentoKg, 0, 1000) || typeof e.temDescanso !== 'boolean' || !numero(e.descansoSegundos, 0, 86400, true) || !lista(e.seriesRealizadas, 1000)) throw new ErroBackup(erros.dados)
      for (const serie of e.seriesRealizadas) {
        const s = objeto(serie); chaves(s, ['numeroDaSerie', 'peso', 'reps', 'finalizada']); campos(s, ['numeroDaSerie', 'peso', 'reps'])
        if (!numero(s.numeroDaSerie, 1, 1000, true) || !numero(s.peso, 0, 10000) || !(numero(s.reps, 0, 10000) || texto(s.reps, 100, true)) || s.finalizada !== undefined && typeof s.finalizada !== 'boolean') throw new ErroBackup(erros.dados)
      }
    }
  } else {
    const medidas = ['pesoKg', 'cinturaCm', 'quadrilCm', 'peitoralCm', 'bracoEsquerdoCm', 'bracoDireitoCm', 'coxaEsquerdaCm', 'coxaDireitaCm', 'panturrilhaEsquerdaCm', 'panturrilhaDireitaCm']
    if (!datasCivil(r.dataLocal) || !medidas.some(campo => r[campo] !== undefined) || medidas.some(campo => r[campo] !== undefined && !numero(r[campo], campo === 'pesoKg' ? 0.1 : 1, campo === 'pesoKg' ? 1000 : 500))) throw new ErroBackup(erros.dados)
  }
  for (const campo of datasPorTabela[chave]) if (!data(r[campo], campo === 'dataFim')) throw new ErroBackup(erros.dados)
}

export function validarBackup(entrada: unknown): DocumentoBackup {
  try {
    const doc = objeto(entrada)
    chaves(doc, ['formato', 'versao', 'criadoEm', 'schemaOrigem', 'tabelas'])
    campos(doc, ['formato', 'versao', 'criadoEm', 'schemaOrigem', 'tabelas'])
    if (doc.formato !== FORMATO_BACKUP) throw new ErroBackup(erros.formato)
    if (doc.versao !== 1 && doc.versao !== 2 && doc.versao !== 3 && doc.versao !== VERSAO_BACKUP) throw new ErroBackup(erros.versao)
    if (!data(doc.criadoEm) || !numero(doc.schemaOrigem, 1, 1000, true)) throw new ErroBackup(erros.dados)
    const tabelas = objeto(doc.tabelas)
    const nomesAntigos = ['perfil', 'catalogo', 'fichas', 'treinos', 'configuracoes', 'programacoes', 'historico'] as const
    const nomes = doc.versao >= 3 ? [...nomesAntigos, 'medidasCorporais'] as const : nomesAntigos
    const tabelaInternaNormalizada = doc.versao < 3 && Array.isArray(tabelas.medidasCorporais) && tabelas.medidasCorporais.length === 0
    chaves(tabelas, tabelaInternaNormalizada ? [...nomes, 'medidasCorporais'] : [...nomes]); campos(tabelas, [...nomes])
    const limites: Record<keyof TabelasBackup, number> = { perfil: 10, catalogo: 10000, fichas: 500, treinos: 5000, configuracoes: 1, programacoes: 50000, historico: 50000, medidasCorporais: 50000 }
    for (const nome of nomes) {
      if (!lista(tabelas[nome], limites[nome])) throw new ErroBackup(erros.dados)
      for (const registro of tabelas[nome]) validarRegistro(nome, registro, Number(doc.versao))
      const ids = (tabelas[nome] as Array<{ id?: unknown }>).flatMap(r => r.id === undefined ? [] : [r.id])
      if (!idsUnicos(ids)) throw new ErroBackup(erros.dados)
    }
    if (doc.versao >= 3 && new Set((tabelas.medidasCorporais as MedidaCorporal[]).map(registro => registro.dataLocal)).size !== (tabelas.medidasCorporais as MedidaCorporal[]).length) throw new ErroBackup(erros.dados)
    if (doc.versao < 3) (tabelas as Record<string, unknown>).medidasCorporais = []
    const dados = tabelas as unknown as TabelasBackup
    const canonicos = new Map<string, string>()
    for (const exercicio of dados.catalogo) {
      if (!exercicio.exercicioCanonicoId) continue
      const descricao = JSON.stringify([exercicio.nome, exercicio.grupoMuscular, exercicio.equipamento, exercicio.videoUrl])
      const anterior = canonicos.get(exercicio.exercicioCanonicoId)
      if (anterior && anterior !== descricao) throw new ErroBackup(erros.dados)
      canonicos.set(exercicio.exercicioCanonicoId, descricao)
    }
    const fichas = new Set(dados.fichas.flatMap(f => f.id === undefined ? [] : [f.id]))
    const catalogo = new Set(dados.catalogo.flatMap(e => e.id === undefined ? [] : [e.id]))
    if (dados.treinos.some(t => !fichas.has(t.fichaId) || t.exercicios.some(e => !catalogo.has(e.exercicioId) || e.substitutosIds.some(idEx => !catalogo.has(idEx))))) throw new ErroBackup(erros.dados)
    if (dados.configuracoes.length > 1 || dados.configuracoes[0]?.fichaAtivaId != null && !fichas.has(dados.configuracoes[0].fichaAtivaId)) throw new ErroBackup(erros.dados)
    const vigente = [...dados.programacoes].sort((a, b) => new Date(a.efetivaEm).getTime() - new Date(b.efetivaEm).getTime() || (a.id ?? 0) - (b.id ?? 0)).at(-1)
    if (vigente?.agenda && vigente.fichaId === dados.configuracoes[0]?.fichaAtivaId && vigente.agenda.itens.some(item => !dados.treinos.some(treino => treino.id === item.treinoId && treino.fichaId === vigente.fichaId))) throw new ErroBackup(erros.dados)
    return { ...doc, tabelas } as unknown as DocumentoBackup
  } catch (error) {
    if (error instanceof ErroBackup) throw error
    throw new ErroBackup(erros.dados)
  }
}

const transformarDatas = (tabelas: TabelasBackup, serializar: boolean) => {
  const resultado = JSON.parse(JSON.stringify(tabelas)) as Record<keyof TabelasBackup, Array<Record<string, unknown>>>
  for (const tabela of Object.keys(datasPorTabela) as Array<keyof TabelasBackup>) for (const registro of resultado[tabela]) {
    for (const campo of datasPorTabela[tabela]) if (registro[campo] !== undefined) registro[campo] = serializar ? new Date(registro[campo] as string).toISOString() : new Date(registro[campo] as string)
  }
  return resultado as unknown as TabelasBackup
}

export async function exportarBackup(adaptador: AdaptadorBackup, agora = new Date()): Promise<DocumentoBackup> {
  const snapshot = await adaptador.lerSnapshot()
  const tabelas = { ...snapshot, medidasCorporais: snapshot.medidasCorporais ?? [] }
  const documento: DocumentoBackup = { formato: FORMATO_BACKUP, versao: VERSAO_BACKUP, criadoEm: agora.toISOString(), schemaOrigem: db.verno, tabelas: transformarDatas(tabelas, true) }
  validarBackup(documento)
  return documento
}

export function lerArquivoBackup(conteudo: string): DocumentoBackup {
  if (new TextEncoder().encode(conteudo).byteLength > TAMANHO_MAXIMO_BACKUP) throw new ErroBackup('O arquivo excede o tamanho máximo de 50 MB.')
  let valor: unknown
  try { valor = JSON.parse(conteudo) } catch { throw new ErroBackup(erros.json) }
  return validarBackup(valor)
}

export function resumoBackup(documento: DocumentoBackup): ResumoBackup {
  const { tabelas } = documento
  const ativa = tabelas.configuracoes[0]?.fichaAtivaId
  return {
    criadoEm: new Date(documento.criadoEm), versao: documento.versao, possuiPerfil: tabelas.perfil.length > 0,
    fichas: tabelas.fichas.length, fichaAtiva: tabelas.fichas.find(f => f.id === ativa)?.nome ?? null,
    treinos: tabelas.treinos.length, exercicios: tabelas.treinos.reduce((soma, treino) => soma + treino.exercicios.length, 0),
    sessoes: tabelas.historico.length, sessaoEmAndamento: tabelas.historico.some(s => s.estado === 'em_andamento'),
    programacoes: tabelas.programacoes.length, medidasCorporais: tabelas.medidasCorporais.length
  }
}

export async function restaurarBackup(adaptador: AdaptadorBackup, documento: DocumentoBackup): Promise<void> {
  const validado = validarBackup(documento)
  await adaptador.substituir(transformarDatas(validado.tabelas, false))
  try { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(CHAVE_RASCUNHO_SESSAO) } catch { }
}

export const adaptadorDexie: AdaptadorBackup = {
  async lerSnapshot() {
    return db.transaction('r', [db.perfil, db.catalogo, db.fichas, db.treinos, db.configuracoes, db.programacoes, db.historico, db.medidasCorporais], async () => {
      const [perfil, catalogo, fichas, treinos, configuracoes, programacoes, historico, medidasCorporais] = await Promise.all([
        db.perfil.toArray(), db.catalogo.toArray(), db.fichas.toArray(), db.treinos.toArray(), db.configuracoes.toArray(), db.programacoes.toArray(), db.historico.toArray(), db.medidasCorporais.toArray()
      ])
      return { perfil, catalogo, fichas, treinos, configuracoes, programacoes, historico, medidasCorporais }
    })
  },
  async substituir(tabelas) {
    await db.transaction('rw', [db.perfil, db.catalogo, db.fichas, db.treinos, db.configuracoes, db.programacoes, db.historico, db.medidasCorporais], async () => {
      await Promise.all([db.perfil.clear(), db.catalogo.clear(), db.fichas.clear(), db.treinos.clear(), db.configuracoes.clear(), db.programacoes.clear(), db.historico.clear(), db.medidasCorporais.clear()])
      if (tabelas.perfil.length) await db.perfil.bulkAdd(tabelas.perfil)
      if (tabelas.catalogo.length) await db.catalogo.bulkAdd(tabelas.catalogo)
      if (tabelas.fichas.length) await db.fichas.bulkAdd(tabelas.fichas)
      if (tabelas.treinos.length) await db.treinos.bulkAdd(tabelas.treinos)
      if (tabelas.configuracoes.length) await db.configuracoes.bulkPut(tabelas.configuracoes)
      if (tabelas.programacoes.length) await db.programacoes.bulkAdd(tabelas.programacoes)
      if (tabelas.historico.length) await db.historico.bulkAdd(tabelas.historico)
      if (tabelas.medidasCorporais.length) await db.medidasCorporais.bulkAdd(tabelas.medidasCorporais)
    })
  }
}

export function arquivoBackup(documento: DocumentoBackup) {
  const agora = new Date()
  const dataLocal = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`
  return { nome: `gy-backup-${dataLocal}.json`, conteudo: JSON.stringify(documento, null, 2) }
}
