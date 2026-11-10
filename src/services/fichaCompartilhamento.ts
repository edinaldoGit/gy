import { db, type ExercicioCatalogo, type FichaCompleta } from '@/database/db'
import {
  criarDocumentoFichas,
  nomeArquivoSeguro,
  persistirDocumentoFichas,
  type DocumentoFichas
} from '@/utils/fichaCompartilhamento'

export const baixarFichas = (fichas: FichaCompleta[], catalogo: ExercicioCatalogo[]) => {
  const documento = criarDocumentoFichas(fichas, catalogo)
  const arquivo = new Blob([JSON.stringify(documento, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivoSeguro(fichas.map(ficha => ficha.nome), fichas.length > 1)
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return link.download
}

export const importarDocumentoFichas = (documento: DocumentoFichas) => persistirDocumentoFichas(documento, db)

export const criarArquivoFicha = (fichas: FichaCompleta[], catalogo: ExercicioCatalogo[]) =>
  new File([JSON.stringify(criarDocumentoFichas(fichas, catalogo))], nomeArquivoSeguro(fichas.map(ficha => ficha.nome), fichas.length > 1), { type: 'application/json' })

export function podeCompartilharArquivo(arquivo: File) {
  try { return typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare?.({ files: [arquivo] }) }
  catch { return false }
}

export async function compartilharArquivo(arquivo: File) {
  if (!podeCompartilharArquivo(arquivo)) throw new Error('Compartilhamento de arquivos indisponível neste navegador.')
  try { await navigator.share({ files: [arquivo], title: 'Ficha do Gy' }); return 'compartilhado' as const }
  catch (erro) { if (erro instanceof DOMException && erro.name === 'AbortError') return 'cancelado' as const; throw erro }
}
