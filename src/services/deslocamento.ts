import { db } from '@/database/db'
import { comGravacaoGy } from '@/database/writeLock'
import { contextoLocal } from '@/utils/diasLocais'
import { criarDeslocamento, programacaoNaData } from '@/utils/programacaoEfetiva'

async function preparar(agora: Date) {
  const config = await db.configuracoes.get('principal')
  const contexto = contextoLocal(agora)
  const programacao = programacaoNaData(await db.programacoes.toArray(), contexto.dia, agora)
  if (!programacao || programacao.fichaId === null || programacao.fichaId !== config?.fichaAtivaId) throw new Error('Selecione uma ficha ativa antes de deslocar a programação.')
  const resultado = criarDeslocamento(programacao, await db.historico.toArray(), agora)
  const treinos = await db.treinos.where('fichaId').equals(programacao.fichaId).toArray()
  if (resultado.alteracoes.some(item => !treinos.some(treino => treino.id === item.treinoId))) throw new Error('A programação contém um treino que não está mais nesta ficha. Revise a ficha antes de deslocar.')
  const assinatura = JSON.stringify({ programacao, resultado })
  return { ...resultado, assinatura, programacao }
}

export const previaDeslocamento = (agora = new Date()) => db.transaction('r', db.configuracoes, db.programacoes, db.historico, db.treinos, () => preparar(agora))

export async function aplicarDeslocamento(assinatura: string, agora = new Date()) {
  await comGravacaoGy(() => db.transaction('rw', db.configuracoes, db.programacoes, db.historico, db.treinos, async () => {
    const previa = await preparar(agora)
    if (previa.assinatura !== assinatura) throw new Error('Os dados mudaram desde a prévia. Abra uma nova prévia antes de confirmar.')
    const { id: _id, ...anterior } = previa.programacao
    const contexto = contextoLocal(agora)
    await db.programacoes.add({ ...anterior, motivo: 'deslocamento', efetivaEm: agora, diaLocalVigencia: contexto.dia, fusoHorario: contexto.fuso, offsetMinutos: contexto.offsetMinutos, agenda: previa.agenda })
  }))
}
