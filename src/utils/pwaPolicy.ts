export function gyEstaStandalone(displayStandalone: boolean, windowControlsOverlay: boolean, appleStandalone: boolean) {
  return displayStandalone || windowControlsOverlay || appleStandalone
}

export function podeOferecerInstalacao(standalone: boolean, instalado: boolean, temPrompt: boolean) {
  return !standalone && !instalado && temPrompt
}

export interface EstadoAtualizacaoGy {
  treinoAtivo: boolean
  gravacaoPendente: boolean
  edicaoFicha: boolean
  backupAtivo: boolean
  outraAbaAtiva: boolean
}

export function motivoParaAdiarAtualizacao(estado: EstadoAtualizacaoGy) {
  if (estado.treinoAtivo) return 'A atualização ficará disponível depois que você concluir ou cancelar o treino.'
  if (estado.gravacaoPendente) return 'Há alterações sendo salvas. Aguarde antes de atualizar.'
  if (estado.edicaoFicha) return 'Finalize ou saia da edição da ficha antes de atualizar. Suas alterações continuam preservadas nesta tela.'
  if (estado.backupAtivo) return 'Há uma operação de backup ou gravação em andamento. Aguarde antes de atualizar.'
  if (estado.outraAbaAtiva) return 'O Gy está aberto em outra aba. Feche as outras abas para proteger alterações que ainda não tenham sido salvas e tente novamente.'
  return null
}
