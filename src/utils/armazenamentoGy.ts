export function limparArmazenamentoTemporarioGy() {
  try {
    for (const chave of Object.keys(sessionStorage)) {
      if (chave.startsWith('gy:')) sessionStorage.removeItem(chave)
    }
  } catch { }
}
