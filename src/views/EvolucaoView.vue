<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Activity, Ruler } from 'lucide-vue-next'
import SectionPageHeader from '@/components/layout/SectionPageHeader.vue'
import EvolucaoCorporal from '@/components/perfil/EvolucaoCorporal.vue'
import EvolucaoDesempenho from '@/components/historico/EvolucaoDesempenho.vue'
import { db } from '@/database/db'
import { feedback } from '@/composables/useFeedback'
const route = useRoute()
const router = useRouter()
const secao = computed(() => route.query.area)
const medidas = ref(0)
const sessoes = ref(0)
watch(secao, async area => {
  if (area) return
  try { medidas.value = await db.medidasCorporais.count(); sessoes.value = await db.historico.where('estado').equals('finalizado').count() }
  catch { feedback.error('Não foi possível carregar o resumo de evolução.') }
}, { immediate: true })
const voltar = () => router.push('/evolucao')
</script>
<template>
  <EvolucaoCorporal v-if="secao === 'corporal'" @voltar="voltar" />
  <EvolucaoDesempenho v-else-if="secao === 'desempenho'" @voltar="voltar" />
  <div v-else class="mx-auto flex max-w-3xl flex-col gap-5 pb-16">
    <SectionPageHeader titulo="Evolução" subtitulo="Acompanhe seus resultados" tema="evolucao" />
    <RouterLink v-for="item in [{ area: 'corporal', titulo: 'Evolução corporal', texto: 'Peso e medidas ao longo do tempo', resumo: medidas ? `${medidas} registros corporais` : 'Comece com sua primeira medição', icon: Ruler }, { area: 'desempenho', titulo: 'Evolução de desempenho', texto: 'Cargas, repetições e volume por exercício', resumo: sessoes ? `${sessoes} sessões concluídas no histórico` : 'Seus resultados aparecem após o primeiro treino', icon: Activity }]" :key="item.area" :to="{ path: '/evolucao', query: { area: item.area } }" class="group rounded-3xl border border-sage-200 bg-white p-5 shadow-sm transition hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-sage-600">
      <span class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-50 text-sage-600"><component :is="item.icon" :size="25" /></span>
      <h2 class="text-xl font-bold text-sage-700">{{ item.titulo }}</h2><p class="mt-1 text-sm text-whitesmoke-600">{{ item.texto }}</p><p class="mt-4 text-xs font-bold text-sage-600">{{ item.resumo }} →</p>
    </RouterLink>
  </div>
</template>
