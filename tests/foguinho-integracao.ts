import { db } from '../src/database/db'
import { contextoConclusao, dataCivil, diaLocal, proximoDia } from '../src/utils/diasLocais'
import { calcularFoguinho } from '../src/utils/sequencia'

const resultado = document.querySelector<HTMLPreElement>('#resultado')!
const mover = (dia: string, quantidade: number) => {
  for (let i = 0; i < Math.abs(quantidade); i++) {
    if (quantidade >= 0) dia = proximoDia(dia)
    else { const data = dataCivil(dia)!; data.setUTCDate(data.getUTCDate() - 1); dia = data.toISOString().slice(0, 10) }
  }
  return dia
}

document.querySelector<HTMLButtonElement>('#executar')!.addEventListener('click', async () => {
  if (location.hostname !== '127.0.0.1' || location.port !== '5197') {
    resultado.textContent = 'Bloqueado: este teste só pode ser usado na origem isolada 127.0.0.1:5197.'
    return
  }
  try {
    await db.open()
    await db.transaction('rw', [db.perfil, db.fichas, db.treinos, db.configuracoes, db.programacoes, db.historico], async () => {
      await Promise.all([db.perfil.clear(), db.fichas.clear(), db.treinos.clear(), db.configuracoes.clear(), db.programacoes.clear(), db.historico.clear()])
      const agora = new Date()
      const hoje = diaLocal(agora)
      const segunda = mover(hoje, -((new Date(`${hoje}T12:00:00`).getDay() + 6) % 7))
      const inicio = mover(segunda, -28)
      const fichaId = await db.fichas.add({ nome: 'Ficha teste fictícia', foco: 'Geral', corTema: 'cerulean', origem: 'local', criadoEm: agora, atualizadoEm: agora })
      await db.perfil.add({ nome: 'Perfil fictício de teste', idade: 30, peso: 70, altura: 170, criadoEm: agora })
      const treinos: Array<{ treinoId: number; treinoNome: string; diasDaSemana: number[] }> = []
      for (let diaSemana = 1; diaSemana <= 5; diaSemana++) {
        const treinoId = await db.treinos.add({ fichaId, nome: `Treino fictício ${diaSemana}`, foco: 'Teste', ordem: diaSemana, corTema: 'cerulean', diasDaSemana: [diaSemana], exercicios: [], criadoEm: agora, atualizadoEm: agora })
        treinos.push({ treinoId, treinoNome: `Treino fictício ${diaSemana}`, diasDaSemana: [diaSemana] })
      }
      await db.configuracoes.put({ chave: 'principal', fichaAtivaId: fichaId })
      await db.programacoes.add({ fichaId, efetivaEm: new Date(`${inicio}T10:00:00`), diaLocalVigencia: inicio, motivo: 'ativacao', fichaNome: 'Ficha teste fictícia', treinos })
      let id = 1
      for (let semana = 0; semana < 4; semana++) for (let offset = 0; offset < 5; offset++) {
        const dia = mover(inicio, semana * 7 + offset)
        const fim = new Date(`${dia}T10:00:00`)
        await db.historico.add({ id: id++, fichaId, treinoId: treinos[offset]!.treinoId, fichaNome: 'Ficha teste fictícia', treinoNome: treinos[offset]!.treinoNome, dataInicio: new Date(`${dia}T09:00:00`), dataFim: fim, ...contextoConclusao(fim), estado: 'finalizado', duracaoMinutos: 60, exerciciosRealizados: [] })
      }
      const treinoDeSegunda = treinos.find(treino => treino.diasDaSemana[0] === 1)!
      const segundaConclusao = new Date(`${segunda}T10:00:00`)
      await db.historico.add({ id: id++, fichaId, treinoId: treinoDeSegunda.treinoId, fichaNome: 'Ficha teste fictícia', treinoNome: treinoDeSegunda.treinoNome, dataInicio: new Date(`${segunda}T09:00:00`), dataFim: segundaConclusao, ...contextoConclusao(segundaConclusao), estado: 'finalizado', duracaoMinutos: 60, exerciciosRealizados: [] })
    })
    const programacoes = await db.programacoes.toArray()
    const sessoes = await db.historico.toArray()
    const estado = calcularFoguinho(programacoes, sessoes, new Date())
    if (estado.nivel !== 5 || estado.semanasConsecutivas !== 4 || estado.concluidosNoCiclo !== 1 || estado.obrigacoesNoCiclo !== 5) throw new Error(`Resultado inesperado: nível ${estado.nivel}, ${estado.semanasConsecutivas} semanas, ciclo ${estado.concluidosNoCiclo}/${estado.obrigacoesNoCiclo}.`)
    resultado.textContent = 'Jornada fictícia gravada no IndexedDB real. Gy Prime validado após 4 semanas completas; ciclo atual em 1/5, sem perder o nível. Abra Gy pelo link para conferir o badge e o modal. Dados limitados à origem isolada 127.0.0.1:5197.'
  } catch (erro) {
    resultado.textContent = erro instanceof Error ? erro.message : 'Falha inesperada no teste.'
  }
})
