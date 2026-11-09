import type { ExercicioCatalogo, ExercicioRealizado } from '../database/db.ts'
import { exerciciosSeed } from '../data/catalogoOficial.ts'

const normalizar = (valor: string) => valor.normalize('NFC').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')
const descritor = (e: Pick<ExercicioCatalogo, 'nome' | 'grupoMuscular' | 'equipamento' | 'videoUrl'>) =>
  [e.nome, e.grupoMuscular, e.equipamento, e.videoUrl].map(normalizar).join('\u0000')
const oficiais = new Map(exerciciosSeed.map(e => [descritor(e), e.exercicioCanonicoId]))
export const identidadeOficial = (e: Pick<ExercicioCatalogo, 'nome' | 'grupoMuscular' | 'equipamento' | 'videoUrl'>) => oficiais.get(descritor(e))
export const novaIdentidadePersonalizada = () => `gy:personalizado:${crypto.randomUUID()}`
export const identidadeDoCatalogo = (e: ExercicioCatalogo) => e.exercicioCanonicoId ?? identidadeOficial(e) ?? novaIdentidadePersonalizada()
export const identidadeValida = (valor: unknown): valor is string => typeof valor === 'string' && (/^gy:oficial:([1-9]\d*)$/.test(valor) ? exerciciosSeed.some(e => e.exercicioCanonicoId === valor) : /^gy:personalizado:[a-zA-Z0-9-]{8,80}$/.test(valor) || /^gy:legado-local:[1-9]\d*$/.test(valor))
export const identidadeHistorica = (e: ExercicioRealizado, catalogo: ExercicioCatalogo[]): string => {
  if (e.exercicioCanonicoId) return e.exercicioCanonicoId
  const atual = catalogo.find(c => c.id === e.exercicioId)
  if (atual && normalizar(atual.nome) === normalizar(e.nome) && normalizar(atual.grupoMuscular) === normalizar(e.grupoMuscular) && (!e.videoUrl || atual.videoUrl === e.videoUrl)) {
    return atual.exercicioCanonicoId ?? identidadeOficial(atual) ?? `gy:legado-local:${e.exercicioId}`
  }
  return `gy:legado-local:${e.exercicioId}`
}
