import type { Treino } from '../database/db.ts'
export function corOcupada(treinos: Treino[], cor: string, id?: number) {
  const atual = treinos.find(t => t.id === id)
  if (atual && (atual.corTema || 'cerulean') === cor) return false
  return treinos.some(t => t.id !== id && (t.corTema || 'cerulean') === cor)
}
export function validarCorTreino(treinos: Treino[], cor: string, id?: number) {
  if (corOcupada(treinos, cor, id)) throw new Error('Essa cor já pertence a outro treino desta ficha. Escolha uma cor disponível.')
}
