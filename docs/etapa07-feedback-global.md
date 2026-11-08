# Etapa 07 — Feedback global e confirmações

## Implementação

A TopBar apresenta notificações de sucesso, erro, aviso e informação em uma pílula branca com ícone, texto, botão de fechar e barra de duração. Seu conteúdo normal permanece montado e fica temporariamente oculto/inert. O cronômetro continua na store original. Encerrado o feedback, a cor é calculada a partir da rota atual. O menu é recolhido quando entra um feedback ou uma confirmação, sem mudar a rota.

A altura normal, proporções, avatar, indicador de sequência, logo, classes cromáticas normais e composição foram mantidos. Não houve alteração do esquema IndexedDB nem dos modelos de fichas/sessões nesta etapa. Não foram adicionadas dependências.

## Arquitetura e API

`src/utils/feedbackManager.ts` implementa a fila sem dependência de Vue ou IndexedDB. `src/composables/useFeedback.ts` expõe o estado reativo e a API:

```ts
feedback.success('Ficha salva com sucesso!')
feedback.error('Não foi possível salvar a ficha.')
feedback.warning('Você possui um treino em andamento.')
feedback.info('Download do arquivo iniciado.')
```

Durações: sucesso 3,5 s; erro 8 s; aviso 6 s; informação 5 s. O `App.vue` fornece um único pulso de relógio de 50 ms, registrado e removido no ciclo de vida. A barra usa exatamente a mesma proporção de tempo restante usada pelo gerenciador. A página oculta, a ausência de TopBar no onboarding e a confirmação aberta têm motivos de pausa independentes. Atualizações de estado não reiniciam o tempo.

Há uma mensagem ativa e até oito aguardando. Duplicatas ativas, pendentes e repetidas dentro de dois segundos são descartadas. Erros têm prioridade, interrompem uma mensagem comum e preservam seu período restante; mensagens triviais não interrompem erros. Após erros, avisos precedem informações e sucessos. O fechamento manual avança a fila.

## Confirmações e camadas

`src/utils/confirmationManager.ts` controla uma única decisão pendente. `src/composables/useConfirm.ts` expõe `confirmation.ask(options)`, que retorna uma promessa booleana. A opção `action` mantém o diálogo aberto e em processamento enquanto a operação real ocorre. Uma exceção ou retorno `false` mantém o erro no próprio diálogo e permite tentar novamente; não há sucesso antecipado. Confirmações simultâneas e cliques repetidos são bloqueados.

`src/components/feedback/ConfirmDialog.vue` apresenta um bottom sheet no mobile e um diálogo centralizado a partir de 640 px. Aceita título, mensagem, detalhes, variante semântica, ícone, textos de ações e operação assíncrona.

O layout do App separa a TopBar da região flexível inferior. O backdrop e o diálogo ocupam somente essa região, sem offsets fixos. A TopBar fica em uma camada superior e permanece legível; recebe `inert` enquanto a confirmação está aberta. O conteúdo principal também recebe `inert` e tem a rolagem bloqueada. A posição inferior acompanha naturalmente a altura da TopBar, incluindo seu recolhimento.

O diálogo usa `role="dialog"`, `aria-modal`, título e descrição associados, `aria-busy` e erros com `role="alert"`. O foco inicial vai para cancelar; Tab e Shift+Tab circulam entre as ações. Escape cancela quando não há processamento. O backdrop não fecha uma confirmação destrutiva. Durante a operação, foco permanece no painel, cancelamento e nova confirmação são bloqueados. Ao fechar, o foco retorna ao controle original; se ele não existir mais, ao conteúdo principal. O código respeita `prefers-reduced-motion` nas novas transições.

## Integrações

- Fichas: criação, edição, ativação, duplicação, exclusão e erros. A confirmação de exclusão executa a operação no próprio diálogo e informa a preservação do histórico, comprovada pelo código de exclusão existente.
- Treinos: adição/edição, erros persistentes no formulário e prevenção de salvamento repetido. A finalização tem bloqueio contra chamadas simultâneas.
- Exercícios: criação com processamento e erro contextual; validação de nome no modal.
- Execução: conclusão após persistência, aviso de ordem de séries e substituição da confirmação nativa ao cancelar uma sessão para iniciar outra. O autosave continua discreto; falhas relevantes também mantêm o aviso contextual original.
- Importação/exportação: prévia e validação preservadas, sucesso agregado de importação, erro de leitura/geração e informação de download iniciado. Falhas da importação permanecem no seu modal existente. Não se promete que o arquivo foi salvo pelo dispositivo.
- Perfil: sucesso no cadastro e erro contextual; exclusão do perfil com confirmação personalizada.
- Histórico: falha de consulta notificada e mensagem persistente original mantida. Consultas normais são silenciosas.

Foram removidos os usos de `alert`/`confirm` nativos encontrados em FichaList, fichaStore, treinoStore e PerfilView.

A exclusão interna de um treino não existe no fluxo atual. Não foi acrescentada uma nova operação de exclusão nesta etapa. A finalização com séries pendentes já é bloqueada; não se adicionou confirmação redundante. A troca de ficha durante sessão continua bloqueada pela regra existente, com aviso global.

## Inconsistência corrigida no perfil

A implementação real apaga somente `db.perfil`; o texto antigo afirmava apagar todos os dados e perder o histórico. O botão, a descrição e a confirmação agora informam exatamente o alcance da operação. Fichas, catálogo, programação e sessões não são apagados. Não se ampliou a exclusão.

## Arquivos

Criados:

- `src/utils/feedbackManager.ts`
- `src/utils/confirmationManager.ts`
- `src/composables/useFeedback.ts`
- `src/composables/useConfirm.ts`
- `src/components/feedback/TopBarFeedback.vue`
- `src/components/feedback/ConfirmDialog.vue`
- `tests/feedback.test.mjs`
- `docs/etapa07-feedback-global.md`

Modificados nesta etapa:

- `src/App.vue`
- `src/components/layout/TopBar.vue`
- `src/stores/fichaStore.ts`
- `src/stores/treinoStore.ts`
- `src/views/FichasView.vue`
- `src/views/PerfilView.vue`
- `src/views/HistoricoView.vue`
- `src/components/fichas/FichaList.vue`
- `src/components/fichas/FichaWizardInfo.vue`
- `src/components/fichas/FichaWizardAjustes.vue`
- `src/components/fichas/CriarExercicioModal.vue`
- `src/components/fichas/FichasCompartilhamento.vue`
- `src/components/treino/TreinoExecucao.vue`
- `src/components/onboarding/OnboardingForm.vue`

As outras alterações locais já existiam e foram preservadas. Não houve commit ou push.

## Validação

`npm run build`, `npm test` e `git diff --check`: aprovados. São 27 testes: 16 novos de feedback/confirmação e 11 anteriores de compartilhamento, histórico e programação.

Os testes novos cobrem as quatro variantes, duração e fechamento por tempo, fila, duplicatas, fechamento manual, prioridade de erros, limite da fila, pausa de documento oculto, pausas simultâneas, confirmação/cancelamento, decisões concorrentes, processamento assíncrono, proteção contra clique duplicado, falha real e retorno falso sem sucesso indevido. São testes dos gerenciadores, não uma suíte automatizada de navegador para o componente visual.

Validação manual em origem isolada `127.0.0.1:5174`, usando apenas dados fictícios; a aba e os dados de `localhost:5173` não foram usados:

- TopBar normal e menu expansível; ativação e duplicação de ficha com feedback.
- Confirmação de exclusão aberta e cancelada, sem executar exclusão de dados no navegador.
- Foco inicial em cancelar, ciclo com Tab/Shift+Tab, Escape e retorno do foco à origem.
- TopBar visível e removida da árvore interativa durante confirmação.
- Diálogo central no desktop de 1280 px e em 768 px; bottom sheet em 320, 375, 390 e 430 px.
- Aviso durante sessão ativa, mensagem em duas linhas, encerramento automático e pelo X, retorno à cor da aba e cronômetro atualizado (00:21 e depois 00:31), sem reiniciar a sessão.
- Conclusão de treino fictício com feedback emitido após a gravação.
- Ausência de erros de console na sessão de teste consultada.

## Pendências e limites

- Em 320 px o extremo direito da TopBar normal apresenta recorte já decorrente de sua composição fixa. Sua geometria foi preservada conforme a restrição explícita; uma revisão responsiva do modo normal fica pendente.
- Teclado virtual, safe area física, rotação em dispositivo real, leitores de tela e preferência de movimento reduzido real precisam de validação adicional. O suporte está implementado, mas esses cenários não foram aprovados visualmente nesta sessão.
- As quatro variantes foram testadas automaticamente; a inspeção visual de mensagens incluiu sucesso e aviso. Erro e informação ainda precisam de inspeção visual específica.
- Não houve ensaio destrutivo de exclusão de perfil ou ficha no navegador. Falhas assíncronas e decisões do gerenciador foram verificadas com operações simuladas nos testes.
- Prévia de importação e demais sheets de domínio continuam com seus componentes existentes. O novo gerenciamento completo de foco/decisão se aplica às confirmações globais.
