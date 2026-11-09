<script setup lang="ts">
import { ref, computed, onMounted, watch, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/database/db'
import { storeToRefs } from 'pinia'
import { useTreinoStore } from '@/stores/treinoStore'
import { Dumbbell, ClipboardList, History, User, ChevronDown, UserRound, Flame, Snowflake } from 'lucide-vue-next'
import { sequencia } from '@/services/sequencia'

import type { FeedbackMessage } from '@/utils/feedbackManager'
import { feedbackThemes } from '@/theme/feedbackThemes'
import TopBarFeedback from '@/components/feedback/TopBarFeedback.vue'
import { feedback } from '@/composables/useFeedback'
import { confirmation } from '@/composables/useConfirm'

const route = useRoute()
const isMenuExpanded = ref(false)
const fotoUsuario = ref<string | null>(null)
const displayedFeedback = shallowRef<FeedbackMessage | null>(null)
watch(feedback.current, message => { if (message) displayedFeedback.value = message }, { immediate: true })
const feedbackVisible = computed(() => !!feedback.current.value && !confirmation.state.value.options)
const feedbackBg = computed(() => {
  const kind = feedback.current.value?.kind
  return kind ? feedbackThemes[kind].background : ''
})
watch([feedbackVisible, () => !!confirmation.state.value.options], ([visible, modal]) => { if (visible || modal) isMenuExpanded.value = false })

// --- Integração Real com o Treino ---
const treinoStore = useTreinoStore()
const { estadoAtual, cronometroFormatado } = storeToRefs(treinoStore)

const isWorkoutActive = computed(() => estadoAtual.value === 'execucao')
const streakDays = computed(() => sequencia.estado.value.quantidade)
const fogoAtivo = computed(() => sequencia.estado.value.desbloqueada)
// ------------------------------------

const navItems = [
  { name: 'Treino', path: '/', icon: Dumbbell, color: 'amethyst' },
  { name: 'Fichas', path: '/fichas', icon: ClipboardList, color: 'cerulean' },
  { name: 'Histórico', path: '/historico', icon: History, color: 'teal' },
  { name: 'Perfil', path: '/perfil', icon: User, color: 'bubblegum' }
]

const currentTab = computed(() => {
  return navItems.find(item => item.path === route.path) || navItems[0]
})

const headerBgClass = computed(() => {
  const colorMap: Record<string, string> = {
    'amethyst': 'bg-amethyst-500',
    'cerulean': 'bg-cerulean-600',
    'teal': 'bg-teal-600',
    'bubblegum': 'bg-bubblegum-500'
  }
  return colorMap[currentTab.value.color]
})

const safeAreaBgClass = computed(() => feedbackVisible.value ? feedbackBg.value : headerBgClass.value)

const activeTabStyles = computed(() => {
  const styles: Record<string, any> = {
    'amethyst': { icon: 'text-amethyst-500', pillBg: 'bg-amethyst-50', pillText: 'text-amethyst-600' },
    'cerulean': { icon: 'text-cerulean-600', pillBg: 'bg-cerulean-50', pillText: 'text-cerulean-700' },
    'teal': { icon: 'text-teal-600', pillBg: 'bg-teal-50', pillText: 'text-teal-700' },
    'bubblegum': { icon: 'text-bubblegum-500', pillBg: 'bg-bubblegum-50', pillText: 'text-bubblegum-600' }
  }
  return styles[currentTab.value.color]
})

const toggleMenu = () => {
  isMenuExpanded.value = !isMenuExpanded.value
}

onMounted(async () => {
  const perfil = await db.perfil.toCollection().first()
  if (perfil?.fotoPerfil) {
    fotoUsuario.value = perfil.fotoPerfil
  }
})
</script>

<template>
  <div class="relative pt-[env(safe-area-inset-top)]" :class="safeAreaBgClass">
    <!-- TOPBAR FIXA z-[100] (Protegida do blur de baixo) -->
    <header 
      class="w-full flex flex-col shadow-xl transition-colors duration-500 ease-in-out z-[100] rounded-b-[2.5rem] relative"
      :class="feedbackVisible ? feedbackBg : headerBgClass"
    >
      <div class="topbar-stage grid h-32 items-center overflow-hidden">
      <div class="topbar-normal flex h-32 min-w-0 items-center justify-between px-6 pt-6 pb-2" :class="{ 'topbar-normal-hidden': feedbackVisible }" :inert="feedbackVisible" :aria-hidden="feedbackVisible">
        
        <!-- Esquerda: Perfil + Ofensiva -->
        <div class="flex items-center flex-1 justify-start">
          <div class="w-14 h-14 rounded-full bg-whitesmoke-50/20 flex items-center justify-center overflow-hidden border-[2px] border-whitesmoke-50 shadow-sm relative z-10 shrink-0 transition-all duration-300"
               :class="{'ring-4 ring-whitesmoke-50/30': isWorkoutActive}">
            <img v-if="fotoUsuario" :src="fotoUsuario" class="w-full h-full object-cover" />
            <UserRound v-else :size="28" class="text-whitesmoke-50" />
          </div>
          
          <div role="status" :aria-label="sequencia.erro.value ? 'Sequência indisponível. Tente reabrir o aplicativo.' : `Sequência de ${streakDays} dias programados: ${fogoAtivo ? 'fogo ativo' : 'congelada'}`" class="h-9 flex items-center pl-6 pr-4 -ml-5 rounded-r-full bg-whitesmoke-50 relative z-0 shadow-sm">
            <div class="flex items-center gap-1.5 translate-x-0.5">
              <Flame v-if="fogoAtivo" :size="18" class="text-orange-400 drop-shadow-sm" fill="currentColor" stroke-width="1.5" aria-hidden="true" />
              <Snowflake v-else :size="18" class="text-cerulean-500 drop-shadow-sm" stroke-width="1.5" aria-hidden="true" />
              <span 
                class="text-sm font-black transition-colors duration-500"
                :class="activeTabStyles.icon"
              >
                {{ streakDays }}
              </span>
            </div>
          </div>
        </div>

        <!-- Centro: Logo Mutante (Logo Branca -> Cronômetro) -->
        <div class="flex flex-col items-center justify-center shrink-0 w-24 h-12 relative">
          <Transition name="fade-scale" mode="out-in">
            
            <!-- Estado 1: Treino ROLANDO (Cronômetro Pulsante) -->
            <div v-if="isWorkoutActive" class="flex flex-col items-center absolute inset-0 justify-center">
              <div class="flex items-center gap-1.5 bg-whitesmoke-950/15 px-3 py-1.5 rounded-full backdrop-blur-sm border border-whitesmoke-50/20 shadow-inner">
                <div class="w-2 h-2 rounded-full bg-bubblegum-400 animate-pulse shadow-[0_0_5px_rgba(252,100,113,0.8)]"></div>
                <span class="text-[11px] font-bold text-whitesmoke-50 tracking-widest font-mono translate-y-[0.5px]">
                  {{ cronometroFormatado }}
                </span>
              </div>
              <span class="text-[7px] font-bold text-whitesmoke-50/80 uppercase tracking-[0.2em] mt-1.5 drop-shadow-sm">
                Em Andamento
              </span>
            </div>

            <!-- Estado 2: Repouso / Finalizado (Logo Pintada de Branco) -->
            <div v-else class="flex flex-col items-center justify-center absolute inset-0">
              <!-- O brightness-0 invert transforma a logo original na cor branca pura! -->
              <img 
                src="@/assets/logo.png" 
                alt="Gy Logo" 
                class="h-16 object-contain brightness-0 invert drop-shadow-sm"
              />
            </div>

          </Transition>
        </div>

        <!-- Direita: Pílula da Aba -->
        <div class="flex items-center flex-1 justify-end">
          <Transition name="pill" appear mode="out-in">
            <div 
              :key="currentTab.path"
              class="h-9 flex items-center pl-4 pr-8 -mr-6 rounded-l-full shadow-sm relative z-0 whitespace-nowrap overflow-hidden"
              :class="[activeTabStyles.pillBg]"
            >
              <span 
                class="text-[11px] font-bold uppercase tracking-widest"
                :class="activeTabStyles.pillText"
              >
                {{ currentTab.name }}
              </span>
            </div>
          </Transition>
          
          <div class="w-14 h-14 rounded-full bg-whitesmoke-50 shadow-md flex items-center justify-center relative z-10 shrink-0">
            <Transition name="icon-pop" appear mode="out-in">
              <component 
                :is="currentTab.icon" 
                :key="currentTab.path"
                :size="26" 
                :class="activeTabStyles.icon"
              />
            </Transition>
          </div>
        </div>

      </div>

      <Transition name="feedback">
        <TopBarFeedback v-if="feedbackVisible && displayedFeedback" :notification="displayedFeedback" class="topbar-message" />
      </Transition>
      </div>

      <!-- Menu Expansível -->
      <div 
        :inert="feedbackVisible || !isMenuExpanded"
        class="overflow-hidden transition-all duration-500 ease-in-out flex flex-col justify-center"
        :class="isMenuExpanded ? 'max-h-32 opacity-100 mb-8' : 'max-h-0 opacity-0'"
      >
        <div class="flex flex-row items-center justify-center gap-2 px-4 py-2">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            @click="isMenuExpanded = false"
            class="flex flex-col items-center justify-center w-[4.5rem] p-3 rounded-2xl transition-all duration-300 group"
            :class="route.path === item.path ? 'bg-whitesmoke-50/25 shadow-sm' : 'hover:bg-whitesmoke-50/10'"
          >
            <component 
              :is="item.icon" 
              :size="24" 
              class="mb-1.5 transition-colors duration-300"
              :class="route.path === item.path ? 'text-whitesmoke-50' : 'text-whitesmoke-50/70 group-hover:text-whitesmoke-50'" 
            />
            <span 
              class="text-[9px] font-bold uppercase tracking-widest transition-colors duration-300"
              :class="route.path === item.path ? 'text-whitesmoke-50' : 'text-whitesmoke-50/70 group-hover:text-whitesmoke-50'"
            >
              {{ item.name }}
            </span>
          </router-link>
        </div>
      </div>

      <div 
        role="button"
        tabindex="0"
        aria-label="Abrir ou fechar navegação"
        :aria-expanded="isMenuExpanded"
        @keydown.enter.prevent="toggleMenu"
        @keydown.space.prevent="toggleMenu"
        @click="toggleMenu"
        :inert="feedbackVisible"
        :aria-hidden="feedbackVisible"
        :style="feedbackVisible ? { opacity: 0, pointerEvents: 'none' } : undefined"
        class="absolute -bottom-5 left-1/2 -translate-x-1/2 w-16 h-7 flex items-center justify-center rounded-b-2xl cursor-pointer transition-colors duration-500 ease-in-out shadow-lg border-t border-whitesmoke-50/10"
        :class="feedbackVisible ? feedbackBg : headerBgClass"
      >
        <ChevronDown 
          :size="22" 
          class="text-whitesmoke-50 transition-transform duration-300"
          :class="{ 'rotate-180': isMenuExpanded }"
        />
      </div>
    </header>
  </div>
</template>

<style scoped>
.topbar-normal, .topbar-message { grid-area: 1 / 1; }
.topbar-normal { opacity: 1; transition: opacity .22s ease .12s; }
.topbar-normal > div { transition: transform .32s cubic-bezier(.22,1,.36,1) .08s; }
.topbar-normal-hidden { opacity: 0; pointer-events: none; transition-delay: 0s; }
.topbar-normal-hidden > div:first-child { transform: translateX(24px) scale(.88); }
.topbar-normal-hidden > div:nth-child(2) { transform: translateY(-18px) scale(.8); }
.topbar-normal-hidden > div:last-child { transform: translateX(-24px) scale(.88); }
.feedback-enter-active { transition: opacity .28s ease .18s, transform .36s cubic-bezier(.22,1,.36,1) .18s; }
.feedback-leave-active { transition: opacity .18s ease, transform .2s ease; pointer-events: none; }
.feedback-enter-from { opacity: 0; transform: translateY(16px) scale(.96); }
.feedback-leave-to { opacity: 0; transform: translateY(-12px) scale(.96); }
@media(prefers-reduced-motion:reduce) { *, :deep(*) { transition: none !important; animation: none !important; } }

.pill-enter-active { transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); max-width: 150px; }
.pill-leave-active { transition: all 0.25s ease-out; max-width: 150px; }
.pill-enter-from, .pill-leave-to { max-width: 0; opacity: 0; padding-left: 0; }

.icon-pop-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.icon-pop-leave-active { transition: all 0.2s ease-out; }
.icon-pop-enter-from { opacity: 0; transform: scale(0.3) rotate(-30deg); }
.icon-pop-leave-to { opacity: 0; transform: scale(0.3) rotate(30deg); }

/* Transição muito suave entre a Logo e o Relógio */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.4s ease;
}
.fade-scale-enter-from { opacity: 0; transform: scale(0.9); }
.fade-scale-leave-to { opacity: 0; transform: scale(1.1); }
</style>
