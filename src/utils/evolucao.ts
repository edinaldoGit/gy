import type { ExercicioCatalogo, HistoricoTreino, MedidaCorporal } from '../database/db.ts'
import { identidadeHistorica } from './identidadeExercicio.ts'

export const camposMedida = [
  { chave: 'pesoKg', nome: 'Peso', unidade: 'kg', maximo: 1000 },
  { chave: 'cinturaCm', nome: 'Cintura', unidade: 'cm', maximo: 500 },
  { chave: 'quadrilCm', nome: 'Quadril', unidade: 'cm', maximo: 500 },
  { chave: 'peitoralCm', nome: 'Peitoral', unidade: 'cm', maximo: 500 },
  { chave: 'bracoEsquerdoCm', nome: 'Braço esquerdo', unidade: 'cm', maximo: 500 },
  { chave: 'bracoDireitoCm', nome: 'Braço direito', unidade: 'cm', maximo: 500 },
  { chave: 'coxaEsquerdaCm', nome: 'Coxa esquerda', unidade: 'cm', maximo: 500 },
  { chave: 'coxaDireitaCm', nome: 'Coxa direita', unidade: 'cm', maximo: 500 },
  { chave: 'panturrilhaEsquerdaCm', nome: 'Panturrilha esquerda', unidade: 'cm', maximo: 500 },
  { chave: 'panturrilhaDireitaCm', nome: 'Panturrilha direita', unidade: 'cm', maximo: 500 }
] as const

export type CampoMedida = typeof camposMedida[number]['chave']
export type PeriodoCorporal = '30' | '90' | '365' | 'todos'

export const dataLocalHoje = (hoje = new Date()) => `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
export const dataCivilValida = (valor: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const [ano, mes, dia] = valor.split('-').map(Number)
  const data = new Date(ano!, mes! - 1, dia!)
  return data.getFullYear() === ano && data.getMonth() === mes! - 1 && data.getDate() === dia
}

export function validarMedida(entrada: Omit<MedidaCorporal, 'id'>): string | null {
  if (!dataCivilValida(entrada.dataLocal) || entrada.dataLocal > dataLocalHoje()) return 'Informe uma data válida até hoje.'
  let quantidade = 0
  for (const campo of camposMedida) {
    const valor = entrada[campo.chave]
    if (valor === undefined) continue
    if (!Number.isFinite(valor) || valor < (campo.chave === 'pesoKg' ? 0.1 : 1) || valor > campo.maximo) return `Confira o valor de ${campo.nome.toLocaleLowerCase('pt-BR')}.`
    quantidade++
  }
  return quantidade ? null : 'Informe pelo menos uma medida.'
}

export const ordenarMedidas = (registros: MedidaCorporal[]) => [...registros].sort((a, b) => b.dataLocal.localeCompare(a.dataLocal) || (b.id ?? 0) - (a.id ?? 0))
export const medidasNoPeriodo = (registros: MedidaCorporal[], periodo: PeriodoCorporal, hoje = new Date()) => {
  if (periodo === 'todos') return ordenarMedidas(registros).reverse()
  const limite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  limite.setDate(limite.getDate() - Number(periodo) + 1)
  const inicio = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, '0')}-${String(limite.getDate()).padStart(2, '0')}`
  return ordenarMedidas(registros.filter(registro => registro.dataLocal >= inicio && registro.dataLocal <= dataLocalHoje(hoje))).reverse()
}
export const variacaoPeso = (registros: MedidaCorporal[]) => {
  const comPeso = ordenarMedidas(registros).filter(registro => registro.pesoKg !== undefined)
  return comPeso.length > 1 ? comPeso[0]!.pesoKg! - comPeso[1]!.pesoKg! : null
}
export const formatarDataCivil = (valor: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(`${valor}T12:00:00`))

export interface HistoricoDesempenho {
  identidade: string
  nome: string
  grupoMuscular: string
  sessaoId?: number
  data: Date
  fichaNome: string
  treinoNome: string
  cargasKg: number[]
  repeticoes: number[]
  series: Array<{ peso: number; repeticoes: number }>
  maiorCargaKg: number | null
  volumeKgRepeticoes: number | null
}

export function agregarDesempenho(sessoes: HistoricoTreino[], catalogo: ExercicioCatalogo[], agora = new Date()): HistoricoDesempenho[] {
  const agregadas = new Map<string, HistoricoDesempenho>()
  for (const sessao of sessoes) {
    if (sessao.estado !== 'finalizado' || !sessao.dataFim) continue
    const data = new Date(sessao.dataFim)
    if (!Number.isFinite(data.getTime()) || data > agora) continue
    for (const exercicio of sessao.exerciciosRealizados) {
      const series = exercicio.seriesRealizadas.filter(serie => serie.finalizada === true && Number.isFinite(serie.peso) && serie.peso >= 0 && Number.isFinite(Number(serie.reps)) && Number(serie.reps) > 0)
      if (!series.length) continue
      const identidade = identidadeHistorica(exercicio, catalogo)
      const chave = `${sessao.id ?? `${data.getTime()}-${sessao.treinoNome}`}:${identidade}`
      if (!agregadas.has(chave)) {
        agregadas.set(chave, { identidade, nome: exercicio.nome, grupoMuscular: exercicio.grupoMuscular, sessaoId: sessao.id, data, fichaNome: sessao.fichaNome, treinoNome: sessao.treinoNome, cargasKg: [], repeticoes: [], series: [], maiorCargaKg: null, volumeKgRepeticoes: null })
      }
      const item = agregadas.get(chave)!
      item.cargasKg.push(...series.map(serie => serie.peso).filter(peso => peso > 0))
      item.repeticoes.push(...series.map(serie => Number(serie.reps)))
      item.series.push(...series.map(serie => ({ peso: serie.peso, repeticoes: Number(serie.reps) })))
      item.maiorCargaKg = item.cargasKg.length ? Math.max(...item.cargasKg) : null
      const seriesComCarga = series.filter(serie => serie.peso > 0)
      item.volumeKgRepeticoes = seriesComCarga.length ? (item.volumeKgRepeticoes ?? 0) + seriesComCarga.reduce((total, serie) => total + serie.peso * Number(serie.reps), 0) : item.volumeKgRepeticoes
    }
  }
  return [...agregadas.values()].sort((a, b) => b.data.getTime() - a.data.getTime() || (b.sessaoId ?? 0) - (a.sessaoId ?? 0))
}
