import { liveQuery } from 'dexie'
import { onMounted, onUnmounted, ref } from 'vue'
import { db, type Perfil } from '@/database/db'
import { ordenarMedidas } from '@/utils/evolucao'

export function usePerfilAtual() {
  const perfil = ref<Perfil | null>(null)
  const carregando = ref(true)
  const erro = ref(false)
  let cancelar: (() => void) | undefined
  onMounted(() => {
    const subscription = liveQuery(async () => {
      const pessoa = await db.perfil.toCollection().first()
      if (!pessoa) return null
      const peso = ordenarMedidas(await db.medidasCorporais.toArray()).find(item => item.pesoKg !== undefined)?.pesoKg
      return { ...pessoa, peso: peso ?? pessoa.peso }
    }).subscribe({ next: valor => { perfil.value = valor; carregando.value = false; erro.value = false }, error: () => { erro.value = true; carregando.value = false } })
    cancelar = () => subscription.unsubscribe()
  })
  onUnmounted(() => cancelar?.())
  return { perfil, carregando, erro }
}
