import type { AgendaEfetiva, HistoricoTreino, ProgramacaoVigente } from '../database/db.ts'
import { dataCivil, diaLocal, proximoDia } from './diasLocais.ts'
import { diaDaConclusao } from './limiteDiario.ts'

type Grade = Pick<ProgramacaoVigente, 'treinos' | 'agenda'>
export function compromissoNoDia(programacao: Grade | undefined, dia: string) {
  if (!programacao) return null
  const agenda = programacao.agenda
  if (agenda && dia >= agenda.inicio && dia <= agenda.fim) return agenda.itens.find(item => item.dia === dia) ?? null
  return programacao.treinos.find(treino => treino.diasDaSemana.includes(dataCivil(dia)!.getUTCDay())) ?? null
}

export function programacaoNaData(programacoes: ProgramacaoVigente[], dia: string, agora = new Date()) {
  return programacoes.filter(item => item.efetivaEm <= agora && (item.diaLocalVigencia ?? diaLocal(item.efetivaEm)) <= dia)
    .sort((a, b) => a.efetivaEm.getTime() - b.efetivaEm.getTime() || (a.id ?? 0) - (b.id ?? 0)).at(-1)
}

export function criarDeslocamento(programacao: ProgramacaoVigente, sessoes: HistoricoTreino[], agora = new Date()) {
  const hoje = diaLocal(agora)
  if (programacao.motivo === 'deslocamento' && programacao.diaLocalVigencia === hoje) throw new Error('A programação já foi deslocada hoje. Aguarde outro dia para um novo ajuste.')
  if (sessoes.some(item => item.estado === 'em_andamento')) throw new Error('Finalize ou cancele a sessão em andamento antes de deslocar a programação.')
  const concluidos = new Set(sessoes.map(diaDaConclusao).filter((dia): dia is string => dia !== null))
  if (concluidos.has(hoje)) throw new Error('Você já concluiu um treino hoje. Ajuste a programação em outro dia.')
  const anterior = dataCivil(hoje)!
  anterior.setUTCDate(anterior.getUTCDate() - 1)
  const ontem = anterior.toISOString().slice(0, 10)
  const inicioVigencia = programacao.diaLocalVigencia ?? diaLocal(programacao.efetivaEm)
  const segunda = dataCivil(hoje)!
  segunda.setUTCDate(segunda.getUTCDate() - (segunda.getUTCDay() + 6) % 7)
  for (let dia = segunda.toISOString().slice(0, 10); dia < ontem; dia = proximoDia(dia)) {
    if (dia >= inicioVigencia && compromissoNoDia(programacao, dia) && !concluidos.has(dia)) throw new Error('Há treinos pendentes anteriores a ontem. Um ajuste de +1 dia ainda os deixaria no passado. Escolha manualmente o treino de hoje.')
  }
  const inicio = ontem >= inicioVigencia && !concluidos.has(ontem) && compromissoNoDia(programacao, ontem) ? ontem : hoje
  const alteracoes: Array<{ de: string; para: string; treinoId: number; treinoNome: string }> = []
  const domingo = dataCivil(hoje)!
  domingo.setUTCDate(domingo.getUTCDate() + (7 - domingo.getUTCDay()) % 7)
  let fim = domingo.toISOString().slice(0, 10)
  if (programacao.agenda && programacao.agenda.fim > fim) fim = programacao.agenda.fim
  let dia = inicio
  for (let i = 0; dia <= fim; i++, dia = proximoDia(dia)) {
    if (i >= 28) throw new Error('Não há uma folga disponível para encerrar o deslocamento sem criar conflitos.')
    const treino = compromissoNoDia(programacao, dia)
    if (treino && !concluidos.has(dia)) {
      const para = proximoDia(dia)
      alteracoes.push({ de: dia, para, treinoId: treino.treinoId, treinoNome: treino.treinoNome })
      if (dia === fim && compromissoNoDia(programacao, para)) fim = para
    }
  }
  if (!alteracoes.length) throw new Error('Não há treinos pendentes para deslocar.')
  if (alteracoes.some(item => item.para < hoje || concluidos.has(item.para))) throw new Error('O deslocamento conflita com um dia já concluído. Nenhuma programação foi alterada.')
  const agenda: AgendaEfetiva = { inicio: hoje, fim: alteracoes.at(-1)!.para > fim ? alteracoes.at(-1)!.para : fim, itens: alteracoes.map(item => ({ dia: item.para, treinoId: item.treinoId, treinoNome: item.treinoNome })) }
  return { agenda, alteracoes }
}
