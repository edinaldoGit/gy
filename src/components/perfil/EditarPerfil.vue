<script setup lang="ts">
import { ref } from 'vue'
import type { Perfil } from '@/database/db'
import { prepararFoto, salvarPerfil } from '@/services/perfil'
import { feedback } from '@/composables/useFeedback'
import ModalSheetHeader from '@/components/layout/ModalSheetHeader.vue'
import { modalSheetBackdrop, modalSheetPanel } from '@/components/layout/modalSheetStyles'
import { UserRound } from 'lucide-vue-next'

const props = defineProps<{ perfil: Perfil }>()
const emit = defineEmits<{ fechar: [] }>()
const dados = ref({ ...props.perfil })
const pesoInicial = props.perfil.peso
const salvando = ref(false)
const processandoFoto = ref(false)
const erro = ref('')
async function lerFoto(event: Event) {
  const input = event.target as HTMLInputElement
  const arquivo = input.files?.[0]
  input.value = ''
  if (!arquivo) return
  processandoFoto.value = true
  try { dados.value.fotoPerfil = await prepararFoto(arquivo); erro.value = '' }
  catch (falha) { erro.value = falha instanceof Error ? falha.message : 'Não foi possível ler a foto.' }
  finally { processandoFoto.value = false }
}
async function salvar() {
  if (salvando.value || processandoFoto.value) return
  salvando.value = true
  try {
    await salvarPerfil(dados.value, dados.value.peso !== pesoInicial)
    feedback.success('Perfil atualizado!')
    emit('fechar')
  } catch (falha) { erro.value = falha instanceof Error ? falha.message : 'Não foi possível salvar o perfil.'; feedback.error(erro.value) }
  finally { salvando.value = false }
}
</script>

<template>
  <div :class="modalSheetBackdrop" @click.self="!salvando && emit('fechar')">
    <section role="dialog" aria-modal="true" aria-labelledby="editar-perfil-titulo" :class="modalSheetPanel">
      <ModalSheetHeader titulo="Editar perfil" titulo-id="editar-perfil-titulo" etiqueta="Perfil" cor-classe="bg-bubblegum-500" :desabilitado="salvando" @fechar="emit('fechar')" />
      <form class="min-h-0 overflow-y-auto p-5 flex flex-col gap-4" @submit.prevent="salvar">
        <div class="flex items-center gap-4">
          <div class="h-20 w-20 shrink-0 rounded-full overflow-hidden bg-white border border-whitesmoke-200 flex items-center justify-center"><img v-if="dados.fotoPerfil" :src="dados.fotoPerfil" alt="Prévia da foto" class="h-full w-full object-cover" /><UserRound v-else class="text-bubblegum-500" :size="36" /></div>
          <div class="flex flex-wrap gap-2 text-xs font-bold text-bubblegum-700">
            <label class="cursor-pointer focus-within:outline-2 focus-within:outline-bubblegum-600 rounded-xl bg-bubblegum-50 p-3">Escolher foto<input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp" :disabled="salvando || processandoFoto" @change="lerFoto" /></label>
            <label class="cursor-pointer focus-within:outline-2 focus-within:outline-bubblegum-600 rounded-xl bg-bubblegum-50 p-3">Câmera<input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp" capture="user" :disabled="salvando || processandoFoto" @change="lerFoto" /></label>
            <button v-if="dados.fotoPerfil" type="button" :disabled="salvando || processandoFoto" class="p-3" @click="dados.fotoPerfil = undefined">Remover foto</button>
          </div>
        </div>
        <p class="text-xs text-whitesmoke-500">JPEG, PNG ou WebP, até 5 MB. A imagem é reduzida e guardada somente neste aparelho.</p>
        <label class="text-sm font-bold">Nome<input v-model="dados.nome" maxlength="200" required class="mt-1 w-full rounded-xl border border-whitesmoke-200 p-3" /></label>
        <div class="grid grid-cols-2 gap-3">
          <label class="text-sm font-bold">Idade (anos)<input v-model.number="dados.idade" type="number" min="1" max="130" step="1" required class="mt-1 w-full rounded-xl border border-whitesmoke-200 p-3" /></label>
          <label class="text-sm font-bold">Altura (cm)<input v-model.number="dados.altura" type="number" min="30" max="300" step="0.1" required class="mt-1 w-full rounded-xl border border-whitesmoke-200 p-3" /></label>
        </div>
        <label class="text-sm font-bold">Peso atual (kg)<input v-model.number="dados.peso" type="number" min="0.1" max="1000" step="0.1" required class="mt-1 w-full rounded-xl border border-whitesmoke-200 p-3" /></label>
        <p class="rounded-xl bg-bubblegum-50 p-3 text-xs text-bubblegum-800">Ao alterar o peso, o Gy cria ou atualiza o peso da medição de hoje em Evolução, preservando as outras medidas do dia. Registros de outras datas permanecem intactos.</p>
        <p v-if="erro" role="alert" class="text-sm text-red-700">{{ erro }}</p>
        <button :disabled="salvando || processandoFoto" class="min-h-12 rounded-2xl bg-bubblegum-500 px-4 font-bold text-white disabled:opacity-50">{{ processandoFoto ? 'Preparando foto…' : salvando ? 'Salvando…' : 'Salvar alterações' }}</button>
      </form>
    </section>
  </div>
</template>
