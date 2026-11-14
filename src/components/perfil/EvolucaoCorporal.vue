<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { CalendarDays, Pencil, Plus, Ruler, Save, Trash2, Weight } from 'lucide-vue-next'
import { confirmation } from '@/composables/useConfirm'
import { feedback } from '@/composables/useFeedback'
import { db, type MedidaCorporal } from '@/database/db'
import { comGravacaoGy } from '@/database/writeLock'
import { camposMedida, dataLocalHoje, formatarDataCivil, medidasNoPeriodo, ordenarMedidas, validarMedida, variacaoPeso, type CampoMedida, type PeriodoCorporal } from '@/utils/evolucao'
import EvolucaoLinha from '@/components/evolucao/EvolucaoLinha.vue'
import PagePillHeader from '@/components/layout/PagePillHeader.vue'

const emit = defineEmits<{ voltar: [] }>()
const registros = ref<MedidaCorporal[]>([])
const carregando = ref(true)
const erro = ref(false)
const salvando = ref(false)
const editandoId = ref<number | null>(null)
const medidaGrafico = ref<CampoMedida>('cinturaCm')
const periodo = ref<PeriodoCorporal>('90')
const campos = camposMedida
const camposFormulario = computed(() => campos.filter(c => !['bracoDireitoCm', 'bracoEsquerdoCm'].includes(c.chave) || form[c.chave] !== undefined))
const form = reactive<Record<string, string>>({})
const selecionado = computed(() => medidasNoPeriodo(registros.value, periodo.value))
const ordenados = computed(() => ordenarMedidas(registros.value))
const ultimaComPeso = computed(() => ordenados.value.find(item => item.pesoKg !== undefined))
const mudancaPeso = computed(() => variacaoPeso(registros.value))
const pontosPeso = computed(() => selecionado.value.filter(item => item.pesoKg !== undefined).map(item => ({ data: formatarDataCivil(item.dataLocal), dataCivil: item.dataLocal, valor: item.pesoKg! })))
const pontosMedida = computed(() => selecionado.value.filter(item => item[medidaGrafico.value] !== undefined).map(item => ({ data: formatarDataCivil(item.dataLocal), dataCivil: item.dataLocal, valor: item[medidaGrafico.value]! })))
const erroFormulario = ref('')
const dataForm = () => form.dataLocal || dataLocalHoje()

function iniciarNovo() {
  editandoId.value = null
  erroFormulario.value = ''
  Object.keys(form).forEach(key => delete form[key])
  form.dataLocal = dataLocalHoje()
}

function editar(registro: MedidaCorporal) {
  editandoId.value = registro.id ?? null
  erroFormulario.value = ''
  Object.keys(form).forEach(key => delete form[key])
  form.dataLocal = registro.dataLocal
  for (const campo of campos) if (registro[campo.chave] !== undefined) form[campo.chave] = String(registro[campo.chave])
  document.getElementById('evolucao-data')?.focus()
}

async function carregar() {
  carregando.value = true
  erro.value = false
  try { registros.value = await db.medidasCorporais.toArray() }
  catch (error) { console.error('Não foi possível carregar as medições:', error); erro.value = true; feedback.error('Não foi possível carregar suas medições.') }
  finally { carregando.value = false }
}

async function salvar() {
  const valores: Record<string, number | string | undefined> = { dataLocal: dataForm() }
  for (const campo of campos) {
    const textoValor = String(form[campo.chave] ?? '').trim()
    if (!textoValor) continue
    const valor = Number(textoValor.replace(',', '.'))
    if (!Number.isFinite(valor)) { erroFormulario.value = `Confira o valor de ${campo.nome.toLocaleLowerCase('pt-BR')}.`; return }
    valores[campo.chave] = valor
  }
  const medida = valores as Omit<MedidaCorporal, 'id'>
  erroFormulario.value = validarMedida(medida) ?? ''
  if (erroFormulario.value) return
  salvando.value = true
  try {
    await comGravacaoGy(() => db.transaction('rw', db.medidasCorporais, async () => {
      const existente = await db.medidasCorporais.where('dataLocal').equals(medida.dataLocal).first()
      if (existente && existente.id !== editandoId.value) throw new Error('Já existe um registro nessa data. Edite o cartão existente para evitar duplicações.')
      if (editandoId.value !== null) await db.medidasCorporais.put({ ...medida, id: editandoId.value })
      else await db.medidasCorporais.add(medida)
    }))
    feedback.success(editandoId.value ? 'Medição atualizada.' : 'Medição registrada.')
    iniciarNovo()
    await carregar()
  } catch (error) { erroFormulario.value = error instanceof Error ? error.message : 'Não foi possível salvar a medição.'; feedback.error(erroFormulario.value) }
  finally { salvando.value = false }
}

async function excluir(registro: MedidaCorporal) {
  if (registro.id === undefined) return
  await confirmation.ask({
    title: 'Excluir esta medição?', message: `O registro de ${formatarDataCivil(registro.dataLocal)} será removido.`,
    variant: 'error', icon: 'trash', cancelText: 'Manter registro', confirmText: 'Excluir medição',
    action: () => comGravacaoGy(() => db.medidasCorporais.delete(registro.id!))
  }).then(async confirmado => { if (confirmado) { feedback.success('Medição excluída.'); if (editandoId.value === registro.id) iniciarNovo(); await carregar() } })
}

function valoresRegistro(registro: MedidaCorporal) {
  return campos.filter(campo => registro[campo.chave] !== undefined).map(campo => `${campo.nome}: ${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(registro[campo.chave]!)} ${campo.unidade}`)
}

onMounted(async () => { iniciarNovo(); await carregar() })
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-20">
    <PagePillHeader titulo="Evolução corporal" subtitulo="Acompanhe suas medidas" tema="evolucao" mostrar-voltar @voltar="emit('voltar')" />

    <div v-if="erro" class="rounded-2xl border border-sage-200 bg-white p-4 text-sm text-whitesmoke-700" role="alert">
      Não foi possível carregar suas medições. <button class="ml-1 font-bold text-sage-600 underline" @click="carregar">Tentar novamente</button>
    </div>
    <div v-else-if="carregando" class="rounded-2xl border border-whitesmoke-200 bg-white p-8 text-center text-sm font-semibold text-whitesmoke-600" role="status">Carregando suas medições…</div>

    <template v-else>
      <section class="grid grid-cols-2 gap-3" aria-label="Resumo do peso">
        <article class="rounded-3xl border border-sage-100 bg-white p-4 shadow-sm sm:p-5">
          <div class="flex items-center gap-2 text-sage-600"><Weight :size="18" /><span class="text-xs font-bold uppercase tracking-wide">Último peso</span></div>
          <p class="mt-3 text-2xl font-black text-whitesmoke-950">{{ ultimaComPeso ? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(ultimaComPeso.pesoKg!)} kg` : '—' }}</p>
          <p class="mt-1 text-xs text-whitesmoke-500">{{ ultimaComPeso ? formatarDataCivil(ultimaComPeso.dataLocal) : 'Nenhum registro ainda' }}</p>
        </article>
        <article class="rounded-3xl border border-whitesmoke-200 bg-white p-4 shadow-sm sm:p-5">
          <div class="flex items-center gap-2 text-whitesmoke-600"><Ruler :size="18" /><span class="text-xs font-bold uppercase tracking-wide">Variação</span></div>
          <p class="mt-3 text-2xl font-black text-whitesmoke-950">{{ mudancaPeso === null ? '—' : `${mudancaPeso > 0 ? '+' : ''}${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(mudancaPeso)} kg` }}</p>
          <p class="mt-1 text-xs text-whitesmoke-500">{{ mudancaPeso === null ? 'Precisa de dois registros de peso' : 'Comparação com o registro anterior' }}</p>
        </article>
      </section>

      <section class="rounded-3xl border border-whitesmoke-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="graficos-corporais">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="graficos-corporais" class="text-lg font-black text-whitesmoke-950">Evolução ao longo do tempo</h2>
          <div class="flex flex-wrap gap-1.5" aria-label="Período do gráfico">
            <button v-for="opcao in [{ valor: '30', rotulo: '30 dias' }, { valor: '90', rotulo: '90 dias' }, { valor: '365', rotulo: '1 ano' }, { valor: 'todos', rotulo: 'Tudo' }]" :key="opcao.valor" type="button" class="min-h-9 rounded-full px-3 text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600" :class="periodo === opcao.valor ? 'bg-sage-500 text-white' : 'bg-whitesmoke-100 text-whitesmoke-600 hover:bg-sage-50'" :aria-pressed="periodo === opcao.valor" @click="periodo = opcao.valor as PeriodoCorporal">{{ opcao.rotulo }}</button>
          </div>
        </div>
        <div class="mt-4 grid gap-4">
          <div>
            <h3 class="mb-2 text-sm font-bold text-whitesmoke-800">Peso corporal</h3>
            <EvolucaoLinha v-if="pontosPeso.length" :pontos="pontosPeso" unidade="kg" rotulo="Gráfico do peso corporal ao longo do tempo" />
            <p v-else class="rounded-2xl bg-whitesmoke-50 p-5 text-center text-sm text-whitesmoke-500">Registre o peso em uma ou mais datas para visualizar este gráfico.</p>
          </div>
          <div>
            <label for="medida-grafico" class="mb-2 block text-sm font-bold text-whitesmoke-800">Medida corporal</label>
            <select id="medida-grafico" v-model="medidaGrafico" class="mb-2 min-h-11 w-full rounded-xl border border-whitesmoke-200 bg-white px-3 text-sm font-semibold text-whitesmoke-800 focus-visible:outline-2 focus-visible:outline-sage-600 sm:max-w-xs">
              <option v-for="campo in campos.filter(item => item.chave !== 'pesoKg')" :key="campo.chave" :value="campo.chave">{{ campo.nome }}</option>
            </select>
            <EvolucaoLinha v-if="pontosMedida.length" :pontos="pontosMedida" unidade="cm" rotulo="Gráfico da medida corporal selecionada ao longo do tempo" />
            <p v-else class="rounded-2xl bg-whitesmoke-50 p-5 text-center text-sm text-whitesmoke-500">Ainda não há registros desta medida no período.</p>
          </div>
        </div>
      </section>

      <section id="formulario-medicao" class="rounded-3xl border border-sage-100 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="titulo-form-medicao">
        <div class="mb-4 flex items-center gap-2 text-sage-600"><Plus v-if="editandoId === null" :size="20" /><Pencil v-else :size="18" /><h2 id="titulo-form-medicao" class="text-lg font-black text-whitesmoke-950">{{ editandoId === null ? 'Adicionar medição' : 'Editar medição' }}</h2></div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label class="col-span-2 flex flex-col gap-1 text-xs font-bold text-whitesmoke-700 sm:col-span-1">Data
            <input id="evolucao-data" v-model="form.dataLocal" type="date" :max="dataLocalHoje()" required class="min-h-11 min-w-0 rounded-xl border border-whitesmoke-200 bg-white px-3 text-sm text-whitesmoke-900 focus-visible:outline-2 focus-visible:outline-sage-600" />
          </label>
          <label v-for="campo in camposFormulario" :key="campo.chave" class="flex min-w-0 flex-col gap-1 text-xs font-bold text-whitesmoke-700">{{ campo.nome }} ({{ campo.unidade }})
            <input v-model="form[campo.chave]" type="number" inputmode="decimal" min="0.1" :max="campo.maximo" step="0.1" :aria-label="`${campo.nome} em ${campo.unidade}, opcional`" placeholder="Opcional" class="min-h-11 min-w-0 w-full rounded-xl border border-whitesmoke-200 bg-white px-3 text-sm text-whitesmoke-900 placeholder:font-normal placeholder:text-whitesmoke-400 focus-visible:outline-2 focus-visible:outline-sage-600" />
          </label>
        </div>
        <p class="mt-3 text-xs text-whitesmoke-500">Preencha somente as medidas que deseja acompanhar. Um único registro por data; registros já existentes podem ser editados.</p>
        <p v-if="erroFormulario" class="mt-3 rounded-xl bg-sage-50 px-3 py-2 text-sm font-semibold text-sage-700" role="alert">{{ erroFormulario }}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sage-500 px-4 text-sm font-bold text-white transition hover:bg-sage-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-700 disabled:opacity-60" :disabled="salvando" @click="salvar"><Save :size="17" />{{ salvando ? 'Salvando…' : editandoId === null ? 'Salvar medição' : 'Salvar alterações' }}</button>
          <button v-if="editandoId !== null" type="button" class="min-h-11 rounded-xl px-4 text-sm font-bold text-whitesmoke-600 hover:bg-whitesmoke-100 focus-visible:outline-2 focus-visible:outline-sage-600" @click="iniciarNovo">Cancelar edição</button>
        </div>
      </section>

      <section aria-labelledby="historico-corporal" class="flex flex-col gap-3">
        <div class="flex items-center justify-between px-1"><h2 id="historico-corporal" class="text-lg font-black text-whitesmoke-950">Registros anteriores</h2><span class="text-xs font-semibold text-whitesmoke-500">{{ registros.length }} {{ registros.length === 1 ? 'registro' : 'registros' }}</span></div>
        <div v-if="!ordenados.length" class="rounded-3xl border border-dashed border-sage-200 bg-white px-5 py-9 text-center">
          <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-50 text-sage-600"><CalendarDays :size="24" /></div>
          <h3 class="font-bold text-whitesmoke-900">Sua evolução começa com uma medição</h3><p class="mt-1 text-sm text-whitesmoke-500">Escolha o que deseja acompanhar e registre quando quiser.</p>
        </div>
        <article v-for="registro in ordenados" :key="registro.id ?? registro.dataLocal" class="rounded-2xl border border-whitesmoke-200 bg-white p-4 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0"><h3 class="font-bold text-whitesmoke-900">{{ formatarDataCivil(registro.dataLocal) }}</h3><ul class="mt-2 flex flex-wrap gap-1.5">
              <li v-for="valor in valoresRegistro(registro)" :key="valor" class="rounded-full bg-sage-50 px-2.5 py-1 text-xs font-semibold text-sage-700">{{ valor }}</li>
            </ul></div>
            <div class="flex shrink-0 gap-1"><button type="button" class="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-whitesmoke-600 hover:bg-whitesmoke-100 focus-visible:outline-2 focus-visible:outline-sage-600" :aria-label="`Editar medição de ${formatarDataCivil(registro.dataLocal)}`" @click="editar(registro)"><Pencil :size="15" />Editar</button><button type="button" class="flex min-h-10 w-10 items-center justify-center rounded-xl text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600" :aria-label="`Excluir medição de ${formatarDataCivil(registro.dataLocal)}`" @click="excluir(registro)"><Trash2 :size="16" /></button></div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>
