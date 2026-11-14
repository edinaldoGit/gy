import test from 'node:test'
import assert from 'node:assert/strict'
import { reactive } from 'vue'
import { calcularSequencia } from '../src/utils/sequencia.ts'
import { FORMATO_BACKUP, TAMANHO_MAXIMO_BACKUP, exportarBackup, lerArquivoBackup, restaurarBackup, resumoBackup, validarBackup } from '../src/services/backup.ts'
import { comGravacaoGy, gravacoesBackupBloqueadas } from '../src/database/writeLock.ts'

const agora = new Date('2026-11-08T15:00:00.000Z')
const fixture = () => ({
  perfil: [{ id: 3, nome: 'Pessoa teste', idade: 30, peso: 75, altura: 178, fotoPerfil: 'data:image/jpeg;base64,Zm90bw==', criadoEm: new Date('2025-01-01T12:00:00.000Z') }],
  catalogo: [
    { id: 1, nome: 'Supino', grupoMuscular: 'Peito', equipamento: 'Barra', videoUrl: '', defaultSeries: 3, defaultReps: '8-12' },
    { id: 2, nome: 'Supino personalizado', grupoMuscular: 'Peito', equipamento: 'Máquina', videoUrl: '', defaultSeries: 4, defaultReps: '10' }
  ],
  fichas: [
    { id: 8, nome: 'Principal', foco: 'Força', corTema: 'teal', origem: 'local', criadoEm: new Date('2025-01-02T12:00:00.000Z'), atualizadoEm: new Date('2026-10-01T12:00:00.000Z') },
    { id: 9, nome: 'Importada', foco: 'Peito', corTema: 'cerulean', origem: 'importada', criadoEm: new Date('2025-02-02T12:00:00.000Z'), atualizadoEm: new Date('2025-02-02T12:00:00.000Z') }
  ],
  treinos: [
    { id: 14, fichaId: 8, nome: 'Treino A', foco: 'Peito', ordem: 1, diasDaSemana: [1, 3, 5], corTema: 'bubblegum', exercicios: [{ exercicioId: 2, ordem: 1, series: 3, repsAlvo: '8-12', taxaAumentoKg: 2.5, descansoSegundos: 90, pesoBaseAtual: 25, substitutosIds: [1], temDescanso: true }], criadoEm: new Date('2025-01-03T12:00:00.000Z'), atualizadoEm: new Date('2026-10-01T12:00:00.000Z') },
    { id: 15, fichaId: 8, nome: 'Treino B', foco: 'Costas', ordem: 2, diasDaSemana: [2, 4, 6], corTema: 'teal', exercicios: [{ exercicioId: 1, ordem: 1, series: 4, repsAlvo: '10', taxaAumentoKg: 0, descansoSegundos: 60, pesoBaseAtual: 0, substitutosIds: [], temDescanso: true }], criadoEm: new Date('2025-01-03T12:00:00.000Z'), atualizadoEm: new Date('2026-10-01T12:00:00.000Z') }
  ],
  configuracoes: [{ chave: 'principal', fichaAtivaId: 8 }],
  programacoes: [{ id: 22, fichaId: 8, efetivaEm: new Date('2025-01-03T12:00:00.000Z'), diaLocalVigencia: '2025-01-03', fusoHorario: 'America/Sao_Paulo', offsetMinutos: 180, motivo: 'ativacao', fichaNome: 'Principal', treinos: [{ treinoId: 14, treinoNome: 'Treino A', diasDaSemana: [1, 3, 5] }, { treinoId: 15, treinoNome: 'Treino B', diasDaSemana: [2, 4, 6] }] }],
  historico: [
    { id: 31, fichaId: 8, treinoId: 14, fichaNome: 'Principal', treinoNome: 'Treino A', fichaFoco: 'Força', fichaCorTema: 'teal', dataInicio: new Date('2026-11-04T10:00:00.000Z'), dataFim: new Date('2026-11-04T11:00:00.000Z'), diaConclusaoLocal: '2026-11-04', fusoConclusao: 'America/Sao_Paulo', offsetConclusaoMinutos: 180, estado: 'finalizado', duracaoMinutos: 60, exerciciosRealizados: [{ exercicioId: 2, nome: 'Supino personalizado', grupoMuscular: 'Peito', ordem: 1, seriesPlanejadas: 1, repsAlvo: '10', pesoBasePlanejado: 25, taxaAumentoKg: 2.5, temDescanso: true, descansoSegundos: 90, seriesRealizadas: [{ numeroDaSerie: 1, peso: 27.5, reps: '10', finalizada: true }] }] },
    { id: 32, fichaId: 8, treinoId: 14, fichaNome: 'Principal', treinoNome: 'Treino A', dataInicio: new Date('2026-11-05T10:00:00.000Z'), dataFim: new Date('2026-11-05T11:00:00.000Z'), estado: 'cancelado', duracaoMinutos: 60, exerciciosRealizados: [] },
    { id: 33, fichaId: 8, treinoId: 14, fichaNome: 'Principal', treinoNome: 'Treino A', dataInicio: new Date('2026-11-08T14:00:00.000Z'), estado: 'em_andamento', duracaoMinutos: 60, exerciciosRealizados: [{ exercicioId: 2, nome: 'Supino personalizado', grupoMuscular: 'Peito', ordem: 1, seriesPlanejadas: 1, repsAlvo: '10', pesoBasePlanejado: 25, taxaAumentoKg: 2.5, temDescanso: true, descansoSegundos: 90, seriesRealizadas: [{ numeroDaSerie: 1, peso: 30, reps: 9, finalizada: false }] }] }
  ],
  medidasCorporais: [{ id: 4, dataLocal: '2026-11-02', pesoKg: 76, cinturaCm: 82 }]
})

const copia = valor => structuredClone(valor)
const adaptador = tabelas => ({
  tabelas: copia(tabelas), falhar: false,
  async lerSnapshot() { return copia(this.tabelas) },
  async substituir(novas) {
    const anteriores = copia(this.tabelas)
    try {
      this.tabelas = copia(novas)
      if (this.falhar) throw new Error('falha simulada')
    } catch (erro) { this.tabelas = anteriores; throw erro }
  }
})

test('exporta tabelas persistidas, datas, foto, fichas e sessão em andamento', async () => {
  const dbFake = adaptador(fixture())
  const backup = await exportarBackup(dbFake, agora)
  assert.equal(backup.formato, FORMATO_BACKUP)
  assert.equal(backup.versao, 5)
  assert.equal(backup.schemaOrigem, 6)
  assert.deepEqual(backup.tabelas.medidasCorporais, fixture().medidasCorporais)
  assert.equal(backup.tabelas.perfil[0].fotoPerfil, fixture().perfil[0].fotoPerfil)
  assert.equal(backup.tabelas.programacoes[0].fusoHorario, 'America/Sao_Paulo')
  assert.equal(backup.tabelas.historico[0].diaConclusaoLocal, '2026-11-04')
  assert.equal(typeof backup.tabelas.historico[0].dataFim, 'string')
  assert.equal(resumoBackup(backup).sessaoEmAndamento, true)
  assert.equal(resumoBackup(backup).fichas, 2)
  assert.equal(resumoBackup(backup).treinos, 2)
  assert.equal(resumoBackup(backup).exercicios, 2)
  assert.equal(resumoBackup(backup).medidasCorporais, 1)
})

test('lê backups v1 e v2 sem medições e os restaura com a tabela nova vazia', async () => {
  const backupV3 = await exportarBackup(adaptador(fixture()), agora)
  for (const versao of [1, 2]) {
    const legado = copia(backupV3)
    legado.versao = versao
    delete legado.tabelas.medidasCorporais
    if (versao === 1) {
      delete legado.tabelas.catalogo[0].exercicioCanonicoId
      for (const sessao of legado.tabelas.historico) for (const exercicio of sessao.exerciciosRealizados) {
        delete exercicio.exercicioCanonicoId
        delete exercicio.planejado
        delete exercicio.registrosEditados
      }
    }
    const validado = validarBackup(legado)
    assert.deepEqual(validado.tabelas.medidasCorporais, [])
    const destino = adaptador({ perfil: [], catalogo: [], fichas: [], treinos: [], configuracoes: [], programacoes: [], historico: [], medidasCorporais: [] })
    await restaurarBackup(destino, validado)
    assert.deepEqual(destino.tabelas.medidasCorporais, [])
    assert.equal(destino.tabelas.historico.length, fixture().historico.length)
  }
})

test('valida medidas corporais e rejeita duas medições na mesma data', async () => {
  const backup = await exportarBackup(adaptador(fixture()), agora)
  const medidaInvalida = copia(backup)
  medidaInvalida.tabelas.medidasCorporais[0].pesoKg = 0
  assert.throws(() => validarBackup(medidaInvalida), /dados inválidos/)
  const dataDuplicada = copia(backup)
  dataDuplicada.tabelas.medidasCorporais.push({ id: 5, dataLocal: '2026-11-02', cinturaCm: 81 })
  assert.throws(() => validarBackup(dataDuplicada), /dados inválidos/)
})

test('valida formato, versão, tipos e relacionamentos antes de aceitar o backup', async () => {
  const backup = await exportarBackup(adaptador(fixture()), agora)
  assert.equal(lerArquivoBackup(JSON.stringify(backup)).formato, FORMATO_BACKUP)
  assert.throws(() => lerArquivoBackup('{'), /Não foi possível ler/)
  assert.throws(() => validarBackup({ ...backup, formato: 'gy-training-program' }), /não é um backup válido/)
  assert.throws(() => validarBackup({ ...backup, versao: 99 }), /versão de backup não é compatível/)
  assert.throws(() => lerArquivoBackup('x'.repeat(TAMANHO_MAXIMO_BACKUP + 1)), /50 MB/)
  const relacionamento = copia(backup)
  relacionamento.tabelas.treinos[0].fichaId = 500
  assert.throws(() => validarBackup(relacionamento), /dados inválidos/)
  const dataInvalida = copia(backup)
  dataInvalida.tabelas.programacoes[0].diaLocalVigencia = '2026-02-31'
  assert.throws(() => validarBackup(dataInvalida), /dados inválidos/)
  const urlInsegura = copia(backup)
  urlInsegura.tabelas.catalogo[0].videoUrl = 'javascript:alert(1)'
  assert.throws(() => validarBackup(urlInsegura), /dados inválidos/)
})

test('restaura em substituição, preserva IDs e datas e pode ser repetido sem duplicar', async () => {
  const origem = adaptador(fixture())
  const backup = await exportarBackup(origem, agora)
  const destino = adaptador({ perfil: [], catalogo: [], fichas: [], treinos: [], configuracoes: [], programacoes: [], historico: [], medidasCorporais: [] })
  await restaurarBackup(destino, backup)
  await restaurarBackup(destino, backup)
  assert.deepEqual(destino.tabelas, origem.tabelas)
  assert.ok(destino.tabelas.historico[0].dataFim instanceof Date)
})

test('restaura documento reativo do seletor Vue sem DataCloneError ou perda de campos', async () => {
  const origem = fixture()
  const backup = reactive(await exportarBackup(adaptador(origem), agora))
  const destino = adaptador({})
  await restaurarBackup(destino, backup)
  assert.deepEqual(destino.tabelas, origem)
  assert.ok(destino.tabelas.historico[0].dataFim instanceof Date)
})

test('descarta rascunho da instalação anterior apenas depois de restaurar com sucesso', async () => {
  const anterior = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  const memoria = new Map([['gy:sessao-pendente:v1', 'rascunho anterior']])
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { removeItem: chave => memoria.delete(chave) } })
  try {
    const backup = await exportarBackup(adaptador(fixture()), agora)
    const destino = adaptador({})
    destino.falhar = true
    await assert.rejects(restaurarBackup(destino, backup), /falha simulada/)
    assert.equal(memoria.size, 1)
    destino.falhar = false
    await restaurarBackup(destino, backup)
    assert.equal(memoria.size, 0)
  } finally {
    if (anterior) Object.defineProperty(globalThis, 'sessionStorage', anterior)
    else delete globalThis.sessionStorage
  }
})

test('falha de substituição mantém os registros anteriores do adaptador', async () => {
  const backup = await exportarBackup(adaptador(fixture()), agora)
  const anterior = { perfil: [], catalogo: [], fichas: [], treinos: [], configuracoes: [], programacoes: [], historico: [], medidasCorporais: [] }
  const destino = adaptador(anterior)
  destino.falhar = true
  await assert.rejects(restaurarBackup(destino, backup), /falha simulada/)
  assert.deepEqual(destino.tabelas, anterior)
})

test('preserva a mesma sequência real para os mesmos dados e instante de referência', async () => {
  const backup = await exportarBackup(adaptador(fixture()), agora)
  const destino = adaptador({ perfil: [], catalogo: [], fichas: [], treinos: [], configuracoes: [], programacoes: [], historico: [], medidasCorporais: [] })
  const antes = calcularSequencia(backup.tabelas.programacoes, backup.tabelas.historico, agora)
  await restaurarBackup(destino, backup)
  const depois = calcularSequencia(destino.tabelas.programacoes, destino.tabelas.historico, agora)
  assert.deepEqual(depois, antes)
})

test('aceita um backup válido sem perfil e rejeita propriedades de registro não reconhecidas', async () => {
  const dados = fixture(); dados.perfil = []
  const backup = await exportarBackup(adaptador(dados), agora)
  assert.equal(resumoBackup(backup).possuiPerfil, false)
  const incompatível = copia(backup)
  incompatível.tabelas.fichas[0].campoNovo = true
  assert.throws(() => validarBackup(incompatível), /dados inválidos/)
})

test('rejeita IDs duplicados, referências de treino quebradas e sessões inconsistentes antes de restaurar', async () => {
  const backup = await exportarBackup(adaptador(fixture()), agora)
  const duplicado = copia(backup)
  duplicado.tabelas.catalogo.push({ ...duplicado.tabelas.catalogo[0] })
  assert.throws(() => validarBackup(duplicado), /dados inválidos/)

  const treinoSemFicha = copia(backup)
  treinoSemFicha.tabelas.treinos[0].fichaId = 500
  assert.throws(() => validarBackup(treinoSemFicha), /dados inválidos/)

  const treinoSemCatalogo = copia(backup)
  treinoSemCatalogo.tabelas.treinos[0].exercicios[0].exercicioId = 500
  assert.throws(() => validarBackup(treinoSemCatalogo), /dados inválidos/)

  const idRealizadoInvalido = copia(backup)
  idRealizadoInvalido.tabelas.historico[0].exerciciosRealizados[0].exercicioId = 0
  assert.throws(() => validarBackup(idRealizadoInvalido), /dados inválidos/)

  const sessaoSemExercicios = copia(backup)
  delete sessaoSemExercicios.tabelas.historico[0].exerciciosRealizados
  assert.throws(() => validarBackup(sessaoSemExercicios), /dados inválidos/)
})

test('bloqueia novas gravações enquanto uma restauração está coordenada', async () => {
  let escreveu = false
  gravacoesBackupBloqueadas.value = true
  try {
    await assert.rejects(comGravacaoGy(async () => { escreveu = true }), /dados estão sendo restaurados/)
    assert.equal(escreveu, false)
  } finally { gravacoesBackupBloqueadas.value = false }
})

test('backup v4 preserva agenda deslocada e continua lendo documentos v3', async () => {
  const tabelas = fixture()
  tabelas.programacoes.push({ ...copia(tabelas.programacoes[0]), id: 23, motivo: 'deslocamento', efetivaEm: new Date('2026-11-03T12:00:00Z'), diaLocalVigencia:'2026-11-03', agenda: { inicio:'2026-11-03',fim:'2026-11-08',itens:[{dia:'2026-11-03',treinoId:14,treinoNome:'Treino A'},{dia:'2026-11-04',treinoId:15,treinoNome:'Treino B'}] } })
  const origem=adaptador(tabelas)
  const backup=await exportarBackup(origem,agora)
  const destino=adaptador(fixture())
  await restaurarBackup(destino,backup)
  assert.deepEqual(destino.tabelas,tabelas)
  const legado=await exportarBackup(adaptador(fixture()),agora)
  legado.versao=3
  assert.equal(validarBackup(legado).versao,3)
  for(const mudar of [b=>b.tabelas.programacoes[1].agenda.itens.push({...b.tabelas.programacoes[1].agenda.itens[0]}),b=>b.tabelas.programacoes[1].agenda.itens[0].treinoId=999,b=>b.tabelas.programacoes[1].agenda.itens[0].dia='2026-11-02']) {
    const invalido=copia(backup); mudar(invalido); assert.throws(()=>validarBackup(invalido))
  }
})
