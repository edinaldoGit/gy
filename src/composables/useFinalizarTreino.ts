import { sessaoProntaParaFinalizar } from '@/utils/exercicioSessao'
import { useRouter } from 'vue-router'
import { useTreinoStore } from '@/stores/treinoStore'
import { confirmation } from '@/composables/useConfirm'
export function useFinalizarTreino() {
  const store = useTreinoStore()
  const router = useRouter()
  return async () => {
    if (store.sessaoEstado !== 'em_andamento' || store.finalizando || store.cancelando) return false
    if (!sessaoProntaParaFinalizar(store.exerciciosExecucao)) {
      return confirmation.ask({ title: 'Há séries pendentes', message: 'Conclua os exercícios e confira os dados antes de finalizar o treino.', variant: 'warning', confirmText: 'Ir para o treino', cancelText: 'Continuar aqui', action: async () => { await router.push('/') } })
    }
    return confirmation.ask({ title: 'Finalizar treino?', message: 'Sua sessão será salva no histórico como concluída. Você poderá consultá-la a qualquer momento.', confirmText: 'Finalizar treino', cancelText: 'Continuar treinando', action: () => store.finalizarTreino() })
  }
}
