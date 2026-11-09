<script setup lang="ts">
import { ref } from 'vue'
import { Download, Upload, ShieldAlert, FileArchive, LoaderCircle } from 'lucide-vue-next'
import { feedback } from '@/composables/useFeedback'
import { confirmation } from '@/composables/useConfirm'
import { useTreinoStore } from '@/stores/treinoStore'
import { adaptadorDexie, arquivoBackup, exportarBackup, lerArquivoBackup, resumoBackup, restaurarBackup, TAMANHO_MAXIMO_BACKUP, type DocumentoBackup } from '@/services/backup'
import { iniciarRestauracaoExclusiva, restauracaoBloqueada } from '@/services/backupCoordinator'

const treino = useTreinoStore()
const seletor = ref<HTMLInputElement | null>(null)
const documento = ref<DocumentoBackup | null>(null)
const erro = ref('')
const exportando = ref(false)
const lendo = ref(false)
const restaurando = ref(false)

const exportar = async () => {
  if (exportando.value || restaurando.value) return
  exportando.value = true
  feedback.info('Preparando seu backup…')
  try {
    if (treino.sessaoEstado === 'em_andamento' && !(await treino.persistirSessaoAgora())) throw new Error('Não foi possível salvar o treino em andamento. Tente novamente antes de exportar.')
    const dados = await exportarBackup(adaptadorDexie)
    const arquivo = arquivoBackup(dados)
    const url = URL.createObjectURL(new Blob([arquivo.conteudo], { type: 'application/json;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = arquivo.nome
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    feedback.success('O arquivo de backup foi preparado para download.')
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível gerar o backup.'
    feedback.error(erro.value)
  } finally { exportando.value = false }
}

const abrirSeletor = () => { erro.value = ''; seletor.value?.click() }
const selecionarArquivo = async (evento: Event) => {
  const input = evento.target as HTMLInputElement
  const arquivo = input.files?.[0]
  documento.value = null
  erro.value = ''
  if (!arquivo) return
  lendo.value = true
  try {
    if (arquivo.size > TAMANHO_MAXIMO_BACKUP) throw new Error('O arquivo excede o tamanho máximo de 50 MB.')
    documento.value = lerArquivoBackup(await arquivo.text())
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível ler o arquivo.'
    feedback.error(erro.value)
  } finally { lendo.value = false; input.value = '' }
}

const exportarAntesDeRestaurar = async () => {
  await exportar()
}

const solicitarRestauracao = async () => {
  if (!documento.value || restaurando.value || exportando.value) return
  restaurando.value = true
  let coordenacao: Awaited<ReturnType<typeof iniciarRestauracaoExclusiva>> | null = null
  let concluiu = false
  try {
    coordenacao = await iniciarRestauracaoExclusiva()
    restauracaoBloqueada.value = true
    await treino.pausarParaBackup()
    await coordenacao.bloquearGravacoes()
    const confirmou = await confirmation.ask({
      title: 'Restaurar este backup?',
      message: 'Suas fichas, treinos, histórico e demais dados atuais serão substituídos pelo conteúdo do arquivo selecionado.',
      details: 'Essa operação não poderá ser desfeita sem uma cópia dos dados anteriores.',
      variant: 'error', icon: 'warning', cancelText: 'Cancelar', confirmText: 'Restaurar e substituir',
      action: async () => {
        await restaurarBackup(adaptadorDexie, documento.value!)
        feedback.success('Seus dados foram restaurados com sucesso!')
        documento.value = null
        concluiu = true
        setTimeout(() => { coordenacao?.concluir(); window.location.reload() }, 1100)
        return true
      }
    })
    if (!confirmou && !concluiu) treino.retomarAposBackup()
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível iniciar a restauração.'
    feedback.error(erro.value)
    treino.retomarAposBackup()
  } finally {
    if (!concluiu) coordenacao?.cancelar()
    restaurando.value = false
  }
}

const quantidadeCatalogo = () => documento.value?.tabelas.catalogo.length ?? 0
const resumo = () => documento.value ? resumoBackup(documento.value) : null
const dataArquivo = (data: Date) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(data)
</script>

<template>
  <section class="rounded-3xl border border-bubblegum-100 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="backup-title">
    <div class="flex items-start gap-3">
      <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bubblegum-50 text-bubblegum-600"><FileArchive :size="21" /></span>
      <div class="min-w-0">
        <h2 id="backup-title" class="text-lg font-black text-whitesmoke-900">Dados e backup</h2>
        <p class="mt-1 text-sm leading-relaxed text-whitesmoke-500">Exporte ou restaure seus dados neste dispositivo.</p>
      </div>
    </div>

    <div class="mt-5 grid gap-3 sm:grid-cols-2">
      <button type="button" :disabled="exportando || restaurando" class="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-bubblegum-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-bubblegum-600 disabled:opacity-60" @click="exportar">
        <LoaderCircle v-if="exportando" :size="18" class="animate-spin" /><Download v-else :size="18" />{{ exportando ? 'Preparando…' : 'Exportar meus dados' }}
      </button>
      <button type="button" :disabled="lendo || exportando || restaurando" class="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-bubblegum-200 bg-white px-4 py-3 text-sm font-bold text-bubblegum-700 transition hover:bg-bubblegum-50 disabled:opacity-60" @click="abrirSeletor">
        <LoaderCircle v-if="lendo" :size="18" class="animate-spin" /><Upload v-else :size="18" />{{ lendo ? 'Lendo arquivo…' : 'Restaurar backup' }}
      </button>
      <input ref="seletor" class="sr-only" type="file" accept=".json,application/json" aria-label="Selecionar arquivo de backup do Gy" @change="selecionarArquivo" />
    </div>

    <p class="mt-4 flex items-start gap-2 text-xs leading-relaxed text-whitesmoke-500"><ShieldAlert :size="16" class="mt-0.5 shrink-0 text-bubblegum-500" />O arquivo contém informações pessoais e não é criptografado. Guarde-o em um local seguro.</p>

    <div v-if="erro" role="alert" class="mt-4 rounded-2xl border border-bubblegum-100 bg-bubblegum-50 p-3 text-sm leading-relaxed text-bubblegum-800">{{ erro }}</div>

    <div v-if="documento && resumo()" class="mt-5 rounded-2xl border border-whitesmoke-200 bg-whitesmoke-50 p-4">
      <h3 class="font-bold text-whitesmoke-900">Prévia do backup</h3>
      <p class="mt-1 text-xs text-whitesmoke-500">Criado em {{ dataArquivo(resumo()!.criadoEm) }} · versão {{ resumo()!.versao }}</p>
      <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div><dt class="text-xs text-whitesmoke-500">Perfil</dt><dd class="font-semibold text-whitesmoke-800">{{ resumo()!.possuiPerfil ? 'Incluído' : 'Sem perfil' }}</dd></div>
        <div><dt class="text-xs text-whitesmoke-500">Fichas</dt><dd class="font-semibold text-whitesmoke-800">{{ resumo()!.fichas }}</dd></div>
        <div><dt class="text-xs text-whitesmoke-500">Ficha ativa</dt><dd class="break-words font-semibold text-whitesmoke-800">{{ resumo()!.fichaAtiva || 'Nenhuma' }}</dd></div>
        <div><dt class="text-xs text-whitesmoke-500">Treinos e exercícios</dt><dd class="font-semibold text-whitesmoke-800">{{ resumo()!.treinos }} · {{ resumo()!.exercicios }} exercícios</dd></div>
        <div><dt class="text-xs text-whitesmoke-500">Sessões históricas</dt><dd class="font-semibold text-whitesmoke-800">{{ resumo()!.sessoes }}</dd></div>
        <div><dt class="text-xs text-whitesmoke-500">Programações históricas</dt><dd class="font-semibold text-whitesmoke-800">{{ resumo()!.programacoes }}</dd></div>
        <div v-if="resumo()!.sessaoEmAndamento" class="col-span-2 rounded-xl bg-amber-50 p-2 text-xs font-semibold text-amber-800">Este backup inclui uma sessão em andamento, que poderá ser retomada.</div>
      </dl>
      <p class="mt-4 rounded-xl bg-bubblegum-50 p-3 text-xs leading-relaxed text-bubblegum-800">Restaurar este backup substituirá os dados atuais do Gy neste dispositivo. Essa operação não poderá ser desfeita sem uma cópia dos dados anteriores.</p>
      <div class="mt-3 grid gap-2 sm:grid-cols-2">
        <button type="button" :disabled="exportando || restaurando" class="min-h-11 rounded-xl border border-whitesmoke-300 px-3 text-sm font-bold text-whitesmoke-700 disabled:opacity-60" @click="exportarAntesDeRestaurar">{{ exportando ? 'Preparando cópia…' : 'Exportar dados atuais primeiro' }}</button>
        <button type="button" :disabled="restaurando || exportando" class="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-bubblegum-700 px-3 text-sm font-bold text-white disabled:opacity-60" @click="solicitarRestauracao"><LoaderCircle v-if="restaurando" :size="17" class="animate-spin" />{{ restaurando ? 'Preparando restauração…' : 'Continuar para restauração' }}</button>
      </div>
      <p class="mt-2 text-[11px] leading-relaxed text-whitesmoke-500">Catálogo de exercícios: {{ quantidadeCatalogo() }} itens.</p>
    </div>
  </section>
</template>
