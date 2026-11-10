import { db, type Perfil } from '@/database/db'
import { comGravacaoGy } from '@/database/writeLock'
import { diaLocal } from '@/utils/diasLocais'

export function validarPerfil(dados: Pick<Perfil, 'nome' | 'idade' | 'altura' | 'peso'>) {
  if (!dados.nome.trim() || dados.nome.length > 200) throw new Error('Informe um nome com até 200 caracteres.')
  if (!Number.isInteger(dados.idade) || dados.idade < 1 || dados.idade > 130) throw new Error('Informe uma idade entre 1 e 130 anos.')
  if (!Number.isFinite(dados.altura) || dados.altura < 30 || dados.altura > 300) throw new Error('Informe a altura entre 30 e 300 cm.')
  if (!Number.isFinite(dados.peso) || dados.peso < 0.1 || dados.peso > 1000) throw new Error('Informe o peso entre 0,1 e 1000 kg.')
}

export async function salvarPerfil(dados: Perfil, registrarPeso: boolean, agora = new Date()) {
  validarPerfil(dados)
  await comGravacaoGy(() => db.transaction('rw', db.perfil, db.medidasCorporais, async () => {
    const atual = dados.id === undefined ? undefined : await db.perfil.get(dados.id)
    if (!atual) throw new Error('O perfil não foi encontrado. Reabra a tela.')
    await db.perfil.put({ ...atual, nome: dados.nome.trim(), idade: dados.idade, altura: dados.altura, fotoPerfil: dados.fotoPerfil })
    if (registrarPeso) {
      const dataLocal = diaLocal(agora)
      const existente = await db.medidasCorporais.where('dataLocal').equals(dataLocal).first()
      await db.medidasCorporais.put({ ...existente, dataLocal, pesoKg: dados.peso })
    }
  }))
}

export async function prepararFoto(arquivo: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) throw new Error('Escolha uma imagem JPEG, PNG ou WebP.')
  if (arquivo.size > 5 * 1024 * 1024) throw new Error('Escolha uma imagem de até 5 MB.')
  const url = URL.createObjectURL(arquivo)
  try {
    const imagem = new Image()
    imagem.src = url
    await imagem.decode()
    if (!imagem.naturalWidth || !imagem.naturalHeight) throw new Error('A imagem não pôde ser lida.')
    const escala = Math.min(1, 640 / Math.max(imagem.naturalWidth, imagem.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(imagem.naturalWidth * escala))
    canvas.height = Math.max(1, Math.round(imagem.naturalHeight * escala))
    const contexto = canvas.getContext('2d')
    if (!contexto) throw new Error('Não foi possível processar a imagem.')
    contexto.fillStyle = '#ffffff'
    contexto.fillRect(0, 0, canvas.width, canvas.height)
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally { URL.revokeObjectURL(url) }
}
