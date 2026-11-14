export function agruparExercicios<T extends { nome: string; grupoMuscular: string }>(exercicios: T[], busca = '') {
  const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
  const grupos = new Map<string, T[]>()
  for (const e of exercicios) if (normalizar(e.nome).includes(normalizar(busca.trim()))) grupos.set(e.grupoMuscular, [...(grupos.get(e.grupoMuscular) ?? []), e])
  return [...grupos].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
}
