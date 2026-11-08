import test from 'node:test'
import assert from 'node:assert/strict'
import { FeedbackManager } from '../src/utils/feedbackManager.ts'
import { ConfirmationManager } from '../src/utils/confirmationManager.ts'
const clock = () => {
  let now = 0
  const manager = new FeedbackManager(() => {}, () => now)
  return { manager, step: ms => { now += ms; manager.tick() } }
}
for (const [kind, duration] of Object.entries({ success: 3500, error: 8000, warning: 6000, info: 5000 })) {
  test(`feedback ${kind}: tipo, duração e encerramento automático`, () => {
    const { manager, step } = clock()
    manager.push(kind, 'Mensagem')
    assert.equal(manager.current.kind, kind)
    assert.equal(manager.current.duration, duration)
    step(duration - 1)
    assert.equal(manager.current.remaining, 1)
    step(1)
    assert.equal(manager.current, null)
  })
}
test('uma mensagem por vez, fila e período próprio para a próxima', () => {
  const { manager, step } = clock()
  manager.push('info', 'Primeira'); manager.push('success', 'Segunda')
  step(5000)
  assert.equal(manager.current.message, 'Segunda')
  assert.equal(manager.current.remaining, 3500)
  assert.equal(manager.queue.length, 0)
})
test('duplicatas ativas, em fila e imediatamente após fechar são descartadas', () => {
  const { manager } = clock()
  manager.push('info', 'Mensagem'); manager.push('info', 'Mensagem')
  manager.push('success', 'Outra'); manager.push('success', 'Outra')
  assert.equal(manager.queue.length, 1)
  manager.dismiss(); manager.push('info', 'Mensagem')
  assert.equal(manager.queue.length, 0)
})
test('fechamento manual restaura estado vazio', () => {
  const { manager } = clock()
  manager.push('success', 'Concluído'); manager.dismiss()
  assert.equal(manager.current, null)
})
test('erro interrompe mensagem trivial e preserva o tempo restante dela', () => {
  const { manager, step } = clock()
  manager.push('success', 'OK'); step(1000)
  manager.push('error', 'Falha')
  assert.equal(manager.current.kind, 'error')
  manager.push('info', 'Informação')
  assert.equal(manager.current.kind, 'error')
  manager.dismiss(); manager.dismiss()
  assert.equal(manager.current.message, 'OK')
  assert.equal(manager.current.remaining, 2500)
})
test('fila limitada preserva erros prioritários', () => {
  const { manager } = clock()
  manager.push('error', 'Erro importante')
  for (let i = 0; i < 20; i++) manager.push('info', `Info ${i}`)
  manager.push('error', 'Outro erro')
  assert.equal(manager.queue.length, 8)
  assert.equal(manager.queue[0].kind, 'error')
})
test('documento oculto pausa tempo e retoma exatamente do ponto anterior', () => {
  const { manager, step } = clock()
  manager.push('info', 'Leia'); step(1000)
  manager.pause('hidden', true); step(100000)
  assert.equal(manager.current.remaining, 4000)
  manager.pause('hidden', false); step(1000)
  assert.equal(manager.current.remaining, 3000)
})
test('modal retém novas mensagens e pausas independentes não se sobrescrevem', () => {
  const { manager, step } = clock()
  manager.pause('modal', true); manager.pause('hidden', true)
  manager.push('success', 'OK'); step(10000)
  assert.equal(manager.current, null)
  manager.pause('modal', false)
  assert.equal(manager.current, null)
  manager.pause('hidden', false)
  assert.equal(manager.current.remaining, 3500)
})
test('confirmação e cancelamento retornam a decisão', async () => {
  const manager = new ConfirmationManager()
  const cancelled = manager.ask({ title: 'Excluir?', message: 'Teste' })
  manager.cancel(); assert.equal(await cancelled, false)
  const accepted = manager.ask({ title: 'Excluir?', message: 'Teste' })
  await manager.accept(); assert.equal(await accepted, true)
})
test('confirmação concorrente é recusada e não substitui a decisão original', async () => {
  const manager = new ConfirmationManager()
  const first = manager.ask({ title: 'Primeira', message: 'Teste' })
  assert.equal(await manager.ask({ title: 'Segunda', message: 'Teste' }), false)
  assert.equal(manager.options.title, 'Primeira')
  manager.cancel(); assert.equal(await first, false)
})
test('operação assíncrona bloqueia cancelamento e confirmação duplicada', async () => {
  const manager = new ConfirmationManager()
  let finish, calls = 0
  const decision = manager.ask({ title: 'Excluir', message: 'Teste', action: () => { calls++; return new Promise(resolve => { finish = resolve }) } })
  const pending = manager.accept()
  assert.equal(manager.busy, true)
  manager.cancel(); await manager.accept()
  assert.equal(calls, 1); assert.notEqual(manager.options, null)
  finish(); await pending
  assert.equal(await decision, true); assert.equal(manager.options, null)
})
test('falha real mantém diálogo aberto e não produz sucesso, permitindo nova tentativa', async () => {
  const manager = new ConfirmationManager()
  let fail = true, resolved = false
  const decision = manager.ask({ title: 'Excluir', message: 'Teste', action: async () => { if (fail) throw new Error('Falha no banco') } })
  decision.then(() => { resolved = true })
  await manager.accept()
  assert.equal(manager.error, 'Falha no banco'); assert.equal(manager.busy, false)
  assert.equal(resolved, false)
  fail = false; await manager.accept()
  assert.equal(await decision, true)
})
test('resultado falso da operação não é tratado como sucesso', async () => {
  const manager = new ConfirmationManager()
  const decision = manager.ask({ title: 'Cancelar', message: 'Teste', action: async () => false })
  await manager.accept()
  assert.notEqual(manager.error, '')
  assert.notEqual(manager.options, null)
  manager.cancel(); assert.equal(await decision, false)
})
