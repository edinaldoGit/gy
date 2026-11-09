<script setup lang="ts">
import { computed, ref } from 'vue'
import { Download, Smartphone, Wifi, WifiOff, RefreshCw, CircleCheck, CircleAlert, X, ChevronDown } from 'lucide-vue-next'
import { feedback } from '@/composables/useFeedback'
import { confirmation } from '@/composables/useConfirm'
import { pwaApp, instalarGy, mostrarGuiaInstalacao, fecharGuiaInstalacao, dispensarGuiaInstalacao, consultarOutrasAbas, verificarAtualizacoes, aplicarAtualizacaoGy } from '@/services/pwaRuntime'
import { useTreinoStore } from '@/stores/treinoStore'
import { useFichaStore } from '@/stores/fichaStore'
import { restauracaoBloqueada, operacaoBackupBloqueada } from '@/services/backupCoordinator'
import { gravacoesBackupBloqueadas, obterBloqueioExclusivoGy } from '@/database/writeLock'
import { motivoParaAdiarAtualizacao } from '@/utils/pwaPolicy'

const treino = useTreinoStore()
const ficha = useFichaStore()
const updatePreparando = ref(false)
const guiaIos = computed(() => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
const mostrarAcaoGuia = computed(() => !pwaApp.standalone && !pwaApp.installed && !pwaApp.installAvailable)
const treinoAtivo = () => treino.sessaoEstado === 'em_andamento' || treino.estadoAtual === 'execucao'

async function instalar() {
  try {
    const aceitou = await instalarGy()
    if (aceitou) feedback.success('O Gy foi adicionado ao dispositivo.')
  } catch { feedback.warning('O navegador não concluiu a instalação. Você pode tentar novamente.') }
}

async function verificar() {
  const resultado = await verificarAtualizacoes()
  if (resultado === 'offline') feedback.warning('Conecte-se à internet para verificar atualizações. O Gy continua disponível offline.')
  else if (resultado === 'available') feedback.info('Uma nova versão do Gy está disponível.')
  else if (resultado === 'current') feedback.success('Seu Gy já está atualizado.')
  else if (resultado === 'pending') feedback.info('A atualização ainda está sendo preparada. Verifique novamente em instantes.')
  else if (resultado === 'failed') feedback.warning('Não foi possível verificar agora. Tente novamente quando estiver online.')
  else if (resultado === 'unsupported') feedback.warning('Este navegador não disponibilizou o service worker para verificar atualizações.')
}

async function prepararAtualizacao() {
  const outrasAbas = await consultarOutrasAbas()
  const motivo = motivoParaAdiarAtualizacao({
    treinoAtivo: treinoAtivo(),
    gravacaoPendente: treino.estadoPersistencia === 'salvando' || treino.finalizando || treino.cancelando,
    edicaoFicha: ficha.salvando || !['lista', 'detalhe'].includes(ficha.modo),
    backupAtivo: restauracaoBloqueada.value || gravacoesBackupBloqueadas.value || operacaoBackupBloqueada.value,
    outraAbaAtiva: outrasAbas > 0
  })
  if (motivo) throw new Error(motivo)

  updatePreparando.value = true
  gravacoesBackupBloqueadas.value = true
  let liberar: (() => void) | undefined
  try {
    liberar = await obterBloqueioExclusivoGy()
    if (treino.estadoPersistencia === 'erro') throw new Error('Há uma falha de gravação pendente. Resolva o aviso no treino antes de atualizar.')
    const abasRestantes = await consultarOutrasAbas()
    const novoMotivo = motivoParaAdiarAtualizacao({
      treinoAtivo: treinoAtivo(),
      gravacaoPendente: treino.estadoPersistencia === 'salvando' || treino.finalizando || treino.cancelando,
      edicaoFicha: ficha.salvando || !['lista', 'detalhe'].includes(ficha.modo),
      backupAtivo: restauracaoBloqueada.value || operacaoBackupBloqueada.value,
      outraAbaAtiva: abasRestantes > 0
    })
    if (novoMotivo) throw new Error(novoMotivo)
    await aplicarAtualizacaoGy()
  } catch (erro) {
    liberar?.()
    liberar = undefined
    gravacoesBackupBloqueadas.value = false
    updatePreparando.value = false
    throw erro
  }
}

async function atualizarAgora() {
  const outrasAbas = await consultarOutrasAbas()
  if (outrasAbas > 0) {
    feedback.warning('Feche as outras abas do Gy antes de aplicar a atualização.')
    return
  }
  await confirmation.ask({
    title: 'Atualização disponível!',
    message: 'Uma nova versão do Gy está pronta para instalar. Seus dados locais serão mantidos.',
    details: 'A atualização recarregará o aplicativo. Você pode adiar e continuar usando esta versão.',
    variant: 'info', icon: 'info', cancelText: 'Mais tarde', confirmText: 'Atualizar agora',
    action: prepararAtualizacao
  })
}
</script>

<template>
  <section class="rounded-3xl border border-bubblegum-100 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="aplicativo-gy-titulo" :aria-busy="updatePreparando || pwaApp.checkingUpdates">
    <div class="flex items-start gap-3">
      <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bubblegum-50 text-bubblegum-600"><Smartphone :size="21" aria-hidden="true" /></span>
      <div class="min-w-0 flex-1">
        <h2 id="aplicativo-gy-titulo" class="text-lg font-black text-whitesmoke-900">Aplicativo e atualizações</h2>
        <p class="mt-1 text-sm leading-relaxed text-whitesmoke-500">Versão {{ pwaApp.version }} · {{ pwaApp.standalone ? 'Aberto como aplicativo' : pwaApp.installed ? 'Instalação detectada' : 'Usando no navegador' }}</p>
      </div>
      <component :is="pwaApp.online ? Wifi : WifiOff" :size="18" class="mt-1 shrink-0 text-whitesmoke-400" :aria-label="pwaApp.online ? 'Conectado' : 'Offline'" />
    </div>

    <p class="mt-4 rounded-2xl bg-whitesmoke-50 p-3 text-xs leading-relaxed text-whitesmoke-600">O Gy armazena seus dados neste dispositivo e funciona offline depois que os recursos necessários foram carregados. O sistema pode remover dados locais; mantenha uma cópia de backup.</p>

    <div v-if="!pwaApp.standalone && !pwaApp.installed" class="mt-4">
      <button v-if="pwaApp.installAvailable" type="button" :disabled="pwaApp.installing" class="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-bubblegum-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-bubblegum-600 disabled:opacity-60" @click="instalar">
        <Download :size="18" aria-hidden="true" />{{ pwaApp.installing ? 'Aguardando o navegador…' : 'Instalar Gy' }}
      </button>
      <button v-else-if="mostrarAcaoGuia" type="button" class="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-bubblegum-200 px-4 py-2.5 text-sm font-bold text-bubblegum-700 transition hover:bg-bubblegum-50" :aria-expanded="pwaApp.installGuideVisible" @click="pwaApp.installGuideVisible ? fecharGuiaInstalacao() : mostrarGuiaInstalacao()">
        <Smartphone :size="17" aria-hidden="true" />{{ pwaApp.installGuideVisible ? 'Fechar instruções' : 'Como instalar no dispositivo' }}<ChevronDown :size="16" :class="pwaApp.installGuideVisible ? 'rotate-180' : ''" aria-hidden="true" />
      </button>
      <div v-if="pwaApp.installGuideVisible" class="mt-3 rounded-2xl border border-bubblegum-100 bg-bubblegum-50/50 p-4 text-sm leading-relaxed text-whitesmoke-700">
        <ol v-if="guiaIos" class="list-inside list-decimal space-y-1.5">
          <li>Abra o Gy em um navegador que permita adicionar páginas à Tela de Início. O Safari é uma referência comum; as opções variam conforme o navegador e a versão do iOS.</li>
          <li>Abra o menu de compartilhamento ou opções da página e escolha <strong>Adicionar à Tela de Início</strong>, se disponível.</li>
          <li>Ative <strong>Abrir como App</strong> quando essa opção aparecer e confirme em <strong>Adicionar</strong>.</li>
        </ol>
        <ol v-else class="list-inside list-decimal space-y-1.5">
          <li>Abra o menu de opções do navegador nesta página.</li>
          <li>Se disponível, escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong> e confirme.</li>
        </ol>
        <div class="mt-3 flex items-center justify-between gap-3">
          <button type="button" class="min-h-10 text-xs font-bold text-bubblegum-700 underline underline-offset-2" @click="dispensarGuiaInstalacao">Não mostrar automaticamente</button>
          <button type="button" class="flex min-h-10 items-center gap-1 text-xs font-bold text-whitesmoke-500" aria-label="Fechar instruções" @click="fecharGuiaInstalacao"><X :size="16" /> Fechar</button>
        </div>
      </div>
    </div>

    <div v-if="pwaApp.updateAvailable" class="mt-4 rounded-2xl border border-cerulean-200 bg-cerulean-50 p-4" role="status">
      <div class="flex items-start gap-2 text-sm font-bold text-cerulean-800"><CircleAlert :size="18" class="mt-0.5 shrink-0" aria-hidden="true" /><span>Uma nova versão do Gy está disponível.</span></div>
      <p v-if="treinoAtivo()" class="mt-2 text-xs leading-relaxed text-cerulean-800">A atualização ficará disponível depois do treino. Você pode continuar registrando suas séries normalmente.</p>
      <button v-else type="button" class="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cerulean-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cerulean-700" @click="atualizarAgora">Atualizar agora</button>
      <p v-if="pwaApp.otherTabs" class="mt-2 text-xs text-cerulean-800">Feche as outras abas do Gy antes de aplicar a atualização.</p>
    </div>

    <div class="mt-4 grid gap-2 sm:grid-cols-2">
      <button type="button" :disabled="pwaApp.checkingUpdates || !pwaApp.online || !pwaApp.updateSupported" class="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-bubblegum-200 px-4 py-2.5 text-sm font-bold text-bubblegum-700 transition hover:bg-bubblegum-50 disabled:cursor-not-allowed disabled:opacity-50" @click="verificar">
        <RefreshCw :size="17" :class="pwaApp.checkingUpdates ? 'animate-spin' : ''" aria-hidden="true" />{{ pwaApp.checkingUpdates ? 'Verificando…' : 'Verificar atualizações' }}
      </button>
      <p class="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-whitesmoke-50 px-3 text-center text-xs text-whitesmoke-500"><CircleCheck :size="16" class="shrink-0 text-teal-600" aria-hidden="true" />Seus dados locais não são apagados por atualizações do app.</p>
    </div>
  </section>
</template>
