<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFichaStore } from '@/stores/fichaStore'
import type { ExercicioCatalogo } from '@/database/db'
import { atualizarExercicioPersonalizado, arquivarExercicioPersonalizado, exercicioPersonalizado } from '@/services/exerciciosPersonalizados'
import { confirmation } from '@/composables/useConfirm'
import { feedback } from '@/composables/useFeedback'
import ModalSheetHeader from '@/components/layout/ModalSheetHeader.vue'
import { modalSheetBackdrop, modalSheetPanel } from '@/components/layout/modalSheetStyles'
const store = useFichaStore()
const aberto = ref(false)
const busca = ref('')
const editando = ref<ExercicioCatalogo | null>(null)
const salvando = ref(false)
const lista = computed(() => store.catalogo.filter(e => exercicioPersonalizado(e) && e.nome.toLocaleLowerCase('pt-BR').includes(busca.value.toLocaleLowerCase('pt-BR'))))
async function salvar() {
  if (!editando.value?.id || salvando.value) return
  salvando.value = true
  try { await atualizarExercicioPersonalizado(editando.value.id, editando.value); await store.carregarDados(); editando.value = null; feedback.success('Exercício atualizado. Sessões anteriores foram preservadas.') }
  catch (e) { feedback.error(e instanceof Error ? e.message : 'Não foi possível salvar o exercício.') }
  finally { salvando.value = false }
}
async function arquivar(e: ExercicioCatalogo) {
  const confirmado = await confirmation.ask({ title: 'Arquivar exercício?', message: `${e.nome} deixará de aparecer nas novas seleções. Fichas que já o utilizam e sessões anteriores serão preservadas.`, variant: 'warning', confirmText: 'Arquivar', cancelText: 'Manter exercício', action: () => arquivarExercicioPersonalizado(e.id!) })
  if (confirmado) { await store.carregarDados(); feedback.success('Exercício arquivado com segurança.') }
}
function fechar() { if (!salvando.value) { aberto.value = false; editando.value = null } }
</script>
<template>
  <button type="button" class="min-h-11 self-start rounded-xl px-3 text-xs font-bold text-cerulean-700 hover:bg-cerulean-50" @click="aberto = true">Gerenciar exercícios personalizados</button>
  <Transition name="gy-modal" :duration="{ enter: 420, leave: 280 }"><div v-if="aberto" :class="modalSheetBackdrop" @click.self="fechar">
    <section role="dialog" aria-modal="true" aria-labelledby="personalizados-titulo" :class="modalSheetPanel">
      <ModalSheetHeader :titulo="editando ? 'Editar exercício' : 'Seus exercícios'" titulo-id="personalizados-titulo" etiqueta="Catálogo personalizado" cor-classe="bg-cerulean-600" :desabilitado="salvando" @fechar="fechar" />
      <div class="min-h-0 overflow-y-auto p-5">
        <form v-if="editando" class="grid grid-cols-2 gap-3" @submit.prevent="salvar">
          <label v-for="campo in [{ chave: 'nome', nome: 'Nome' }, { chave: 'grupoMuscular', nome: 'Grupo muscular' }, { chave: 'equipamento', nome: 'Equipamento' }, { chave: 'videoUrl', nome: 'URL do vídeo' }, { chave: 'defaultReps', nome: 'Repetições padrão' }]" :key="campo.chave" class="col-span-2 text-xs font-bold text-whitesmoke-700">{{ campo.nome }}<input v-model="editando[campo.chave as 'nome' | 'grupoMuscular' | 'equipamento' | 'videoUrl' | 'defaultReps']" :type="campo.chave === 'videoUrl' ? 'url' : 'text'" :required="campo.chave !== 'videoUrl' && campo.chave !== 'equipamento'" class="mt-1 min-h-11 w-full rounded-xl border border-whitesmoke-200 px-3" /></label>
          <label class="col-span-2 text-xs font-bold text-whitesmoke-700">Séries padrão<input v-model.number="editando.defaultSeries" type="number" min="1" max="100" required class="mt-1 min-h-11 w-full rounded-xl border border-whitesmoke-200 px-3" /></label>
          <button type="button" :disabled="salvando" class="min-h-11 rounded-xl border border-whitesmoke-200 text-sm font-bold" @click="editando = null">Voltar</button><button :disabled="salvando" class="min-h-11 rounded-xl bg-cerulean-600 text-sm font-bold text-white">{{ salvando ? 'Salvando…' : 'Salvar' }}</button>
        </form>
        <template v-else>
          <input v-model="busca" aria-label="Buscar exercício personalizado" placeholder="Buscar exercício…" class="mb-4 min-h-11 w-full rounded-xl border border-whitesmoke-200 px-3 text-sm" />
          <p class="mb-4 text-xs text-whitesmoke-500">O arquivamento mantém as referências de suas fichas e do histórico. Exercícios oficiais são protegidos.</p>
          <p v-if="!lista.length" class="py-6 text-center text-sm text-whitesmoke-500">Nenhum exercício personalizado encontrado.</p>
          <article v-for="e in lista" :key="e.id" class="mb-3 rounded-2xl border border-whitesmoke-200 p-3"><h3 class="break-words text-sm font-bold">{{ e.nome }}</h3><p class="text-xs text-whitesmoke-500">{{ e.grupoMuscular }} · {{ e.arquivado ? 'Arquivado' : e.equipamento }}</p><div class="mt-2 flex flex-wrap gap-2"><button type="button" class="min-h-11 rounded-xl bg-cerulean-50 px-3 text-xs font-bold text-cerulean-700" @click="editando = { ...e }">Editar</button><button v-if="!e.arquivado" type="button" class="min-h-11 rounded-xl px-3 text-xs font-bold text-bubblegum-700" @click="arquivar(e)">Arquivar</button></div></article>
        </template>
      </div>
    </section>
  </div></Transition>
</template>
