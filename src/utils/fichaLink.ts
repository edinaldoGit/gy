import { validarDocumentoFichas, TAMANHO_MAXIMO_ARQUIVO, type DocumentoFichas } from './fichaCompartilhamento.ts'

export const PREFIXO_FICHA = '#gy-ficha=v1.'
export const LIMITE_LINK = 6000

export async function criarLinkFicha(documento: DocumentoFichas, base: string) {
  if (typeof CompressionStream === 'undefined') throw new Error('Este navegador não permite criar links compactados. Compartilhe o arquivo.')
  const json = JSON.stringify(documento)
  if (new TextEncoder().encode(json).byteLength > TAMANHO_MAXIMO_ARQUIVO) throw new Error('A ficha excede o limite de compartilhamento.')
  const bytes = new Uint8Array(await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer())
  if (bytes.byteLength > 4400) throw new Error('Esta ficha é grande demais para um link. Compartilhe o arquivo.')
  const payload = btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
  const link = new URL(base)
  link.hash = `${PREFIXO_FICHA}${payload}`
  if (link.href.length > LIMITE_LINK) throw new Error('Esta ficha é grande demais para um link. Compartilhe o arquivo pelo celular ou exporte-o.')
  return link.href
}

export async function lerLinkFicha(hash: string) {
  if (!hash.startsWith(PREFIXO_FICHA) || hash.length > LIMITE_LINK) throw new Error('Link de ficha inválido ou muito grande.')
  if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador não abre links compactados. Peça o arquivo da ficha.')
  const codigo = hash.slice(PREFIXO_FICHA.length)
  if (!/^[\w-]+$/.test(codigo)) throw new Error('O link da ficha está incompleto ou inválido.')
  try {
    const bytes = Uint8Array.from(atob(codigo.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0))
    const leitor = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader()
    const partes: Uint8Array[] = []
    let tamanho = 0
    try {
      while (true) {
        const { done, value } = await leitor.read()
        if (done) break
        tamanho += value.byteLength
        if (tamanho > TAMANHO_MAXIMO_ARQUIVO) { await leitor.cancel(); throw new Error('Conteúdo acima do limite.') }
        partes.push(value)
      }
    } finally { leitor.releaseLock() }
    const conteudo = new Uint8Array(tamanho)
    let indice = 0
    for (const parte of partes) { conteudo.set(parte, indice); indice += parte.length }
    return validarDocumentoFichas(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(conteudo)))
  } catch { throw new Error('Não foi possível ler a ficha. O link pode estar truncado ou conter dados inválidos.') }
}
