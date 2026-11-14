<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ModalSheetHeader from '@/components/layout/ModalSheetHeader.vue'
import { modalSheetBackdrop, modalSheetPanel } from '@/components/layout/modalSheetStyles'
import { calcularRecorte } from '@/utils/recorteFoto'
import { feedback } from '@/composables/useFeedback'
const props = defineProps<{ imagem: string }>()
const emit = defineEmits<{ confirmar: [foto: string]; cancelar: [] }>()
const imagem = new Image()
const largura = ref(0), altura = ref(0), zoom = ref(1), x = ref(0), y = ref(0)
const pronto = ref(false)
const recorte = computed(() => pronto.value ? calcularRecorte(largura.value, altura.value, zoom.value, x.value, y.value) : null)
const estilo = computed(() => recorte.value ? { width: `${largura.value / recorte.value.lado * 100}%`, height: `${altura.value / recorte.value.lado * 100}%`, left: `${-recorte.value.x / recorte.value.lado * 100}%`, top: `${-recorte.value.y / recorte.value.lado * 100}%`, maxWidth: 'none' } : {})
let arrastando = false, ultimoX = 0, ultimoY = 0
function iniciar(e: PointerEvent) { arrastando = true; ultimoX = e.clientX; ultimoY = e.clientY; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
function mover(e: PointerEvent) {
  if (!arrastando || !recorte.value) return
  const larguraTela = (e.currentTarget as HTMLElement).getBoundingClientRect().width
  const lado = recorte.value.lado
  if (largura.value > lado) x.value = Math.max(-1, Math.min(1, x.value - (e.clientX - ultimoX) / larguraTela * lado * 2 / (largura.value - lado)))
  if (altura.value > lado) y.value = Math.max(-1, Math.min(1, y.value - (e.clientY - ultimoY) / larguraTela * lado * 2 / (altura.value - lado)))
  ultimoX = e.clientX; ultimoY = e.clientY
}
function confirmar() {
  if (!recorte.value) return
  try {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 320
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Não foi possível recortar a foto.')
    const r = recorte.value
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 320, 320)
    ctx.drawImage(imagem, r.x, r.y, r.lado, r.lado, 0, 0, 320, 320)
    emit('confirmar', canvas.toDataURL('image/jpeg', .85))
  } catch { feedback.error('Não foi possível processar o recorte. Tente outra imagem.') }
}
onMounted(async () => {
  try { imagem.src = props.imagem; await imagem.decode(); largura.value = imagem.naturalWidth; altura.value = imagem.naturalHeight; pronto.value = true }
  catch { feedback.error('Não foi possível abrir a imagem.'); emit('cancelar') }
})
</script>
<template>
  <div :class="modalSheetBackdrop" @click.self="emit('cancelar')"><section role="dialog" aria-modal="true" aria-labelledby="recorte-titulo" :class="modalSheetPanel">
    <ModalSheetHeader titulo="Enquadrar foto" titulo-id="recorte-titulo" etiqueta="Perfil" cor-classe="bg-bubblegum-500" @fechar="emit('cancelar')" />
    <div class="min-h-0 space-y-4 overflow-y-auto p-5">
      <p class="text-center text-xs text-whitesmoke-500">Arraste a foto e ajuste o zoom. A prévia representa seu avatar.</p>
      <div class="relative mx-auto aspect-square w-full max-w-60 touch-none overflow-hidden rounded-full border-4 border-white bg-whitesmoke-100 shadow-sm" aria-label="Prévia circular do recorte" @pointerdown="iniciar" @pointermove="mover" @pointerup="arrastando = false" @pointercancel="arrastando = false"><img v-if="pronto" :src="props.imagem" alt="Prévia da foto recortada" draggable="false" class="pointer-events-none absolute select-none" :style="estilo" /></div>
      <label class="block text-xs font-bold text-whitesmoke-700">Zoom<input v-model.number="zoom" type="range" min="1" max="3" step="0.01" class="min-h-11 w-full accent-bubblegum-500" /></label>
      <div class="grid grid-cols-2 gap-3"><label class="text-xs font-bold text-whitesmoke-700">Horizontal<input v-model.number="x" type="range" min="-1" max="1" step="0.01" class="min-h-11 w-full accent-bubblegum-500" /></label><label class="text-xs font-bold text-whitesmoke-700">Vertical<input v-model.number="y" type="range" min="-1" max="1" step="0.01" class="min-h-11 w-full accent-bubblegum-500" /></label></div>
      <div class="flex gap-3"><button type="button" class="min-h-11 flex-1 rounded-xl border border-whitesmoke-200 text-sm font-bold" @click="emit('cancelar')">Cancelar</button><button type="button" :disabled="!pronto" class="min-h-11 flex-1 rounded-xl bg-bubblegum-500 text-sm font-bold text-white disabled:opacity-50" @click="confirmar">Usar foto</button></div>
    </div>
  </section></div>
</template>
