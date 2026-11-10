import type { HistoricoTreino } from '../database/db.ts'
import { diaLocal } from './diasLocais.ts'

export function diaDaConclusao(sessao: Pick<HistoricoTreino, 'estado' | 'dataFim' | 'diaConclusaoLocal'>): string | null {
  if (sessao.estado !== 'finalizado' && !(sessao.estado === undefined && sessao.dataFim)) return null
  if (!sessao.dataFim || !Number.isFinite(new Date(sessao.dataFim).getTime())) return null
  return sessao.diaConclusaoLocal ?? diaLocal(new Date(sessao.dataFim))
}

export const concluiuNoDia = (sessoes: HistoricoTreino[], agora = new Date(), ignorarId?: number) =>
  sessoes.some(sessao => (ignorarId === undefined || sessao.id !== ignorarId) && diaDaConclusao(sessao) === diaLocal(agora))

export const mensagemLimiteDiario = 'Você já concluiu um treino hoje. O próximo poderá ser iniciado em outro dia.'
