import type { HistoricoTreino } from '../database/db.ts'
import { diaDaConclusao } from './limiteDiario.ts'
export function sessoesPorDia(sessoes: HistoricoTreino[]) {
  const dias = new Map<string, HistoricoTreino[]>()
  for (const sessao of sessoes) {
    const dia = diaDaConclusao(sessao)
    if (dia) dias.set(dia, [...(dias.get(dia) ?? []), sessao])
  }
  return dias
}
export function diasDoMes(ano: number, mes: number) {
  const inicio = (new Date(ano, mes, 1).getDay() + 6) % 7
  const total = new Date(ano, mes + 1, 0).getDate()
  return Array.from({ length: Math.ceil((inicio + total) / 7) * 7 }, (_, index) => {
    const dia = index - inicio + 1
    return dia < 1 || dia > total ? null : `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  })
}
