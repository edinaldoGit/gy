import { shallowRef } from 'vue'
import { gravacoesBackupBloqueadas, obterBloqueioExclusivoGy } from '../database/writeLock'
import { limparArmazenamentoTemporarioGy } from '../utils/armazenamentoGy'

const canalNome = 'gy-backup-restauracao-v1'
const idAba = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
const online = new Map<string, number>()
export const restauracaoBloqueada = shallowRef(false)
export const operacaoBackupBloqueada = shallowRef(false)

type Mensagem = { tipo: 'hello' | 'prepare' | 'ready' | 'failed' | 'release' | 'done'; aba: string; operacao?: string }
let canal: BroadcastChannel | null = null
let heartbeat: ReturnType<typeof setInterval> | undefined
let prepararAba: (() => Promise<void>) | undefined
let retomarAba: (() => void) | undefined
let operacaoAtiva: string | null = null
let liberarWebLock: (() => void) | undefined
let liberarDadosLock: (() => void) | undefined
let restauracoesPendentes = new Map<string, { resolver: () => void; rejeitar: (erro: Error) => void; aguardando: Set<string> }>()

const enviar = (mensagem: Mensagem) => canal?.postMessage(mensagem)

const receber = (evento: MessageEvent<Mensagem>) => {
  const mensagem = evento.data
  if (!mensagem || mensagem.aba === idAba) return
  if (mensagem.tipo === 'hello') {
    online.set(mensagem.aba, Date.now())
    enviar({ tipo: 'hello', aba: idAba })
  } else if (mensagem.tipo === 'ready' || mensagem.tipo === 'failed') {
    const pendente = mensagem.operacao ? restauracoesPendentes.get(mensagem.operacao) : undefined
    if (!pendente) return
    if (mensagem.tipo === 'failed') {
      pendente.rejeitar(new Error('Outra aba não conseguiu salvar as alterações pendentes. Feche as outras abas ou tente novamente.'))
      return
    }
    pendente.aguardando.delete(mensagem.aba)
    if (!pendente.aguardando.size) pendente.resolver()
  } else if (mensagem.tipo === 'prepare' && mensagem.operacao && prepararAba) {
    restauracaoBloqueada.value = true
    void prepararAba().then(() => {
      gravacoesBackupBloqueadas.value = true
      enviar({ tipo: 'ready', aba: idAba, operacao: mensagem.operacao })
    }).catch(() => {
      restauracaoBloqueada.value = false
      gravacoesBackupBloqueadas.value = false
      retomarAba?.()
      enviar({ tipo: 'failed', aba: idAba, operacao: mensagem.operacao })
    })
  } else if (mensagem.tipo === 'release') {
    restauracaoBloqueada.value = false
    gravacoesBackupBloqueadas.value = false
    retomarAba?.()
  } else if (mensagem.tipo === 'done') {
    restauracaoBloqueada.value = true
    gravacoesBackupBloqueadas.value = true
    limparArmazenamentoTemporarioGy()
    window.location.reload()
  }
}

const lerBloqueio = () => {
  if (operacaoAtiva) return
  try {
    const registro = localStorage.getItem('gy:backup-restauracao')
    const limite = Number(registro?.split(':').at(-1))
    restauracaoBloqueada.value = Number.isFinite(limite) && limite > Date.now()
    gravacoesBackupBloqueadas.value = restauracaoBloqueada.value
    if (Number.isFinite(limite) && limite <= Date.now()) localStorage.removeItem('gy:backup-restauracao')
  } catch { }
}

export function iniciarCoordenacaoBackup(preparar: () => Promise<void>, retomar: () => void) {
  prepararAba = preparar
  retomarAba = retomar
  lerBloqueio()
  if (typeof BroadcastChannel !== 'undefined' && !canal) {
    canal = new BroadcastChannel(canalNome)
    canal.addEventListener('message', receber)
    enviar({ tipo: 'hello', aba: idAba })
    heartbeat = setInterval(() => {
      if (operacaoAtiva) {
        try { localStorage.setItem('gy:backup-restauracao', `${operacaoAtiva}:${Date.now() + 120000}`) } catch { }
      }
      lerBloqueio()
      const limite = Date.now() - 7000
      for (const [aba, visto] of online) if (visto < limite) online.delete(aba)
      enviar({ tipo: 'hello', aba: idAba })
    }, 2000)
  }
  return () => {
    prepararAba = undefined
    retomarAba = undefined
    if (heartbeat) clearInterval(heartbeat)
    heartbeat = undefined
    canal?.removeEventListener('message', receber)
    canal?.close()
    canal = null
  }
}

export async function iniciarRestauracaoExclusiva() {
  if (operacaoAtiva) throw new Error('Já existe uma restauração em andamento nesta aba.')
  const operacao = `${idAba}:${Date.now()}`
  operacaoAtiva = operacao
  try {
    if (navigator.locks?.request) {
      let concedido!: () => void
      let negado!: (erro: Error) => void
      const pronto = new Promise<void>((resolve, reject) => { concedido = resolve; negado = reject })
      const esperaLiberacao = new Promise<void>(resolve => { liberarWebLock = resolve })
      void navigator.locks.request('gy-backup-restauracao', { mode: 'exclusive', ifAvailable: true }, async lock => {
        if (!lock) { negado(new Error('Outra aba já está restaurando dados. Aguarde e tente novamente.')); return }
        concedido()
        await esperaLiberacao
      }).catch(erro => negado(erro instanceof Error ? erro : new Error('Não foi possível bloquear a restauração.')))
      await pronto
    } else {
      const chave = 'gy:backup-restauracao'
      const atual = localStorage.getItem(chave)
      if (atual && Number(atual.split(':').at(-1)) > Date.now()) throw new Error('Outra aba já está restaurando dados. Aguarde e tente novamente.')
      localStorage.setItem(chave, `${operacao}:${Date.now() + 120000}`)
    }
    localStorage.setItem('gy:backup-restauracao', `${operacao}:${Date.now() + 120000}`)

    const aguardando = new Set([...online.keys()].filter(aba => Date.now() - (online.get(aba) ?? 0) < 7000))
    if (aguardando.size) {
      const pronto = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Não foi possível preparar as outras abas para a restauração.')), 10000)
        restauracoesPendentes.set(operacao, {
          aguardando,
          resolver: () => { clearTimeout(timer); resolve() },
          rejeitar: erro => { clearTimeout(timer); reject(erro) }
        })
      })
      enviar({ tipo: 'prepare', aba: idAba, operacao })
      await pronto
      restauracoesPendentes.delete(operacao)
    }
    return {
      async bloquearGravacoes() {
        gravacoesBackupBloqueadas.value = true
        liberarDadosLock = await obterBloqueioExclusivoGy()
      },
      cancelar: () => encerrarRestauracao(operacao),
      concluir: () => { enviar({ tipo: 'done', aba: idAba, operacao }); encerrarRestauracao(operacao, false) }
    }
  } catch (erro) {
    encerrarRestauracao(operacao)
    throw erro
  }
}

function encerrarRestauracao(operacao: string, notificar = true) {
  if (operacaoAtiva !== operacao) return
  if (notificar) enviar({ tipo: 'release', aba: idAba, operacao })
  restauracaoBloqueada.value = false
  liberarDadosLock?.()
  liberarDadosLock = undefined
  gravacoesBackupBloqueadas.value = false
  liberarWebLock?.()
  liberarWebLock = undefined
  try {
    const chave = 'gy:backup-restauracao'
    if (localStorage.getItem(chave)?.startsWith(`${operacao}:`)) localStorage.removeItem(chave)
  } catch { }
  restauracoesPendentes.delete(operacao)
  operacaoAtiva = null
}
