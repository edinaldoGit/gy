import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const paginasComEntradaDireta = ['onboarding', 'fichas', 'historico', 'evolucao', 'perfil']

export async function prepararPaginasGitHubPages(diretorioDist = path.resolve('dist')) {
  const indexPrincipal = path.join(diretorioDist, 'index.html')

  for (const pagina of paginasComEntradaDireta) {
    const diretorioPagina = path.join(diretorioDist, pagina)
    await mkdir(diretorioPagina, { recursive: true })
    await copyFile(indexPrincipal, path.join(diretorioPagina, 'index.html'))
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await prepararPaginasGitHubPages()
}
