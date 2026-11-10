<script setup lang="ts">
import { feedback } from '@/composables/useFeedback'
import { confirmation } from '@/composables/useConfirm'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { UserRound, Ruler, Weight, CalendarDays, Activity, Trash2, Pencil } from 'lucide-vue-next'
import SectionPageHeader from '@/components/layout/SectionPageHeader.vue'
import BackupDados from '@/components/perfil/BackupDados.vue'
import { operacaoBackupBloqueada, iniciarRestauracaoExclusiva, restauracaoBloqueada } from '@/services/backupCoordinator'
import { excluirDadosDaConta } from '@/services/exclusaoConta'
import { useTreinoStore } from '@/stores/treinoStore'
import EditarPerfil from '@/components/perfil/EditarPerfil.vue'
import { usePerfilAtual } from '@/composables/usePerfilAtual'
import AplicativoGy from '@/components/perfil/AplicativoGy.vue'

const router = useRouter()
const { perfil: usuario, carregando: carregandoPerfil } = usePerfilAtual()
const editando = ref(false)
const treino = useTreinoStore()

const imc = computed(() => {
  if (!usuario.value) return '0.0'
  const alturaEmMetros = usuario.value.altura / 100
  const calculo = usuario.value.peso / (alturaEmMetros * alturaEmMetros)
  return calculo.toFixed(1)
})

const dataCriacao = computed(() => {
  if (!usuario.value?.criadoEm) return ''
  return new Intl.DateTimeFormat('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  }).format(usuario.value.criadoEm)
})

const apagarDados = async () => {
  let coordenacao: Awaited<ReturnType<typeof iniciarRestauracaoExclusiva>> | null = null
  let exclusaoConcluida = false
  const confirmado = await confirmation.ask({
    title: 'Apagar todos os dados?',
    message: 'Isso removerá permanentemente seu perfil, suas fichas, treinos, histórico e registros de evolução deste dispositivo. Essa ação não pode ser desfeita sem um backup.',
    details: 'Exporte um backup antes de continuar se quiser guardar uma cópia. O catálogo oficial de exercícios e os recursos do Gy serão mantidos.',
    variant: 'error', icon: 'trash', cancelText: 'Manter meus dados', confirmText: 'Apagar tudo',
    action: async () => {
      operacaoBackupBloqueada.value = true
      try {
        coordenacao = await iniciarRestauracaoExclusiva()
        restauracaoBloqueada.value = true
        await treino.pausarParaBackup()
        await coordenacao.bloquearGravacoes()
        await excluirDadosDaConta()
        exclusaoConcluida = true
        coordenacao.concluir()
        return true
      } catch (erro) {
        coordenacao?.cancelar()
        treino.retomarAposBackup()
        throw erro
      } finally {
        operacaoBackupBloqueada.value = false
      }
    }
  })
  if (confirmado && exclusaoConcluida) {
    feedback.success('Todos os dados desta conta foram apagados.')
    window.location.replace(router.resolve('/onboarding').href)
  }
}
</script>

<template>
  <div v-if="usuario" class="flex flex-col gap-6 pb-20 animate-in fade-in duration-500">
    <SectionPageHeader titulo="Meu Perfil" subtitulo="Seus dados e configurações" tema="perfil" />
    
    <div class="flex flex-col items-center -mt-2">
      <div class="w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-white relative z-10">
        <img v-if="usuario.fotoPerfil" :src="usuario.fotoPerfil" alt="Foto do perfil" class="w-full h-full object-cover" />
        <UserRound v-else :size="48" class="text-whitesmoke-300" />
      </div>
      
      <div class="bg-white w-full max-w-sm rounded-3xl pt-16 pb-6 px-6 -mt-14 shadow-sm flex flex-col items-center border border-whitesmoke-200">
        <h2 class="text-2xl font-black text-whitesmoke-950">{{ usuario.nome }}</h2>
        <div class="flex items-center gap-1.5 text-whitesmoke-500 mt-1">
          <CalendarDays :size="14" />
          <span class="text-xs font-medium capitalize">Membro desde {{ dataCriacao }}</span>
        </div>
      </div>
    </div>

    <button type="button" class="min-h-12 rounded-2xl bg-bubblegum-500 text-white font-bold flex items-center justify-center gap-2" @click="editando = true"><Pencil :size="18" />Editar meus dados</button>

    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white rounded-3xl p-5 shadow-sm border border-whitesmoke-200 flex flex-col gap-3">
        <div class="w-10 h-10 rounded-full bg-bubblegum-50 flex items-center justify-center text-bubblegum-500">
          <Ruler :size="20" />
        </div>
        <div>
          <span class="block text-xs font-bold text-whitesmoke-400 uppercase tracking-wider mb-0.5">Altura</span>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-black text-whitesmoke-950">{{ usuario.altura }}</span>
            <span class="text-sm font-bold text-whitesmoke-500">cm</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-3xl p-5 shadow-sm border border-whitesmoke-200 flex flex-col gap-3">
        <div class="w-10 h-10 rounded-full bg-bubblegum-50 flex items-center justify-center text-bubblegum-500">
          <Weight :size="20" />
        </div>
        <div>
          <span class="block text-xs font-bold text-whitesmoke-400 uppercase tracking-wider mb-0.5">Peso</span>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-black text-whitesmoke-950">{{ usuario.peso }}</span>
            <span class="text-sm font-bold text-whitesmoke-500">kg</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-3xl p-5 shadow-sm border border-whitesmoke-200 flex flex-col gap-3">
        <div class="w-10 h-10 rounded-full bg-bubblegum-50 flex items-center justify-center text-bubblegum-500">
          <UserRound :size="20" />
        </div>
        <div>
          <span class="block text-xs font-bold text-whitesmoke-400 uppercase tracking-wider mb-0.5">Idade</span>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-black text-whitesmoke-950">{{ usuario.idade }}</span>
            <span class="text-sm font-bold text-whitesmoke-500">anos</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-3xl p-5 shadow-sm border border-whitesmoke-200 flex flex-col gap-3">
        <div class="w-10 h-10 rounded-full bg-bubblegum-50 flex items-center justify-center text-bubblegum-500">
          <Activity :size="20" />
        </div>
        <div>
          <span class="block text-xs font-bold text-whitesmoke-400 uppercase tracking-wider mb-0.5">IMC</span>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-black text-whitesmoke-950">{{ imc }}</span>
          </div>
        </div>
      </div>
    </div>

    <BackupDados />

    <AplicativoGy />

    <div class="mt-4">
      <button 
        @click="apagarDados"
        class="w-full bg-white border border-red-100 text-red-500 hover:bg-red-50 font-bold py-4 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-[0.98]"
      >
        <Trash2 :size="20" class="mr-2" />
        Apagar todos os dados
      </button>
      <p class="text-[10px] text-center text-whitesmoke-400 mt-3 px-4">
        Apaga perfil, fichas, treinos, histórico, medidas e cargas deste dispositivo.
      </p>
    </div>

  </div>
  
  <div v-else-if="carregandoPerfil" class="flex flex-col items-center justify-center h-64">
    <div class="w-8 h-8 border-4 border-whitesmoke-200 border-t-bubblegum-500 rounded-full animate-spin"></div>
  </div>
  <div v-else class="flex flex-col gap-5 pb-20 animate-in fade-in duration-500">
    <SectionPageHeader titulo="Meu Perfil" subtitulo="Restaure seus dados ou configure o Gy" tema="perfil" />
    <p class="px-2 text-sm leading-relaxed text-whitesmoke-600">Você pode restaurar um backup de outro dispositivo ou concluir o cadastro para começar a usar o Gy.</p>
    <BackupDados />
    <button type="button" class="min-h-11 rounded-2xl border border-whitesmoke-200 bg-white px-4 text-sm font-bold text-whitesmoke-700" @click="router.push('/onboarding')">Ir para o cadastro</button>
  </div>
  <Transition name="gy-modal" appear><EditarPerfil v-if="usuario && editando" :perfil="usuario" @fechar="editando = false" /></Transition>
</template>
