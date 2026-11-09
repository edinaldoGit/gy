import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, test } from 'node:test'
import { paginasComEntradaDireta, prepararPaginasGitHubPages } from '../scripts/prepare-github-pages.mjs'

let diretorioTemporario

afterEach(async () => {
  if (diretorioTemporario) await rm(diretorioTemporario, { recursive: true, force: true })
  diretorioTemporario = undefined
})

test('gera uma entrada estática com o mesmo index para cada rota do aplicativo', async () => {
  diretorioTemporario = await mkdtemp(path.join(os.tmpdir(), 'gy-pages-'))
  const conteudoPrincipal = '<html><script type="module" src="/gy/assets/app.js"></script></html>'
  await writeFile(path.join(diretorioTemporario, 'index.html'), conteudoPrincipal)

  await prepararPaginasGitHubPages(diretorioTemporario)

  for (const pagina of paginasComEntradaDireta) {
    assert.equal(await readFile(path.join(diretorioTemporario, pagina, 'index.html'), 'utf8'), conteudoPrincipal)
  }
})
