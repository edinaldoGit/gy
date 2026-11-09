import test from 'node:test'
import assert from 'node:assert/strict'
import { gyEstaStandalone, podeOferecerInstalacao, motivoParaAdiarAtualizacao } from '../src/utils/pwaPolicy.ts'

test('reconhece os modos standalone e window-controls-overlay e o sinal legado da Apple', () => {
  assert.equal(gyEstaStandalone(true, false, false), true)
  assert.equal(gyEstaStandalone(false, true, false), true)
  assert.equal(gyEstaStandalone(false, false, true), true)
  assert.equal(gyEstaStandalone(false, false, false), false)
})

test('só oferece instalação nativa quando o navegador entregou um prompt utilizável', () => {
  assert.equal(podeOferecerInstalacao(false, false, true), true)
  assert.equal(podeOferecerInstalacao(false, false, false), false)
  assert.equal(podeOferecerInstalacao(true, false, true), false)
  assert.equal(podeOferecerInstalacao(false, true, true), false)
})

test('protege a sessão ativa antes de qualquer outra condição de atualização', () => {
  const estado = { treinoAtivo: true, gravacaoPendente: true, edicaoFicha: true, backupAtivo: true, outraAbaAtiva: true }
  assert.match(motivoParaAdiarAtualizacao(estado), /depois que você concluir ou cancelar o treino/)
})

test('bloqueia atualizações enquanto gravações, edição de ficha ou backup estão em andamento', () => {
  assert.match(motivoParaAdiarAtualizacao({ treinoAtivo: false, gravacaoPendente: true, edicaoFicha: false, backupAtivo: false, outraAbaAtiva: false }), /alterações sendo salvas/)
  assert.match(motivoParaAdiarAtualizacao({ treinoAtivo: false, gravacaoPendente: false, edicaoFicha: true, backupAtivo: false, outraAbaAtiva: false }), /edição da ficha/)
  assert.match(motivoParaAdiarAtualizacao({ treinoAtivo: false, gravacaoPendente: false, edicaoFicha: false, backupAtivo: true, outraAbaAtiva: false }), /backup ou gravação/)
})

test('adia atualização quando existe outra aba aberta', () => {
  assert.match(motivoParaAdiarAtualizacao({ treinoAtivo: false, gravacaoPendente: false, edicaoFicha: false, backupAtivo: false, outraAbaAtiva: true }), /outra aba/)
})

test('permite atualização quando nenhum estado crítico está ativo', () => {
  assert.equal(motivoParaAdiarAtualizacao({ treinoAtivo: false, gravacaoPendente: false, edicaoFicha: false, backupAtivo: false, outraAbaAtiva: false }), null)
})
