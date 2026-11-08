export const diaLocal = (data: Date): string =>
  `${data.getFullYear().toString().padStart(4, '0')}-${(data.getMonth() + 1).toString().padStart(2, '0')}-${data.getDate().toString().padStart(2, '0')}`

export const dataCivil = (dia: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return null
  const [ano, mes, numero] = dia.split('-').map(Number) as [number, number, number]
  const data = new Date(0)
  data.setUTCFullYear(ano, mes - 1, numero)
  data.setUTCHours(0, 0, 0, 0)
  return data.toISOString().slice(0, 10) === dia ? data : null
}

// UTC é usado somente para aritmética de datas civis, sem durações de 24 horas ou efeitos de DST.
export const proximoDia = (dia: string): string => {
  const data = dataCivil(dia)
  if (!data) throw new Error('Dia civil inválido.')
  data.setUTCDate(data.getUTCDate() + 1)
  return data.toISOString().slice(0, 10)
}

export const contextoLocal = (data: Date) => ({
  dia: diaLocal(data),
  fuso: Intl.DateTimeFormat().resolvedOptions().timeZone,
  offsetMinutos: data.getTimezoneOffset()
})

export const contextoConclusao = (data: Date) => {
  const contexto = contextoLocal(data)
  return { diaConclusaoLocal: contexto.dia, fusoConclusao: contexto.fuso, offsetConclusaoMinutos: contexto.offsetMinutos }
}
