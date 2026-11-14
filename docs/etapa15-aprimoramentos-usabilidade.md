# Etapa 15 — Usabilidade, histórico, evolução e perfil

Versão do aplicativo: **0.2.0**. Data: 14/11/2026.

## Oito melhorias

1. **Exercícios personalizados:** opção “Gerenciar exercícios personalizados” em Fichas, disponível também durante o cadastro de um treino. Permite editar nome, grupo, equipamento, vídeo, séries e repetições padrão. Arquivamento confirmado pelo modal global; exercícios oficiais protegidos. Arquivados saem das pesquisas e sugestões novas, permanecendo nas fichas existentes e nos históricos.
2. **Finalização pela TopBar:** cronômetro é uma ação identificada por “Finalizar treino”. Usa o mesmo composable de confirmação da execução e a mesma store que já persiste sessões. Dados pendentes oferecem acesso à execução. A gravação aguarda a fila existente e mantém os bloqueios de duplicação, de concorrência e do limite diário.
3. **Calendário do Histórico:** mês atual, segunda-feira como início, navegação mensal, destaque de hoje e dos dias treinados, filtro por data e limpeza do filtro. Mantém múltiplas sessões por data e a compatibilidade do histórico legado. Cancelamentos não contam. Utiliza a data civil de conclusão persistida; registros antigos usam a data local disponível.
4. **Braços:** quatro campos opcionais independentes, em cm, para direito/esquerdo relaxado/flexionado. Disponíveis no formulário, edição, histórico, gráficos, variação da métrica e backup. Medidas genéricas anteriores continuam com o rótulo “sem especificação”; não são convertidas automaticamente.
5. **Gráficos:** componente SVG compartilhado com área em gradiente, escala explícita, datas curtas no eixo, detalhes do ponto selecionado, variação no período, navegação por toque e teclado. O desenho acompanha a largura real do card. Sem nova biblioteca. Ausências permanecem ausentes e sessões/exercícios mantêm suas identidades.
6. **Seletor de desempenho:** pesquisa tolerante a acentos, grupos musculares expansíveis com contagem e destaque da seleção. Preserva a escolha ao navegar dentro da aplicação e só oferece exercícios efetivamente executados, incluindo substitutos e personalizados.
7. **Cores dos treinos:** cores ocupadas indisponíveis no formulário e validadas dentro da transação de salvamento. A própria cor continua permitida na edição, inclusive em duplicações legadas. Paleta ampliada de 7 para 10 opções. Alterações e exclusões liberam as cores; fichas são independentes. Nenhuma recoloração retroativa.
8. **Foto:** máscara circular, arraste por ponteiro/toque, controles de zoom e posição também acessíveis por teclado. Prévia e recorte utilizam o mesmo retângulo de origem. Cancelar preserva a foto atual. Confirmação gera JPEG de 320 × 320 localmente; o salvamento do perfil persiste o resultado. Limites existentes de JPEG/PNG/WebP e 5 MB mantidos. A decodificação nativa trata a orientação antes do processamento por canvas.

## Integridade, banco e backup

- **Dexie/IndexedDB permanece na versão 6.** Novas propriedades opcionais não precisam de índices nem de migração de tabelas. Não há limpeza de base no aplicativo.
- **Backup passa para a versão 5**, incluindo novos campos corporais e `arquivado`. Leitura de versões 1, 2, 3 e 4 preservada. Restauração continua transacional.
- Arquivamento conserva ID local e canônico. Referências de fichas e snapshots não são reescritos. Exercícios legados editados sem ID canônico recebem a identidade local estável correspondente ao próprio registro.
- As medidas antigas de braço são mantidas separadamente; ao editar um registro antigo, seus campos genéricos continuam editáveis.
- Nenhuma nova tabela ou armazenamento pessoal externo foi adicionado. A exclusão de conta existente continua abrangendo catálogo, medidas, sessões, perfil e demais tabelas.
- A distribuição da TopBar foi ajustada apenas em telas estreitas para acomodar avatar, badge, logo/cronômetro e seção sem sobreposição. Altura, cores, badge e comportamento dos feedbacks preservados.

## Testes executados

- Linha de base anterior: **132 testes aprovados**.
- Suíte final `npm test`: **141 testes aprovados**, zero falhas.
- `npm run build`: aprovado; TypeScript e build PWA, sem novas dependências.
- `git diff --check`: aprovado.
- Novas regressões em `tests/etapa15.test.mjs`: calendário, datas civis/múltiplas sessões, medidas novas/legadas, backup v5 e leitura v1–v4, dados ausentes nos gráficos, seletor por grupo, cores, geometria de recorte e validação compartilhada da finalização.
- `tests/etapa15-integracao.html` e `.ts`: execução em **127.0.0.1:5198**, origem isolada com dados fictícios e IndexedDB real. Inclui abertura de banco antigo v5 em v6; cores validadas no salvamento; proteção dos exercícios oficiais; edição/arquivamento sem alteração de snapshots; restauração dos novos campos; falha injetada com rollback transacional; finalização pela TopBar a partir do Perfil e confirmação repetida; cancelamento e confirmação do recorte; persistência do avatar; backup da foto recortada; filtro/limpeza do calendário; interação com pontos e busca sem resultados.
- Verificação de ausência de rolagem horizontal nas cinco abas e nas duas subáreas de Evolução, em **320, 375, 390, 430, 768 e 1280 px**.
- Inspeção visual direta em viewport móvel: TopBar, calendário, gráfico/seletor, edição do perfil e recorte. Seleção de ponto, navegação entre meses, filtro por dia e cancelamento/salvamento da foto exercitados pela interface.

## Arquivos

- Componentes novos: `GerenciarExercicios.vue`, `CalendarioHistorico.vue`, `RecortarFoto.vue`.
- Fluxo compartilhado: `useFinalizarTreino.ts` e `exerciciosPersonalizados.ts`.
- Utilitários novos: `calendarioHistorico.ts`, `coresTreino.ts`, `graficos.ts`, `recorteFoto.ts`, `seletorDesempenho.ts`.
- Integrações nas views Fichas/Histórico, componentes de Evolução/Perfil/Treino, TopBar, stores de ficha/treino, tipos do banco, catálogo/substituições, validação de medidas e backup.
- Testes anteriores ajustados para a versão 5 do backup e novas suítes/regressões da Etapa 15.
- Versão atualizada em `package.json` e `package-lock.json`.

## Limitações e dispositivos físicos

Os testes no navegador usam Chromium desktop com larguras móveis. Gestos em tela física, câmera, orientação EXIF de diferentes fabricantes e instalação/atualização da PWA em Android/iOS precisam de conferência em aparelhos reais. Não foram declarados como testados em dispositivos físicos. A animação do Gy Prime, sequência adaptativa, programação deslocada e cálculos de desempenho não foram alterados.

## Publicação

- Commit de implementação: `e8956cd` — Implementa melhorias de usabilidade da etapa 15.
- Push para `origin/main` concluído, sem push forçado.
- Deploy aprovado: https://github.com/edinaldoGit/gy/actions/runs/43578177418.
- Aplicativo publicado: https://edinaldogit.github.io/gy/.
- Versão **0.2.0** confirmada no Perfil após a ativação normal da atualização do service worker.
- Página principal, `manifest.webmanifest`, `sw.js`, JavaScript principal, módulo do banco, Pinia e CSS responderam HTTP 200. Manifest mantém `start_url: ./` e o escopo do Gy.
- Recursos novos continuam incluídos no precache gerado pelo build PWA. Não foi executada uma sessão física offline em Android/iOS.

### Relação completa de arquivos da implementação


- `docs/etapa15-aprimoramentos-usabilidade.md`
- `package-lock.json`
- `package.json`
- `src/components/evolucao/EvolucaoLinha.vue`
- `src/components/fichas/GerenciarExercicios.vue`
- `src/components/fichas/TreinoWizardInfo.vue`
- `src/components/historico/CalendarioHistorico.vue`
- `src/components/historico/EvolucaoDesempenho.vue`
- `src/components/layout/TopBar.vue`
- `src/components/perfil/EditarPerfil.vue`
- `src/components/perfil/EvolucaoCorporal.vue`
- `src/components/perfil/RecortarFoto.vue`
- `src/components/treino/TreinoExecucao.vue`
- `src/composables/useFinalizarTreino.ts`
- `src/database/db.ts`
- `src/services/backup.ts`
- `src/services/exerciciosPersonalizados.ts`
- `src/services/substituicoes.ts`
- `src/stores/fichaStore.ts`
- `src/stores/treinoStore.ts`
- `src/utils/calendarioHistorico.ts`
- `src/utils/catalogo.ts`
- `src/utils/coresTreino.ts`
- `src/utils/evolucao.ts`
- `src/utils/exercicioSessao.ts`
- `src/utils/graficos.ts`
- `src/utils/recorteFoto.ts`
- `src/utils/seletorDesempenho.ts`
- `src/views/FichasView.vue`
- `src/views/HistoricoView.vue`
- `tests/backup.test.mjs`
- `tests/etapa15-integracao.html`
- `tests/etapa15-integracao.ts`
- `tests/etapa15.test.mjs`
- `tests/exerciciosInteligentes.test.mjs`
