import { reactive } from 'vue'
import { db } from '../src/database/db'
import { adaptadorDexie, exportarBackup, restaurarBackup } from '../src/services/backup'

const botao = document.querySelector<HTMLButtonElement>('#executar')!
const resultado = document.querySelector<HTMLElement>('#resultado')!
const permitido = location.hostname === '127.0.0.1' && location.port === '5188'
botao.disabled = !permitido
if (!permitido) resultado.textContent = 'Bloqueado: utilize somente a origem fictícia 127.0.0.1:5188.'
const iguais = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
botao.addEventListener('click', async () => {
  if (!permitido) return
  botao.disabled = true
  const linhas: string[] = []
  try {
    const original = await adaptadorDexie.lerSnapshot()
    if (!original.perfil.some(perfil => perfil.nome === 'Auditoria 12A') || !original.medidasCorporais.length) throw new Error('Fixture da auditoria não encontrada. Nenhuma restauração executada.')
    const documento = await exportarBackup(adaptadorDexie)
    await restaurarBackup(adaptadorDexie, reactive(documento))
    if (!iguais(original, await adaptadorDexie.lerSnapshot())) throw new Error('Round-trip diferente do snapshot original.')
    linhas.push('APROVADO · Documento Vue reativo restaura as oito tabelas no IndexedDB real.'); resultado.textContent = linhas.join('\n')

    let rejeitado = false
    try { await restaurarBackup(adaptadorDexie, { ...documento, versao: 99 } as never) } catch { rejeitado = true }
    if (!rejeitado || !iguais(original, await adaptadorDexie.lerSnapshot())) throw new Error('Arquivo inválido não preservou o snapshot.')
    linhas.push('APROVADO · Backup inválido não modifica registros.'); resultado.textContent = linhas.join('\n')

    const falhar = () => { throw new Error('Falha de escrita simulada na última tabela') }
    let rollback = false
    db.medidasCorporais.hook('creating', falhar)
    try { await restaurarBackup(adaptadorDexie, documento) } catch { rollback = true }
    finally { db.medidasCorporais.hook('creating').unsubscribe(falhar) }
    if (!rollback || !iguais(original, await adaptadorDexie.lerSnapshot())) throw new Error('Falha transacional não preservou o snapshot.')
    linhas.push('APROVADO · Falha após limpar/regravar tabelas causa rollback integral no IndexedDB real.')
    linhas.push('3/3 verificações aprovadas. Banco fictício preservado integralmente.')
  } catch (erro) { linhas.push(`FALHOU · ${erro instanceof Error ? erro.message : String(erro)}`) }
  finally { resultado.textContent = linhas.join('\n'); botao.disabled = false }
})
