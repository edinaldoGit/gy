import test from 'node:test'
import assert from 'node:assert/strict'

class StorageLocal {
  #values = new Map()
  getItem(key) { return this.#values.get(String(key)) ?? null }
  setItem(key, value) { this.#values.set(String(key), String(value)) }
}

test('gravações iniciadas antes da exclusão são invalidadas quando tentariam gravar depois', async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new StorageLocal() })
  let executarEscrita
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: { request: (_nome, _opcoes, callback) => new Promise((resolve, reject) => { executarEscrita = () => Promise.resolve().then(() => callback({})).then(resolve, reject) }) } } })
  const lock = await import('../src/database/writeLock.ts?regressao-exclusao')
  const geracaoInicial = localStorage.getItem('gy:geracao-dados')
  let gravou = false
  const escritaAntiga = lock.comGravacaoGy(async () => { gravou = true })

  lock.invalidarGeracaoDadosGy()
  executarEscrita()
  await assert.rejects(escritaAntiga, /dados desta aba foram excluídos/i)
  assert.notEqual(localStorage.getItem('gy:geracao-dados'), geracaoInicial)
  assert.equal(gravou, false)
})
