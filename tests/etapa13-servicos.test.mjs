import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const vite = await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'})
after(async()=>{await vite.close()})
const { validarPerfil } = await vite.ssrLoadModule('/src/services/perfil.ts')
const { compartilharArquivo, podeCompartilharArquivo } = await vite.ssrLoadModule('/src/services/fichaCompartilhamento.ts')

test('valida idade diretamente, unidades e limites do perfil',()=>{
  const dados={nome:'Pessoa fictícia',idade:30,peso:75,altura:175}
  assert.doesNotThrow(()=>validarPerfil(dados))
  for(const alteracao of [{idade:30.5},{idade:131},{altura:0},{peso:-1},{nome:''}]) assert.throws(()=>validarPerfil({...dados,...alteracao}))
})

test('compartilha arquivo em memória e trata cancelamento nativo sem erro',async t=>{
  const arquivo = new File(['{"formato":"teste"}'],'ficha.json',{type:'application/json'})
  let recebido
  Object.defineProperty(navigator,'canShare',{configurable:true,value:({files})=>files[0]===arquivo})
  Object.defineProperty(navigator,'share',{configurable:true,writable:true,value:async dados=>{recebido=dados}})
  try {
    assert.equal(podeCompartilharArquivo(arquivo),true)
    assert.equal(await compartilharArquivo(arquivo),'compartilhado')
    assert.equal(recebido.files[0],arquivo)
    navigator.share=async()=>{throw new DOMException('Cancelado','AbortError')}
    assert.equal(await compartilharArquivo(arquivo),'cancelado')
    navigator.share=async()=>{throw new Error('Falha')}
    await assert.rejects(compartilharArquivo(arquivo),/Falha/)
  } finally { delete navigator.canShare; delete navigator.share }
})

test('oculta compartilhamento nativo quando o navegador não aceita arquivos',()=>{
  assert.equal(podeCompartilharArquivo(new File(['x'],'x.json')),false)
})
