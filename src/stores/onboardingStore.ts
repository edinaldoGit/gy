import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/database/db'
import { comGravacaoGy } from '@/database/writeLock'

export const useOnboardingStore = defineStore('onboarding', () => {
  const showSplash = ref(true)

  const form = ref({
    nome: '',
    idade: '',
    peso: '',
    altura: '',
    fotoPerfil: ''
  })

  const comprimirImagem = (file: File, maxTamanho = 300, qualidade = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let largura = img.width
          let altura = img.height

          if (largura > altura) {
            if (largura > maxTamanho) {
              altura = Math.round((altura * maxTamanho) / largura)
              largura = maxTamanho
            }
          } else {
            if (altura > maxTamanho) {
              largura = Math.round((largura * maxTamanho) / altura)
              altura = maxTamanho
            }
          }

          canvas.width = largura
          canvas.height = altura

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, largura, altura)

          resolve(canvas.toDataURL('image/jpeg', qualidade))
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      const imagemCompactada = await comprimirImagem(file, 300, 0.8)
      form.value.fotoPerfil = imagemCompactada
    }
  }

  const salvarPerfil = async () => {
    if (!form.value.nome || !form.value.idade || !form.value.peso || !form.value.altura) return false

    await comGravacaoGy(() => db.perfil.add({
      nome: form.value.nome,
      idade: Number(form.value.idade),
      peso: Number(form.value.peso),
      altura: Number(form.value.altura),
      fotoPerfil: form.value.fotoPerfil || undefined,
      criadoEm: new Date()
    }))
    return true
  }

  return {
    showSplash,
    form,
    handleFileUpload,
    salvarPerfil
  }
})
