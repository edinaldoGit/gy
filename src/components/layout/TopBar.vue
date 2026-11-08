<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/database/db'
import { Dumbbell, ClipboardList, History, User, ChevronDown, UserRound, Flame } from 'lucide-vue-next'

const route = useRoute()
const isMenuExpanded = ref(false)
const fotoUsuario = ref<string | null>(null)

// --- Estados Simulados (Mockados) ---
const streakDays = ref(3) // Quantidade de dias seguidos
const isWorkoutActive = ref(true) // Se existe um treino rolando agora
const workoutDuration = ref('45:12') // Tempo de treino
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

// Fundo principal da barra
const headerBgClass = computed(() => {
  const colorMap: Record<string, string> = {
    'amethyst': 'bg-amethyst-500',
    'cerulean': 'bg-cerulean-600',
    'teal': 'bg-teal-600',
    'bubblegum': 'bg-bubblegum-500'
  }
  return colorMap[currentTab.value.color]
})

// Estilos dinâmicos do Círculo e da Pílula na direita
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
  <div class="relative">
    <header 
      class="w-full flex flex-col shadow-xl transition-colors duration-500 ease-in-out z-40 rounded-b-[2.5rem] relative"
      :class="headerBgClass"
    >
      <!-- Barra Superior Fixa -->
      <div class="flex items-center justify-between px-6 h-32 pt-6 pb-2">
        
        <!-- Esquerda: Foto de Perfil + Pílula de Ofensiva -->
        <div class="flex items-center flex-1 justify-start">
          
          <!-- Círculo da Foto (z-10 para ficar por cima) -->
          <div class="w-14 h-14 rounded-full bg-whitesmoke-50/20 flex items-center justify-center overflow-hidden border-[2px] border-whitesmoke-50 shadow-sm relative z-10 shrink-0 transition-all duration-300"
               :class="{'ring-4 ring-whitesmoke-50/30': isWorkoutActive}">
            <img v-if="fotoUsuario" :src="fotoUsuario" class="w-full h-full object-cover" />
            <UserRound v-else :size="28" class="text-whitesmoke-50" />
          </div>
          
          <!-- Pílula do Foguinho (Fundo totalmente branco e texto na cor da aba) -->
          <div v-if="streakDays > 0" class="h-9 flex items-center pl-6 pr-4 -ml-5 rounded-r-full bg-whitesmoke-50 relative z-0 shadow-sm">
            <div class="flex items-center gap-1.5 translate-x-0.5">
              <Flame :size="18" class="text-orange-400 drop-shadow-sm" fill="currentColor" stroke-width="1.5" />
              <span 
                class="text-sm font-black transition-colors duration-500"
                :class="activeTabStyles.icon"
              >
                {{ streakDays }}
              </span>
            </div>
          </div>

        </div>

        <!-- Centro: Indicador de Treino em Andamento -->
        <div class="flex flex-col items-center justify-center shrink-0">
          <Transition name="fade" appear>
            <div v-if="isWorkoutActive" class="flex flex-col items-center">
              <div class="flex items-center gap-1.5 bg-whitesmoke-950/15 px-3 py-1.5 rounded-full backdrop-blur-sm border border-whitesmoke-50/20 shadow-inner">
                <div class="w-2 h-2 rounded-full bg-bubblegum-400 animate-pulse shadow-[0_0_5px_rgba(252,100,113,0.8)]"></div>
                <span class="text-[11px] font-bold text-whitesmoke-50 tracking-widest font-mono translate-y-[0.5px]">
                  {{ workoutDuration }}
                </span>
              </div>
              <span class="text-[7px] font-bold text-whitesmoke-50/80 uppercase tracking-[0.2em] mt-1.5 drop-shadow-sm">
                Em Andamento
              </span>
            </div>
          </Transition>
        </div>

        <!-- Direita: Círculo Branco + Pílula Animada -->
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

      <!-- Área Expansível: Opções lado a lado -->
      <div 
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

      <!-- Orelha de Expansão -->
      <div 
        @click="toggleMenu"
        class="absolute -bottom-5 left-1/2 -translate-x-1/2 w-16 h-7 flex items-center justify-center rounded-b-2xl cursor-pointer transition-colors duration-500 ease-in-out shadow-lg border-t border-whitesmoke-50/10"
        :class="headerBgClass"
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
/* Animação da Pílula Direita (Aba) */
.pill-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-width: 150px;
}

.pill-leave-active {
  transition: all 0.25s ease-out;
  max-width: 150px;
}

.pill-enter-from,
.pill-leave-to {
  max-width: 0;
  opacity: 0;
  padding-left: 0;
}

/* Animação do Ícone no Círculo Branco */
.icon-pop-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.icon-pop-leave-active {
  transition: all 0.2s ease-out;
}

.icon-pop-enter-from {
  opacity: 0;
  transform: scale(0.3) rotate(-30deg);
}

.icon-pop-leave-to {
  opacity: 0;
  transform: scale(0.3) rotate(30deg);
}

/* Animação do timer central */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>