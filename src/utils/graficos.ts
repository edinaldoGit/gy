export interface PontoGrafico { data: string; valor: number; dataCivil?: string }
export function projetarGrafico(pontos: PontoGrafico[]) {
  const validos = pontos.filter(p => Number.isFinite(p.valor))
  if (!validos.length) return { pontos: [], minimo: 0, maximo: 1 }
  const menor = Math.min(...validos.map(p => p.valor)), maior = Math.max(...validos.map(p => p.valor))
  const margem = (maior - menor || Math.max(Math.abs(maior) * .1, 1)) * .12
  const minimo = Math.max(0, menor - margem), maximo = maior + margem
  const datas = validos.map((p, i) => p.dataCivil ? new Date(`${p.dataCivil}T12:00:00`).getTime() : i)
  const inicio = Math.min(...datas), fim = Math.max(...datas)
  return { minimo, maximo, pontos: validos.map((p, i) => ({ ...p, x: fim === inicio ? 320 : 65 + (datas[i]! - inicio) / (fim - inicio) * 550, y: 178 - (p.valor - minimo) / (maximo - minimo) * 150 })) }
}
