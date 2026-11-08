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
