export function calcularRecorte(largura: number, altura: number, zoom: number, horizontal = 0, vertical = 0) {
  if (![largura, altura, zoom, horizontal, vertical].every(Number.isFinite) || largura <= 0 || altura <= 0 || zoom < 1 || zoom > 3) throw new Error('Dimensões ou zoom inválidos.')
  const lado = Math.min(largura, altura) / zoom
  const limitar = (n: number) => Math.max(-1, Math.min(1, n))
  return { x: (largura - lado) / 2 * (1 + limitar(horizontal)), y: (altura - lado) / 2 * (1 + limitar(vertical)), lado }
}
