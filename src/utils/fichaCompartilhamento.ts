import type { ExercicioCatalogo, ExercicioNaFicha, Ficha, FichaCompleta, Treino, GyDB } from '@/database/db'

export const FORMATO_FICHAS = 'gy-training-program'
export const VERSAO_FICHAS = 2
export const TAMANHO_MAXIMO_ARQUIVO = 1_000_000

export interface ExercicioTransferencia {
  ref: string
  nome: string
  grupoMuscular: string
  equipamento: string
  videoUrl: string
  seriesPadrao: number
  repsPadrao: string
}
export interface ExercicioPlanejadoTransferencia {
  exercicioRef: string
  ordem: number
  series: number
  repsAlvo: string
  descansoSegundos: number
  taxaAumentoKg: number
  temDescanso: boolean
  substitutosRefs: string[]
}
export interface TreinoTransferencia {
  corTema?: string
  nome: string
  foco: string
  ordem: number
  diasDaSemana: number[]
  exercicios: ExercicioPlanejadoTransferencia[]
}
export interface FichaTransferencia {
  nome: string
  foco: string
  descricao: string
  corTema: string
  treinos: TreinoTransferencia[]
}
export interface DocumentoFichas {
  formato: typeof FORMATO_FICHAS
  versao: typeof VERSAO_FICHAS
  exportadoEm: string
  exercicios: ExercicioTransferencia[]
  fichas: FichaTransferencia[]
}

export class ErroCompartilhamento extends Error {
  constructor(message: string) { super(message); this.name = 'ErroCompartilhamento' }
}

const cores = new Set(['amethyst', 'cerulean', 'teal', 'emerald', 'bubblegum', 'orange', 'rose'])
const texto = (v: unknown, nome: string, max: number, opcional = false) => {
  if (typeof v !== 'string' || v.length > max || (!opcional && !v.trim())) throw new ErroCompartilhamento(`O campo “${nome}” está ausente ou inválido.`)
  return v.trim()
}
const numero = (v: unknown, nome: string, min: number, max: number, inteiro = false) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (inteiro && !Number.isInteger(v))) throw new ErroCompartilhamento(`O valor de “${nome}” está fora dos limites permitidos.`)
  return v
}
const objeto = (v: unknown, nome: string): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new ErroCompartilhamento(`A estrutura de “${nome}” é inválida.`)
  return v as Record<string, unknown>
}
const chaves = (v: Record<string, unknown>, permitidas: string[], nome: string) => {
  const inesperada = Object.keys(v).find(k => !permitidas.includes(k))
  if (inesperada) throw new ErroCompartilhamento(`O campo “${nome}.${inesperada}” não é reconhecido.`)
}
const dias = (v: unknown, nome: string) => {
  if (!Array.isArray(v) || v.length > 7 || !v.every(d => Number.isInteger(d) && d >= 0 && d <= 6) || new Set(v).size !== v.length) throw new ErroCompartilhamento(`Os dias de “${nome}” são inválidos.`)
  return [...v] as number[]
}
const urlHttp = (v: unknown) => {
  const url = texto(v, 'videoUrl', 2048, true)
  if (url) {
    try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error() }
    catch { throw new ErroCompartilhamento('Um link de exercício não é uma URL HTTP ou HTTPS válida.') }
  }
  return url
}

export const validarDocumentoFichas = (entrada: unknown): DocumentoFichas => {
  const raiz = objeto(entrada, 'arquivo')
  chaves(raiz, ['formato', 'versao', 'exportadoEm', 'exercicios', 'fichas'], 'arquivo')
  if (raiz.formato !== FORMATO_FICHAS) throw new ErroCompartilhamento('Este arquivo não é uma exportação de fichas Gy compatível.')
  if (raiz.versao !== VERSAO_FICHAS) throw new ErroCompartilhamento(`A versão ${String(raiz.versao)} deste arquivo não é compatível.`)
  const exportadoEm = texto(raiz.exportadoEm, 'data de exportação', 40)
  if (!Number.isFinite(Date.parse(exportadoEm))) throw new ErroCompartilhamento('A data de exportação é inválida.')
  if (!Array.isArray(raiz.fichas) || !raiz.fichas.length || raiz.fichas.length > 50) throw new ErroCompartilhamento('O arquivo deve conter de 1 a 50 fichas.')
  if (!Array.isArray(raiz.exercicios) || !raiz.exercicios.length || raiz.exercicios.length > 500) throw new ErroCompartilhamento('A quantidade de exercícios no arquivo é inválida.')
  const exercicios = raiz.exercicios.map((v, i): ExercicioTransferencia => {
    const e = objeto(v, `exercício ${i + 1}`)
    chaves(e, ['ref', 'nome', 'grupoMuscular', 'equipamento', 'videoUrl', 'seriesPadrao', 'repsPadrao'], 'exercício')
    return { ref: texto(e.ref, 'referência do exercício', 40), nome: texto(e.nome, 'nome do exercício', 120), grupoMuscular: texto(e.grupoMuscular, 'grupo muscular', 80), equipamento: texto(e.equipamento, 'equipamento', 80, true), videoUrl: urlHttp(e.videoUrl), seriesPadrao: numero(e.seriesPadrao, 'séries padrão', 1, 50, true), repsPadrao: texto(e.repsPadrao, 'repetições padrão', 40) }
  })
  const porRef = new Map(exercicios.map(e => [e.ref, e]))
  if (porRef.size !== exercicios.length) throw new ErroCompartilhamento('O arquivo contém referências de exercício duplicadas.')
  let totalTreinos = 0, totalPrescricoes = 0
  const fichas = raiz.fichas.map((v, fi): FichaTransferencia => {
    const f = objeto(v, `ficha ${fi + 1}`)
    chaves(f, ['nome', 'foco', 'descricao', 'corTema', 'treinos'], `ficha ${fi + 1}`)
    if (!Array.isArray(f.treinos) || !f.treinos.length || f.treinos.length > 50) throw new ErroCompartilhamento(`A ficha ${fi + 1} deve conter de 1 a 50 treinos.`)
    const ocupados = new Set<number>()
    const treinos = f.treinos.map((vT, ti): TreinoTransferencia => {
      totalTreinos++
      const t = objeto(vT, `treino ${ti + 1}`)
      chaves(t, ['nome', 'foco', 'corTema', 'ordem', 'diasDaSemana', 'exercicios'], 'treino')
      const corTreino = texto(t.corTema ?? f.corTema ?? 'cerulean', 'cor do treino', 30)
      if (!cores.has(corTreino)) throw new ErroCompartilhamento('A cor do treino não é compatível.')
      const diasTreino = dias(t.diasDaSemana, 'treino')
      for (const dia of diasTreino) { if (ocupados.has(dia)) throw new ErroCompartilhamento('Uma ficha contém mais de um treino no mesmo dia.'); ocupados.add(dia) }
      if (!Array.isArray(t.exercicios) || !t.exercicios.length || t.exercicios.length > 100) throw new ErroCompartilhamento(`O treino ${ti + 1} deve conter de 1 a 100 exercícios.`)
      totalPrescricoes += t.exercicios.length
      const prescricoes = t.exercicios.map((vE, ei): ExercicioPlanejadoTransferencia => {
        const e = objeto(vE, `prescrição ${ei + 1}`)
        chaves(e, ['exercicioRef', 'ordem', 'series', 'repsAlvo', 'descansoSegundos', 'taxaAumentoKg', 'temDescanso', 'substitutosRefs'], 'prescrição')
        const ref = texto(e.exercicioRef, 'referência de exercício', 40)
        if (!porRef.has(ref)) throw new ErroCompartilhamento('Uma ficha aponta para um exercício ausente no arquivo.')
        if (!Array.isArray(e.substitutosRefs) || e.substitutosRefs.length > 100) throw new ErroCompartilhamento('A lista de substituições de exercício é inválida.')
        const substitutosRefs = e.substitutosRefs.map(r => { const id = texto(r, 'referência de substituição', 40); if (!porRef.has(id) || id === ref) throw new ErroCompartilhamento('Uma substituição aponta para um exercício ausente ou inválido.'); return id })
        if (new Set(substitutosRefs).size !== substitutosRefs.length) throw new ErroCompartilhamento('A lista de substituições contém duplicatas.')
        if (typeof e.temDescanso !== 'boolean') throw new ErroCompartilhamento('A configuração de descanso é inválida.')
        return { exercicioRef: ref, ordem: numero(e.ordem, 'ordem', 1, 100, true), series: numero(e.series, 'séries', 1, 50, true), repsAlvo: texto(e.repsAlvo, 'repetições alvo', 40), descansoSegundos: numero(e.descansoSegundos, 'descanso', 0, 3600, true), taxaAumentoKg: numero(e.taxaAumentoKg, 'taxa de progressão', 0, 100), temDescanso: e.temDescanso, substitutosRefs }
      })
      if (new Set(prescricoes.map(e => e.ordem)).size !== prescricoes.length) throw new ErroCompartilhamento('A ordem dos exercícios contém duplicatas.')
      return { corTema: corTreino, nome: texto(t.nome, 'nome do treino', 100), foco: texto(t.foco, 'foco do treino', 120, true), ordem: numero(t.ordem, 'ordem do treino', 1, 50, true), diasDaSemana: diasTreino, exercicios: prescricoes }
    })
    if (totalTreinos > 250 || totalPrescricoes > 500) throw new ErroCompartilhamento('O arquivo excede os limites de treinos ou exercícios.')
    const corTema = texto(f.corTema, 'cor da ficha', 30)
    if (!cores.has(corTema)) throw new ErroCompartilhamento('A cor da ficha não é compatível.')
    return { nome: texto(f.nome, 'nome da ficha', 100), foco: texto(f.foco, 'objetivo da ficha', 120, true), descricao: texto(f.descricao, 'descrição', 500, true), corTema, treinos }
  })
  return { formato: FORMATO_FICHAS, versao: VERSAO_FICHAS, exportadoEm, exercicios, fichas }
}

export const criarDocumentoFichas = (fichas: FichaCompleta[], catalogo: ExercicioCatalogo[], exportadoEm = new Date()): DocumentoFichas => {
  if (!fichas.length) throw new ErroCompartilhamento('Selecione ao menos uma ficha para exportar.')
  const porId = new Map(catalogo.flatMap(e => e.id == null ? [] : [[e.id, e] as const]))
  const refs = new Map<number, string>()
  const exercicios: ExercicioTransferencia[] = []
  const incluir = (id: number) => {
    const existente = refs.get(id)
    if (existente) return existente
    const e = porId.get(id)
    if (!e) throw new ErroCompartilhamento('Não foi possível exportar: um exercício da ficha não existe mais no catálogo.')
    const ref = `ex-${refs.size + 1}`; refs.set(id, ref)
    exercicios.push({ ref, nome: e.nome, grupoMuscular: e.grupoMuscular, equipamento: e.equipamento || '', videoUrl: e.videoUrl || '', seriesPadrao: e.defaultSeries, repsPadrao: e.defaultReps })
    return ref
  }
  const transferidas = fichas.map(f => ({
    nome: f.nome, foco: f.foco || '', descricao: f.descricao || '', corTema: f.corTema,
    treinos: f.treinos.map(t => ({ nome: t.nome, foco: t.foco || '', corTema: t.corTema || f.corTema || 'cerulean', ordem: t.ordem, diasDaSemana: [...t.diasDaSemana], exercicios: t.exercicios.map(e => ({ exercicioRef: incluir(e.exercicioId), ordem: e.ordem, series: e.series, repsAlvo: e.repsAlvo, descansoSegundos: e.descansoSegundos, taxaAumentoKg: e.taxaAumentoKg || 0, temDescanso: e.temDescanso !== false, substitutosRefs: (e.substitutosIds || []).map(incluir) })) }))
  }))
  return validarDocumentoFichas({ formato: FORMATO_FICHAS, versao: VERSAO_FICHAS, exportadoEm: exportadoEm.toISOString(), exercicios, fichas: transferidas })
}

const identidade = (e: Pick<ExercicioTransferencia, 'nome'|'grupoMuscular'|'equipamento'|'videoUrl'>) => [e.nome,e.grupoMuscular,e.equipamento,e.videoUrl].map(v => (v || '').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g,' ')).join('\u0000')
export const resolverExercicios = (descritores: ExercicioTransferencia[], catalogo: ExercicioCatalogo[]) => {
  const existentes = new Map<string, ExercicioCatalogo>()
  for (const e of catalogo) if (!existentes.has(identidade(e))) existentes.set(identidade(e), e)
  return new Map(descritores.map(e => [e.ref, existentes.get(identidade(e)) ?? null]))
}
export const nomeArquivoSeguro = (nomes: string[], multiplo = nomes.length > 1) => {
  const base = multiplo ? 'gy-programas' : `gy-ficha-${nomes[0] || 'treino'}`
  const safe = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70)
  return `${safe || 'gy-fichas'}.json`
}
export const diasDaSemanaLabels = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
export interface ResultadoImportacao { fichasCriadas: number; treinosCriados: number; exerciciosCriados: number }

export const persistirDocumentoFichas = async (entrada: DocumentoFichas, banco: Pick<GyDB, 'catalogo'|'fichas'|'treinos'|'transaction'>): Promise<ResultadoImportacao> => {
  const doc = validarDocumentoFichas(entrada)
  let exerciciosCriados = 0, treinosCriados = 0
  await banco.transaction('rw', banco.catalogo, banco.fichas, banco.treinos, async () => {
    const catalogo = await banco.catalogo.toArray()
    const resolvidos = resolverExercicios(doc.exercicios, catalogo)
    const ids = new Map<string, number>()
    for (const e of doc.exercicios) {
      const atual = resolvidos.get(e.ref)
      if (atual?.id != null) { ids.set(e.ref, atual.id); continue }
      const id = await banco.catalogo.add({ nome: e.nome, grupoMuscular: e.grupoMuscular, equipamento: e.equipamento, videoUrl: e.videoUrl, defaultSeries: e.seriesPadrao, defaultReps: e.repsPadrao })
      ids.set(e.ref, id); catalogo.push({ ...e, id } as unknown as ExercicioCatalogo); exerciciosCriados++
    }
    for (const f of doc.fichas) {
      const agora = new Date()
      const fichaId = await banco.fichas.add({ nome: f.nome, foco: f.foco, descricao: f.descricao, corTema: f.corTema, origem: 'importada', criadoEm: agora, atualizadoEm: agora } as Ficha)
      for (const t of f.treinos) {
        const exercicios: ExercicioNaFicha[] = t.exercicios.map(e => {
          const exercicioId = ids.get(e.exercicioRef)
          if (exercicioId == null) throw new ErroCompartilhamento('Uma referência de exercício não pôde ser resolvida.')
          const substitutosIds = e.substitutosRefs.map(r => { const id = ids.get(r); if (id == null) throw new ErroCompartilhamento('Uma substituição não pôde ser resolvida.'); return id })
          return { exercicioId, ordem: e.ordem, series: e.series, repsAlvo: e.repsAlvo, descansoSegundos: e.descansoSegundos, taxaAumentoKg: e.taxaAumentoKg, temDescanso: e.temDescanso, pesoBaseAtual: 0, substitutosIds }
        })
        await banco.treinos.add({ fichaId, nome: t.nome, foco: t.foco, corTema: t.corTema || 'cerulean', ordem: t.ordem, diasDaSemana: [...t.diasDaSemana], exercicios, criadoEm: agora, atualizadoEm: agora } as Treino)
        treinosCriados++
      }
    }
  })
  return { fichasCriadas: doc.fichas.length, treinosCriados, exerciciosCriados }
}
