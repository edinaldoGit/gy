# Etapa 16 — Sequência contínua do foguinho e controle de descanso em execução

Versão do aplicativo: **0.2.1**. Data: 17/11/2026.

## Duas melhorias

1. **Sequência contínua do foguinho:** o contador numérico do badge na `TopBar` e o destaque de sequência no `FoguinhoModal` passam a exibir `treinosConsecutivos` de forma contínua, sem reiniciar a contagem na virada entre semanas. Dias de descanso continuam preservando a sequência, e o contador só zera quando há falta consolidada em um dia programado (`dia < hoje` sem conclusão). Os níveis visuais da chama (`Chama Polar` a `Gy Prime`) permanecem governados pelas semanas completas consecutivas (`semanasConsecutivas`), exceto a transição inicial para `Faísca` (2 treinos programados consecutivos). Na `TopBar`, contagens de dois dígitos aplicam ajuste tipográfico compacto (`foguinho-badge-count-wide`) e valores acima de 99 exibem `99+`.
2. **Ativação e desativação do descanso por exercício durante o treino:** em `TreinoExecucao.vue`, cada exercício passa a contar com um toggle acessível (`type="button"`, `aria-pressed`, `aria-label`) junto ao campo de segundos de descanso, seguindo o padrão visual de `FichaWizardAjustes.vue`. Quando `temDescanso` é desativado, o campo numérico de `descansoSegundos` fica desabilitado e visualmente atenuado, eventual cronômetro de descanso ativo é interrompido imediatamente (`pularDescanso()`), novas séries concluídas nesse exercício não disparam o overlay de recuperação, a sessão `em_andamento` é salva imediatamente no IndexedDB e a preferência é propagada para o treino correspondente na ficha (`db.treinos` e `fichaStore`), inclusive quando o exercício foi substituído na sessão (`planejado.exercicioId`), sem gerar novo snapshot de `ProgramacaoVigente`.

## Integridade, banco e backup

- **Dexie/IndexedDB permanece na versão 6.** Os campos `temDescanso` em `ExercicioNaFicha` (`db.treinos`) e `ExercicioRealizado` (`db.historico`) já faziam parte do modelo persistido; nenhuma migração de schema ou limpeza de base é executada.
- **Backup permanece na versão 5**, preservando leitura de versões 1 a 5 e restauração transacional. O validador e exportador de backup já incluem `temDescanso` nos exercícios de treinos e histórico.
- Ao restaurar uma sessão `em_andamento`, `fichaDoSnapshot` preserva `temDescanso: ex.temDescanso` junto com `recuperarExercicio`, garantindo consistência ao recarregar o aplicativo.
- A propagação de `temDescanso` para `db.treinos` ocorre sob `comGravacaoGy`, atualiza `atualizadoEm` do treino e preserva a integridade caso o treino ou exercício não exista mais na ficha.

## Testes executados

- Linha de base anterior: **141 testes aprovados**.
- Suíte final `npm test`: **146 testes aprovados**, zero falhas.
- `npm run build`: aprovado (`vue-tsc -b && vite build`); TypeScript e build PWA sem erros.
- `git diff --check`: aprovado.
- Novas regressões em `tests/foguinho.test.mjs` e `tests/sequencia.test.mjs`: continuidade de `treinosConsecutivos` através de múltiplas semanas sem reset na segunda-feira, preservação em dias de descanso, reset exclusivo após falta consolidada em dia programado e manutenção da evolução de níveis por semanas completas até `Gy Prime`.
- Novas regressões em `tests/sessaoPersistencia.test.mjs`: alternância de `temDescanso` durante a execução, interrupção imediata do cronômetro ativo ao desativar, não disparo de descanso ao concluir série com `temDescanso === false`, restauração de sessão `em_andamento` mantendo o valor escolhido e propagação para `db.treinos` e `fichaStore` (inclusive após substituição de exercício na sessão) entre treinos futuros até nova alteração manual.
- `tests/foguinho-integracao.html` e `.ts`: execução em **127.0.0.1:5197** com IndexedDB real validando 4 semanas completas + segunda-feira seguinte (`nivel === 5`, `semanasConsecutivas === 4`, `treinosConsecutivos === 21`, `ciclo === 1/5`).
- Inspeção visual em viewport móvel (**375 × 812** e **390 × 844**):
  - Badge do foguinho na `TopBar` verificado com 1 dígito (`2`) e 2 dígitos (`21` com `foguinho-badge-count-wide`), sem quebra de layout e sem rolagem horizontal.
  - `FoguinhoModal` aberto exibindo "Sequência contínua" (`21 treinos`) e "Semanas completas" (`4 semanas`) sem rolagem horizontal.
  - Toggle de descanso em `TreinoExecucao.vue` exercitado (ligado/desligado, atenuação e bloqueio do input numérico, conclusão de série sem abrir overlay de recuperação) e conferido em `FichaWizardAjustes.vue` (Etapa 3 da edição do treino na ficha).

## Arquivos

- Sequência e foguinho: `src/utils/sequencia.ts`, `src/components/layout/TopBar.vue`, `src/components/layout/FoguinhoModal.vue`.
- Execução do treino e persistência na ficha: `src/components/treino/TreinoExecucao.vue`, `src/stores/treinoStore.ts`.
- Testes: `tests/foguinho.test.mjs`, `tests/sequencia.test.mjs`, `tests/foguinho-integracao.ts`, `tests/sessaoPersistencia.test.mjs`.
- Metadados e documentação: `package.json`, `package-lock.json`, `docs/etapa16-foguinho-continuo-e-descanso-treino.md`.

## Limitações e dispositivos físicos

As verificações visuais e de interação foram executadas em Chromium desktop com viewports móveis (375 px e 390 px). Comportamento de toque em tela física e atualização da PWA instalada em aparelhos Android/iOS reais continuam sujeitos à conferência em dispositivos físicos.

## Publicação

- Commit de implementação: `ed02c23` — Implementa sequência contínua do foguinho e controle de descanso na etapa 16.
- Push para `origin/main` concluído, sem push forçado.
- Deploy aprovado: https://github.com/edinaldoGit/gy/actions/runs/44114591653.
- Aplicativo publicado: https://edinaldogit.github.io/gy/.
- Raiz (`/gy/`), `manifest.webmanifest`, `sw.js` e entradas de rota (`/gy/fichas/`, `/gy/historico/`, `/gy/evolucao/`, `/gy/perfil/`) responderam HTTP 200.

### Relação completa de arquivos da implementação

- `docs/etapa16-foguinho-continuo-e-descanso-treino.md`
- `package-lock.json`
- `package.json`
- `src/components/layout/FoguinhoModal.vue`
- `src/components/layout/TopBar.vue`
- `src/components/treino/TreinoExecucao.vue`
- `src/stores/treinoStore.ts`
- `src/utils/sequencia.ts`
- `tests/foguinho-integracao.ts`
- `tests/foguinho.test.mjs`
- `tests/sequencia.test.mjs`
- `tests/sessaoPersistencia.test.mjs`
