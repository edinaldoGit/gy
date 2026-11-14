import type { ExercicioCatalogo } from '../database/db.ts'
const normalizar = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
export function filtrarCatalogo(catalogo: ExercicioCatalogo[], busca = '', grupo = '', equipamento = '') {
  const termo = normalizar(busca.trim())
  return catalogo.filter(e => !e.arquivado && (!grupo || e.grupoMuscular === grupo) && (!equipamento || e.equipamento === equipamento) && (!termo || normalizar(`${e.nome} ${e.grupoMuscular}`).includes(termo)))
}
