# Etapa 12A — Auditoria funcional e integração

Data: 09/11/2026 · Fuso de referência: America/Sao_Paulo.

## Resumo executivo

A auditoria identificou 12 achados: 2 P0, 4 P1, 5 P2 e 1 P3. Após a correção da Etapa 12A.1, 11 estão corrigidos e permanece o P3 de recorte visual em 320 px. Há verificações de dispositivos e funcionalidades citadas no roteiro que não estão disponíveis na interface atual; elas estão explicitadas abaixo.

A aplicação passou no build, nos 94 testes automatizados e em três verificações adicionais com IndexedDB real. O backup foi exportado, restaurado pela interface em outra origem, recarregado e reexportado: as oito tabelas foram comparadas integralmente e eram idênticas. Uma falha injetada na última tabela confirmou rollback real de toda a restauração.

Os testes não equivalem a homologação em Android/iOS ou a desligamento de toda a rede do dispositivo.

## Situação inicial e preservação

- Branch: `main`.
- Alterações locais anteriores: compactação visual em `src/components/treino/TreinoExecucao.vue` e espaçamento em `src/views/PerfilView.vue`. Preservadas. O arquivo PerfilView não foi alterado nesta etapa.
- Suíte inicial: 80 testes aprovados.
- Dexie: schema 5; tabelas `perfil`, `catalogo`, `fichas`, `treinos`, `configuracoes`, `programacoes`, `historico`, `medidasCorporais`.
- Contrato: `gy-backup` v3; leitores v1/v2 presentes e testados.
- Sem alteração de schema, versão do backup, paleta, logo, fonte, curadoria ou regras da sequência. Sem dependência nova, commit, push ou publicação.

## Ambiente e método

A origem pessoal `localhost:5173` não foi usada para operações de teste. Foram usados perfil “Auditoria 12A”, fichas e medidas fictícias em `127.0.0.1:5188` (desenvolvimento) e `127.0.0.1:5189` (build de produção/preview), cada uma com IndexedDB e armazenamento próprios. A origem de testes anterior `127.0.0.1:5173` foi apenas aberta; não foi usada como destino de restauração.

A estratégia separou diagnóstico, correção e repetição dos cenários. Os testes novos da store usam Pinia real carregada pelo Vite, com adaptador de banco simulado. Não são apresentados como testes de IndexedDB real. Os três testes do arquivo HTML e a jornada em duas origens usam efetivamente o IndexedDB do navegador.

## Achados

### A01 — P0 — Últimas edições perdidas ao recarregar imediatamente — corrigido

- Área: execução/autosave/recuperação.
- Reprodução: editar carga, repetições e descanso e recarregar antes de terminar o debounce. Na execução observada, o retorno trouxe os valores anteriores (-5/-2/10/60 da fixture de diagnóstico), perdendo as correções 20/8/22/0.
- Causa: o evento de saída só iniciava uma gravação assíncrona; o navegador podia encerrar a página antes da obtenção do lock e conclusão da transação.
- Correção: rascunho síncrono por aba em sessionStorage no pagehide/ocultação, associado ao ID, início e bases conhecidas da sessão. Na recarga, só é reaplicado se o registro ainda estiver em andamento e corresponder à base esperada. O IndexedDB continua sendo a persistência principal. O rascunho é descartado após a gravação correspondente e após restauração completa de backup, inclusive nas outras abas notificadas.
- Validação: teste de regressão de recarga, teste de rascunho incompatível com alterações externas e teste de limpeza somente após restauração bem-sucedida. No navegador, a recarga imediata passou a recuperar 20 kg, 22 kg, 8 repetições, descanso zero e o substituto.
- Limite: não se garante a última digitação diante de encerramento forçado do processo/OS sem eventos de saída, nem se sessionStorage estiver indisponível ou sem espaço. O debounce principal permanece em 300 ms.

### A02 — P0 — Uma aba antiga podia sobrescrever ou reabrir uma sessão — corrigido

- Área: autosave concorrente e finalização.
- Reprodução verificável: carregar a mesma sessão em duas stores/abas; concluir/alterar na primeira e persistir o snapshot antigo na segunda. A atualização anterior gravava novamente `estado: em_andamento` sem conferir o estado atual.
- Causa: update incondicional do snapshot na fila local; a fila não protege contra outra aba.
- Correção: leitura e comparação do estado e da assinatura dos exercícios dentro da mesma transação de gravação. Sessões finalizadas/canceladas ou modificadas por outra aba recusam o snapshot desatualizado e mostram orientação para reabrir o treino. A finalização também confere a base.
- Validação: regressão para sessão finalizada e alteração concorrente; navegador com duas abas, em que a edição de 99 kg na aba antiga foi recusada e a sessão válida foi finalizada com 20/22 kg. O histórico permaneceu correto.
- Limite: não há mesclagem automática de edições concorrentes; a aba desatualizada precisa reabrir o treino.

### A03 — P1 — Restauração pela interface falhava com DataCloneError — corrigido

- Área: backup v3.
- Reprodução: selecionar arquivo válido, conferir prévia, confirmar “Restaurar e substituir”. O diálogo exibiu `Failed to execute structuredClone ... could not be cloned`; o banco continuou intacto.
- Causa: o documento armazenado em ref torna-se um Proxy Vue; structuredClone não clona o Proxy usado na transformação das tabelas.
- Correção: materialização pelo contrato JSON do backup e reconstrução explícita dos campos Date. O contrato só permite dados compatíveis com JSON e datas conhecidas.
- Validação: regressão com documento reactive(Vue), fluxo completo de arquivo/prévia/confirmação/recarga, comparação de oito tabelas entre duas origens e integração com IndexedDB real. Backups v1/v2 continuam aprovados na suíte.

### A04 — P1 — Ajustes inválidos permitiam salvar treinos inviáveis — corrigido

- Área: cadastro/edição de treinos.
- Reprodução: valores negativos, fracionários ou fora dos limites nos campos de séries, aumento de carga ou descanso eram aceitos pela store. Séries sem quantidade válida impedem uma execução normal e alguns valores quebram o contrato do backup.
- Causa: ausência de validação dos ajustes antes da transação.
- Correção: conferir limites e tipos de séries, alvo de repetições, aumento, carga base e descanso antes de gravar. Limites HTML reforçam a orientação dos campos, mas não substituem a validação da store.
- Validação: regressões para séries -1/1,5, descanso -1 e aumento -2. Na interface, séries -1 foram rejeitadas sem sair da edição; ao corrigir para 1, o treino foi salvo com sucesso.

### A05 — P1 — Séries negativas podiam ser concluídas — corrigido

- Área: execução/histórico/backup.
- Reprodução no navegador: informar -5 kg e -2 repetições e acionar “Concluir todas”. O card passou a concluído e exibiu os campos negativos desabilitados.
- Causa: as ações de conclusão não validavam as séries; o autosave também aceitava cargas incompatíveis com o contrato de backup.
- Correção: concluir individualmente, concluir todas e finalizar exigem carga finita não negativa e repetições inteiras positivas. O autosave recusa cargas e descanso numéricos inválidos e preserva o registro anterior do banco, exibindo erro para correção.
- Validação: regressão confirmando ausência de conclusão e de gravação da carga inválida no adaptador; execução válida repetida no navegador com 20/22 kg e 8 repetições.

### A06 — P2 — Descanso zero virava 60 segundos — corrigido

- Área: início da execução.
- Reprodução: salvar descanso zero no treino; iniciar sessão; o campo de execução mostrava 60.
- Causa: fallback `descansoSegundos || 60` substituía zero por 60.
- Correção: fallback apenas para ausência de valor (`??`).
- Validação: regressão e nova sessão real com descanso zero; concluir séries não abriu recuperação.

### A07 — P2 — Sheets deixavam TopBar interativa e foco escapar — corrigido

- Área: modais de histórico, vídeo, substituição, compartilhamento e criação de exercício.
- Evidência: somente a confirmação global tinha isolamento da TopBar; o seletor de substitutos inicial ainda expunha o botão da navegação na árvore acessível. Alguns sheets não possuíam gerenciamento de foco comum.
- Correção: observação dos diálogos montados, TopBar inert enquanto houver diálogo, foco contido no diálogo e restauração de foco ao sair. Feedbacks aguardam o fechamento do modal. A composição visual da TopBar não mudou.
- Validação: histórico e substituição reais com `topbarInert=true` e foco dentro do diálogo; Tab permaneceu no modal. Confirmações de medição, ficha e restauração funcionaram, com processamento sem confirmação duplicada. A suíte existente também verifica concorrência e falha assíncrona das confirmações.

### A08 — P2 — Controles invisíveis ou sem nome acessível — corrigido

- Área: cards recolhidos e ajustes de séries.
- Evidência: a árvore acessível da execução incluía os campos e botões do exercício recolhido. No wizard, campos numéricos e botões de ícone apareciam sem nome.
- Correção: região recolhida inert; nomes para conclusão/desfazer de série, séries, alvo, aumento, descanso, aplicar descanso e remover exercício. O controle de ativar descanso informa seu estado.
- Validação: árvore acessível posterior sem controles internos do card recolhido e com nomes dos controles do wizard. Não foi feita homologação com leitor de tela externo.

### A09 — P2 — Histórico corporal usava ponto decimal — corrigido

- Área: registros corporais.
- Reprodução: gráfico exibia 71,5 kg e o cartão histórico exibia 71.5 kg.
- Causa: interpolação direta do número.
- Correção: formatação pt-BR na descrição dos registros.
- Validação: criação/edição real, com cartões e gráficos mostrando 71,5 e 72,2 kg.

### A10 — P2 — Sessão não era recuperada globalmente em abertura direta — corrigido

- Área: navegação/TopBar.
- Evidência: após restaurar uma sessão em andamento, a abertura direta de Perfil mostrava logo; a sessão e cronômetro só eram carregados ao visitar Treino.
- Causa: inicialização da store de execução ocorria apenas na view Treino.
- Correção: após a rota inicial resolver, carregar a sessão também quando o aplicativo inicia em outra aba, sem duplicar a inicialização feita na view Treino.
- Validação: recarga direta de Perfil na origem de desenvolvimento mostrou o cronômetro “Em andamento”, mantendo o acesso ao backup.

### A11 — P1 — Cancelamento não possuía ação acessível no fluxo normal — corrigido na Etapa 12A.1

- Área: execução/cancelamento.
- Evidência original: durante a execução havia conclusão/desfazer/finalizar, mas não havia ação de cancelar. A rotina privada `cancelarSessao` só era chamada pelo fluxo de início de outro treino.
- Solução: a sessão em andamento agora oferece “Cancelar treino” no menu discreto ao lado do nome. A ação abre a confirmação global personalizada e permite continuar treinando ou confirmar o cancelamento.
- Integridade: o cancelamento aguarda e grava o autosave, muda o mesmo registro para `cancelado`, limpa o rascunho local, interrompe cronômetro/descanso e volta à prévia. A gravação transacional continua protegida contra autosaves atrasados e mudanças concorrentes; falhas deixam a execução ativa e a confirmação aberta.
- Validação: fluxo real no navegador com dados fictícios isolados, incluindo desistência, confirmação e feedback; regressões automatizadas para sessão com série registrada, recuperada, gravação pendente, falha de persistência, tentativa duplicada, recarga sem sessão fantasma, impossibilidade de finalizar cancelada e início posterior de outro treino. A suíte da sequência também cobre exclusão de cancelados dos indicadores.
- Limite de validação desta correção: o navegador disponível não permitiu alterar a largura do viewport; os breakpoints de 320, 375 e 390 px não foram exercitados nesta etapa.

### A12 — P3 — Recorte lateral da TopBar em 320 px — pendente

- Evidência: captura em 320 px mostra o ícone lateral direito parcialmente recortado.
- Usabilidade: botão central do menu e as quatro abas continuaram acessíveis; navegação para Histórico foi realizada nessa largura. Nenhum botão essencial ficou fora do viewport nas medições realizadas.
- Tratamento: preservar para refinamento visual; não redesenhar a TopBar para corrigir um recorte decorativo. Há também textos singulares como “1 exercícios”, sem bloqueio funcional, a revisar na etapa visual.

## Matriz de funcionalidades

“Aprovada” indica aprovação nos cenários descritos, não cobertura exaustiva de todas as combinações/dispositivos.

| Área | Estado | Evidência e ressalva |
| --- | --- | --- |
| Cadastro e perfil | Aprovada com ressalvas | Banco vazio, cadastro fictício e acesso às abas. Não existe editor de perfil na view atual; upload/compressão de foto não foi repetido no navegador. Foto permanece coberta pelo round-trip da fixture de serviço. |
| Criação e edição de fichas/treinos | Aprovada | Criação de ficha com dois treinos, seleção, ajustes obrigatórios, salvar e editar; inválidos rejeitados. |
| Ficha ativa | Aprovada | Ativar original, alternar para cópia e reativar original; apenas uma configuração ativa. |
| Programação semanal | Aprovada | Segunda/terça, bloqueio de dia ocupado, treino do dia e de amanhã; snapshots e transições cobertos pela suíte. |
| Execução | Aprovada com ressalvas | Início, séries, avanço, substituição, finalização e cancelamento confirmado; dispositivos físicos não homologados. |
| Autosave | Aprovada com ressalvas | Persistência, conflito entre abas e recarga imediata após correção; encerramento forçado do OS não testado. |
| Recuperação | Aprovada | Recarregar e recuperar substituto/valores; sessão recuperada de backup em outra base. |
| Substituições | Aprovada | Curadoria, snapshot planejado, zeragem da carga ao trocar, persistência, histórico próprio e ficha original preservada. |
| Histórico global | Aprovada | Segunda sessão em outra ficha recuperou 20/22 kg; substituto recuperou 15/17 kg, sem concluir automaticamente. |
| Histórico de sessões | Aprovada | Detalhe com quatro séries, duração, cargas e exercício executado; duas sessões finais em fichas distintas. |
| Sequência adaptativa | Aprovada com ressalvas | Valor 0 e depois 1 congelado; segunda sessão no mesmo dia não incrementou. Demais cenários, fusos, meia-noite, faltas e descanso cobertos por 23 testes de domínio; passagem real de dias não simulada no navegador. |
| Evolução corporal | Aprovada | Criação com campos opcionais, edição, variação +0,7 kg, período 30 dias, exclusão/cancelamento, recarga e restauração dos gráficos. |
| Evolução de desempenho | Aprovada com ressalvas | Dois exercícios, duas sessões entre fichas, máximo 22 kg e volume 336 kg·reps; sem carga/cancelados cobertos por testes. Não existe filtro temporal próprio de desempenho no código atual. |
| Compartilhamento de fichas | Aprovada | Exportação real e importação local com prévia; ficha importada não foi ativada; exclusão posterior só da importada. |
| Backup e restauração | Aprovada | Oito tabelas idênticas entre duas bases; arquivo inválido não altera banco; rollback real e compatibilidade v1/v2 automatizada. |
| Feedbacks TopBar | Aprovada com ressalvas | Informação/sucesso/erro observados; aviso real na troca de ficha durante sessão ativa; fechar e retorno. Fila, pausa, prioridade e duração cobertas por testes; não houve disparo isolado de todos os tons em todos os breakpoints. |
| Modais | Aprovada com ressalvas | Histórico, substituição, compartilhamento, medições, exclusão de ficha, backup e confirmação de cancelamento; foco, inert, desistência e processamento. Exclusão individual de treino não possui ação dedicada no código atual. |
| Navegação | Aprovada | Cadastro → Fichas → Treino → Histórico → Perfil; menu em 320 px, rotas diretas e recarga. |
| Responsividade/rolagem | Aprovada com ressalvas | Corpo/desempenho nas seis larguras e demais jornadas em desktop; menu em 320, foco por teclado, End no main de 1935 px produziu scrollTop 1163. Não foram homologados todos os sheets em todas as larguras nem toque em dispositivo físico. A12 permanece. |
| Offline/PWA | Aprovada com ressalvas | Build de produção com servidor 5189 desligado: recarga por cache, rotas, execução, autosave, substituição, finalização, gráficos, exportação, restauração e compartilhamento local funcionaram. Não se desligou toda a rede do dispositivo. |

## Integrações executadas

### Ida e volta de backup em bases reais

1. Origem 5188: cadastro, três fichas (original e duas cópias criadas durante os testes), seis treinos, ficha ativa, snapshots da programação, sessão finalizada com substituto e duas medidas.
2. Segunda sessão em outra ficha: aplicar referência de 20/22 kg e confirmar somente uma série. Exportar pela tela Perfil.
3. Documento: v3/schema 5, 1 perfil, 233 exercícios, 3 fichas, 6 treinos, 1 configuração, 4 programações após nova troca, 2 sessões (uma finalizada e uma em andamento), 2 medições. O primeiro export anterior à nova troca continha 3 programações e 1 sessão.
4. Destino 5189 sem perfil: acesso ao backup pelo onboarding, seletor de arquivo, prévia incluindo medições e sessão em andamento, confirmação, gravação e recarga automática.
5. Reexportação do destino antes de retomar a sessão: igualdade integral de `tabelas` por comparação JSON. Metadado `criadoEm` do documento não entra na comparação.
6. Recuperação da sessão, referência do substituto, conclusão e gráficos com duas sessões. Mesmos IDs preservados; nenhum histórico paralelo criado.
7. Após rejeitar versão 99, nova comparação das exportações confirmou todas as tabelas intactas.

### Transações com IndexedDB verdadeiro

Runner: `tests/integracao-indexeddb.html`, com script `tests/integracao-indexeddb.ts`. Só habilita ações em 127.0.0.1:5188 e exige o nome da fixture “Auditoria 12A” e medições presentes.

- Documento Vue reativo → adaptadorDexie → oito tabelas idênticas.
- Versão inválida → rejeição e snapshot idêntico.
- Hook de criação na tabela final `medidasCorporais` força erro depois de limpar e regravar as tabelas anteriores → rollback integral real.

Resultado: **3/3 aprovadas**, observadas pela interface do runner. Evidência de captura salva em `/tmp/gy-etapa12a-indexeddb.png`.

## Testes e verificações finais

- `npm test`: **88 testes aprovados**, zero falhas. Eram 80 na situação inicial.
- Adicionados seis testes de store em `tests/sessaoPersistencia.test.mjs`: descanso zero, valores inválidos, conflito entre abas/finalização, rascunho de recarga, ajustes inválidos e rascunho externo desatualizado.
- Adicionados dois testes em `tests/backup.test.mjs`: documento reativo e limpeza do rascunho somente após restauração bem-sucedida.
- `npm run build`: aprovado; inclui verificação TypeScript por `vue-tsc -b` e geração do service worker.
- `git diff --check`: aprovado.
- Não existe script de lint separado no package.json; nenhum comando de lint foi inventado.
- Runner de IndexedDB: três integrações reais aprovadas, separadas dos 88 testes Node.
- Logs locais de referência: `/tmp/gy-etapa12a-tests.log` e `/tmp/gy-etapa12a-build.log`.

## PWA e limitações

Inspecionados manifest, ícones locais, `registerType: autoUpdate` e precache do Workbox. O build gerou 39 entradas de precache. O teste de atualização exigiu que o novo service worker ativasse e a página fosse reaberta; versões antigas em cache não foram confundidas com validação da correção.

A indisponibilidade real da origem foi produzida encerrando o processo de preview 5189. Não foi usado o servidor de desenvolvimento como evidência de offline. A rede externa do computador permaneceu ativa. Vídeos do YouTube e a fonte obtida do Google Fonts dependem de rede/cache externo; o Workbox atual não garante a fonte por precache local. Não houve validação de reprodução de vídeo nem teste em iOS/Android, modo instalado, safe areas reais ou troca de fuso do dispositivo.

Não foram validados upgrade de um banco legado schema 4 com uma instalação antiga real, quota cheia, corrupção externa do IndexedDB, leitor de tela físico ou encerramento forçado do processo. O registro dessas lacunas não significa aprovação desses cenários.

O roteiro cita edição de perfil, exclusão individual de treino e filtro temporal de desempenho. Não há ações correspondentes na interface/código atual. Nenhuma dessas funcionalidades foi criada nesta auditoria nem declarada aprovada.

## Arquivos desta etapa

Modificados:

- `src/App.vue` — inicialização global da sessão e isolamento da TopBar durante diálogos.
- `src/components/fichas/FichaWizardAjustes.vue` — nomes acessíveis e limites dos controles.
- `src/components/perfil/EvolucaoCorporal.vue` — formatação pt-BR dos registros.
- `src/components/treino/TreinoExecucao.vue` — somente inert dos cards recolhidos e nomes dos botões de série, sobre a alteração local anterior.
- `src/services/backup.ts` — materialização JSON do documento reativo e descarte de rascunho após sucesso.
- `src/services/backupCoordinator.ts` — descarte do rascunho nas outras abas ao concluir restauração.
- `src/stores/fichaStore.ts` — validação anterior à gravação dos ajustes.
- `src/stores/treinoStore.ts` — conflito transacional, rascunho de recarga, validação de séries e descanso zero.
- `src/utils/exercicioSessao.ts` — chave compartilhada do rascunho.
- `src/views/TreinoView.vue` — captura síncrona do rascunho antes de ocultar/sair.
- `tests/backup.test.mjs` — regressões de restauração.

Criados:

- `src/composables/useModalAcessibilidade.ts`.
- `tests/sessaoPersistencia.test.mjs`.
- `tests/integracao-indexeddb.html`.
- `tests/integracao-indexeddb.ts`.
- `docs/etapa12a-auditoria-geral.md`.

## Próxima etapa recomendada

Planejar a homologação em dispositivos reais e em rede integralmente desligada. Tratar A12 e pequenas pluralizações no refinamento visual. Alinhar as funcionalidades citadas no roteiro, mas ainda ausentes, antes de considerar qualquer publicação.
