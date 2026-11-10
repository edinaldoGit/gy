<script setup lang="ts">
import { computed, useId } from 'vue'
import { Snowflake } from 'lucide-vue-next'
import { NIVEIS_FOGUINHO } from '@/utils/sequencia'

const props = defineProps<{ nivel: number; tamanho?: number; animar?: boolean }>()
const classe = computed(() => props.nivel === 5 ? `foguinho-nivel-5${props.animar ? ' foguinho-prime' : ''}` : `foguinho-nivel-${props.nivel}`)
const cor = computed(() => props.nivel === 5 ? undefined : NIVEIS_FOGUINHO[props.nivel]?.cor)
const gradiente = `foguinho-gradiente-${useId().replace(/:/g, '')}`
</script>

<template>
  <span class="foguinho-chama" :class="classe" :style="{ color: cor, fontSize: `${tamanho ?? 22}px` }" aria-hidden="true">
    <svg class="foguinho-silhueta" :width="tamanho ?? 22" :height="tamanho ?? 22" viewBox="0 0 24 24" fill="none">
      <defs><linearGradient :id="gradiente" x1="5" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse"><stop stop-color="#7946FF"/><stop offset=".52" stop-color="#B456FF"/><stop offset="1" stop-color="#EFA5FF"/></linearGradient></defs>
      <path d="M12 22a8 8 0 0 0 8-8c0-4-2.1-6.4-5.2-8.8C13.1 3.9 12.1 2.2 12 1c-3.3 2.8-5.2 6.1-5.2 9.6 0 .9.2 1.8.5 2.6A3.5 3.5 0 0 1 5 11.1C3.7 12.7 4 14.6 4 16a8 8 0 0 0 8 6Z" :fill="nivel === 5 ? `url(#${gradiente})` : 'currentColor'" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M12 19a4 4 0 0 0 4-4c0-1.5-.8-2.7-2.5-4.1-.1 1.5-.8 2.2-1.5 2.8-.8-.8-1.1-1.6-1.1-2.7-1.1 1.1-2 2.2-2 4a3.1 3.1 0 0 0 3.1 4Z" :fill="nivel === 5 ? '#F4D9FF' : 'rgba(255,255,255,.44)'"/>
    </svg>
    <Snowflake v-if="nivel === 0" class="foguinho-floco" :size="(tamanho ?? 22) * 0.38" :stroke-width="2.5" />
    <span v-if="nivel === 5 && animar" class="foguinho-particula foguinho-particula-a"></span>
    <span v-if="nivel === 5 && animar" class="foguinho-particula foguinho-particula-b"></span>
  </span>
</template>

<style scoped>
.foguinho-chama { position: relative; display: inline-flex; flex: none; align-items: center; justify-content: center; line-height: 1; }
.foguinho-silhueta { filter: drop-shadow(0 1px 1px color-mix(in srgb, currentColor 25%, transparent)); }
.foguinho-nivel-0 .foguinho-silhueta { color: #54bdf2; }
.foguinho-floco { position: absolute; top: 0; right: -0.14em; border-radius: 50%; color: white; background: #1684b9; padding: 1px; }
.foguinho-nivel-5 { color: #bb7bff; }
.foguinho-prime { filter: drop-shadow(0 0 5px #a34bff8c); animation: prime-chama 2.4s ease-in-out infinite alternate; }
.foguinho-prime .foguinho-silhueta { stroke: #efd6ff; }
.foguinho-particula { position: absolute; width: .17em; height: .17em; border-radius: 50%; background: #f2c7ff; box-shadow: 0 0 4px #dba5ff; animation: prime-particula 2.8s ease-in-out infinite; }
.foguinho-particula-a { top: .08em; right: .05em; }
.foguinho-particula-b { top: .35em; left: -.05em; animation-delay: -1.4s; }
@keyframes prime-chama { from { transform: skewX(-2deg) scale(.98); } to { transform: skewX(2deg) scale(1.04); } }
@keyframes prime-particula { 0%,100% { opacity: .25; transform: translateY(.15em) scale(.7); } 50% { opacity: .9; transform: translateY(-.15em) scale(1); } }
@media (prefers-reduced-motion: reduce) { .foguinho-prime, .foguinho-particula { animation: none; } }
</style>
