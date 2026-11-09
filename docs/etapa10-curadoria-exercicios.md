# Etapa 10 — Exercícios inteligentes

## Cobertura e critérios

Catálogo oficial integral: **233 encontrados e analisados**, **186 com alternativas**, **47 sem alternativas**, **250 relações direcionais explícitas**. Curadoria versão 1. Os códigos da tabela correspondem ao identificador canônico `gy:oficial:<código>`, nunca à chave numérica local do IndexedDB.

Cada registro em `src/data/exerciseSubstitutions.ts` contém nome, grupo do seed, equipamento auditado, padrão de movimento, musculatura principal e secundária, natureza, nota e alternativas ordenadas. Não há geração de sugestões por grupo muscular em execução. Prioridades são ordinais, sem percentuais de equivalência.

Critérios: padrão articular e direção do movimento, musculatura principal, participação secundária, apoio, unilateralidade, pegada, amplitude e equipamento. Segunda passagem revisou relações com diferenças de suporte, posição do quadril, resistência e sustentação do corpo. Exercícios ambíguos ou sem alternativa próxima foram omitidos. Testes verificam integridade estrutural, não comprovam equivalência biomecânica.

Exemplos: Peck Deck (24) → crucifixo reto na polia (16), depois halteres (15); flexão declinada (14) → tradicional (12), sem criar automaticamente a direção inversa; mesa flexora (92) ↔ cadeira flexora (93), com ressalva da posição do quadril. Terra convencional (59) ↔ barra hexagonal (117) é classificado com diferenças relevantes, sem equivalência de carga.

## Limitações e revisão humana

A curadoria não foi validada por profissional de educação física e não é prescrição para dor, lesão ou limitação individual. Revisão profissional recomendada especialmente para terra 59/117, stiff e romeno, remadas altas, Arnold/desenvolvimento, trocas unilateral/bilateral e posição de ombro/quadril. O nome não informa amplitude, regulagem da máquina ou execução real.

Pullover 25/64, pulldowns 55–58, glúteos genéricos 107/108 e tríceps na máquina 182 ficaram sem sugestões por ambiguidade. Rotações 149–151, nórdica 118 e exercícios de estabilização sem contraparte próxima também não receberam correspondências artificiais. Todas as demais omissões e notas são rastreáveis na tabela abaixo.

O seed antigo inferia equipamento por palavras do nome e classificava, por exemplo, puxadas, leg press, extensora e flexora como peso corporal. A auditoria possui equipamento técnico separado; os descritores persistidos foram preservados para não quebrar reconhecimento de importações antigas. Puxadas 32–34 são polia; 57/58 continuam sem equipamento inferível com segurança. Há sobreposição de nomes entre passada/avanço, rosca direta/simultânea e stiff/romeno: identidades distintas foram mantidas. Vídeos são referências externas do catálogo, não evidência de validação de cada relação.

Referências gerais para distinguir movimentos, músculos e equipamentos: [NASM](https://www.nasm.org/workout-exercise-guidance) e [ACE Exercise Library](https://www.acefitness.org/resources/everyone/exercise-library/). Essas bibliotecas não aprovam este mapeamento específico.

## Arquitetura e arquivos

- `src/data/catalogoOficial.ts`: fonte dos 233 registros extraída do seed, com códigos originais preservados.
- `src/data/exerciseSubstitutions.ts`, `src/services/substituicoes.ts`: auditoria estática tipada e resolução por identidade canônica, prioridade e disponibilidade local.
- `src/utils/identidadeExercicio.ts`, `src/database/seed.ts`, `src/main.ts`: identidade oficial estável, personalizados com UUID e preenchimento de identidade sem trocar chaves locais; inicialização aguarda catálogo. Correspondência oficial exige descritor completo, não semelhança de nome.
- `src/database/db.ts`, `src/utils/exercicioSessao.ts`, `src/stores/treinoStore.ts`: snapshots planejado/executado, proteção contra sobrescrever registros, serialização e recuperação. Confirmação de séries dispara persistência imediata além do autosave existente.
- `src/utils/historicoExercicio.ts`, `src/services/historicoExercicio.ts`: execuções por identidade realmente executada; uma consulta indexada de sessões finalizadas, sem consultas a cada renderização. A função pura retorna a série temporal para uso futuro.
- `src/utils/catalogo.ts`, `src/stores/fichaStore.ts`: filtro compartilhado e UUID de novos personalizados.
- `src/components/treino/SubstituirExercicio.vue`, `TreinoExecucao.vue`: seletor, referência histórica e ajustes da sessão.
- `src/components/historico/HistoricoDetalhe.vue`: nome executado e informação do planejado.
- `src/services/backup.ts`: backup v2 preserva identidades e snapshots, leitura de v1 mantida.
- `src/utils/fichaCompartilhamento.ts`: compartilhamento v3 com identidade, compatível com leitura de v2. Exporta ficha original, sem substituições da sessão.
- `tests/exerciciosInteligentes.test.mjs`: 15 testes novos; ajustes de versão em testes existentes de backup e compartilhamento.

Não houve alteração de esquema do Dexie (versão 4), TopBar ou regras da sequência. As alterações locais anteriores da Etapa 09 foram preservadas.

Histórico considera apenas sessões finalizadas até o instante consultado e séries confirmadas com carga finita não negativa e repetições numéricas positivas. Dados ausentes não são inventados. Sessões canceladas/em andamento são excluídas. Snapshots antigos são exibidos mesmo sem catálogo; para agregação legada, exige correspondência segura com o registro local, senão usa identidade local isolada. Sem catálogo original, não é possível reconstruir identidade global de um snapshot antigo ambíguo. Sessões antigas sem marcador de edição bloqueiam substituição conservadoramente.

## Uso e integrações

Na execução, abrir o card e tocar **Substituir exercício**. Selecionar sugestão ou **Buscar outro exercício**; pesquisar nome e filtrar grupo. Ausência de curadoria apresenta estado vazio com busca manual. A ficha não é modificada. O substituto começa com carga zero e recupera somente seu próprio histórico; não há conversão entre equipamentos.

A seção **Última execução deste exercício** mostra data, treino, ficha e valores por série. **Usar últimas cargas e repetições** copia referências apenas para séries correspondentes, sem concluir nenhuma. Depois de editar valores ou confirmar séries, substituição, desfazer e reaplicar referência ficam bloqueados com explicação. Antes disso, **Voltar ao original** restaura o planejamento. Descanso continua ajustável na sessão.

No histórico aparece o exercício executado e **Substituiu: ...**. Backup v2 conserva ambos os snapshots e séries. A sequência segue contando a finalização normal da sessão, nunca a troca de exercício.

## Verificação

- `npm run build`: aprovado (TypeScript, Vite e geração do service worker). `npm test`: 72 aprovados, zero falhas. `git diff --check`: aprovado.
- Suíte: 72 testes, incluindo 15 novos, cobertura integral e impressão digital dos 233 descritores para detectar alterações futuras no seed; direção, destinos, prioridades, cargas separadas, dados parciais, recuperação, backup v1/v2 e compartilhamento v2/v3.
- Navegador com dados exclusivamente fictícios na origem isolada 127.0.0.1:5185: rollback real em transação IndexedDB com falha de escrita simulada; restauração repetida sem duplicar e sequência idêntica.
- Fluxo visual executado: substituição, desfazer, cargas zeradas, referência própria, bloqueio após edição, recarga com duas séries confirmadas, exercício sem sugestões, busca manual, finalização e histórico com nomes e cargas reais. Sequência passou de zero para um após finalizar a sessão fictícia.
- Seletor inspecionado em 320, 375, 390, 430, 768 e 1280 px. Em 320 px, ícone da TopBar preexistente fica parcialmente cortado; não alterado por estar fora do escopo.
- Produção com servidor desligado: recarga da aplicação e abertura do histórico com substitutos e cargas aprovadas, usando o cache PWA e IndexedDB.
- Pendências: fluxo completo de nova substituição em modo avião real e navegadores/dispositivos Safari/iOS/Android não foram executados; cancelamento após substituição e falha de gravação da substituição não foram exercitados visualmente. Funções locais e build PWA mantêm a arquitetura offline, mas isso não substitui ensaio de rede desligada. Testes estruturais não validam biomecânica.

## Rastreabilidade integral

Destinos na ordem cadastrada. “—” significa sem sugestão. Metadados completos e justificativas por relação ficam no arquivo tipado.

| Código | Exercício | Grupo | Equipamento auditado | Movimento / natureza | Destinos | Nota |
|---|---|---|---|---|---|---|
| 1 | Supino Reto com Barra | Peito | Barra | empurrar horizontal / composto | 3 (equipamento), 2 (equipamento) | Pegada, estabilidade e execução unilateral podem diferir. |
| 2 | Supino Reto com Halteres | Peito | Halteres | empurrar horizontal / composto | 26 (proxima), 1 (equipamento) | Pegada, estabilidade e execução unilateral podem diferir. |
| 3 | Supino Reto no Smith | Peito | Smith | empurrar horizontal / composto | 1 (equipamento), 4 (equipamento) | Pegada, estabilidade e execução unilateral podem diferir. |
| 4 | Supino Reto na Máquina Articulada | Peito | Máquina | empurrar horizontal / composto | 3 (equipamento), 2 (equipamento) | Pegada, estabilidade e execução unilateral podem diferir. |
| 5 | Supino Inclinado com Barra | Peito | Barra | empurrar inclinado / composto | 7 (equipamento), 6 (equipamento) | — |
| 6 | Supino Inclinado com Halteres | Peito | Halteres | empurrar inclinado / composto | 5 (equipamento), 8 (equipamento) | — |
| 7 | Supino Inclinado no Smith | Peito | Smith | empurrar inclinado / composto | 5 (equipamento), 8 (equipamento) | — |
| 8 | Supino Inclinado na Máquina | Peito | Máquina | empurrar inclinado / composto | 7 (equipamento), 6 (equipamento) | — |
| 9 | Supino Declinado com Barra | Peito | Barra | empurrar declinado / composto | 11 (equipamento), 10 (equipamento) | — |
| 10 | Supino Declinado com Halteres | Peito | Halteres | empurrar declinado / composto | 9 (equipamento), 11 (equipamento) | — |
| 11 | Supino Declinado no Smith | Peito | Smith | empurrar declinado / composto | 9 (equipamento), 10 (equipamento) | — |
| 12 | Flexão de Braços Tradicional | Peito | Peso corporal/apoio | empurrar com peso corporal / composto | 13 (diferencas) | Altura do apoio muda a dificuldade e a direção do esforço. |
| 13 | Flexão de Braços Inclinada | Peito | Peso corporal/apoio | empurrar com peso corporal / composto | 12 (diferencas) | Altura do apoio muda a dificuldade e a direção do esforço. |
| 14 | Flexão de Braços Declinada | Peito | Peso corporal/apoio | empurrar com peso corporal / composto | 12 (diferencas) | Altura do apoio muda a dificuldade e a direção do esforço. |
| 15 | Crucifixo Reto com Halteres | Peito | Halteres | adução horizontal de ombro / isolador | 16 (equipamento), 24 (equipamento) | — |
| 16 | Crucifixo Reto na Polia | Peito | Polia | adução horizontal de ombro / isolador | 22 (proxima), 15 (equipamento) | — |
| 17 | Crucifixo Inclinado com Halteres | Peito | Halteres | adução ascendente de ombro / isolador | 18 (equipamento) | Polia baixa e banco inclinado não reproduzem a mesma curva de resistência. |
| 18 | Crucifixo Inclinado na Polia | Peito | Polia | adução ascendente de ombro / isolador | 17 (equipamento), 23 (diferencas) | Polia baixa e banco inclinado não reproduzem a mesma curva de resistência. |
| 19 | Crucifixo Declinado com Halteres | Peito | Halteres | adução descendente de ombro / isolador | 20 (equipamento) | — |
| 20 | Crucifixo Declinado na Polia | Peito | Polia | adução descendente de ombro / isolador | 19 (equipamento), 21 (diferencas) | — |
| 21 | Crossover na Polia Alta | Peito | Polia | adução descendente de ombro / isolador | 20 (diferencas) | — |
| 22 | Crossover na Polia Média | Peito | Polia | adução horizontal de ombro / isolador | 16 (proxima), 24 (equipamento) | — |
| 23 | Crossover na Polia Baixa | Peito | Polia | adução ascendente de ombro / isolador | 18 (diferencas) | Polia baixa e banco inclinado não reproduzem a mesma curva de resistência. |
| 24 | Voador Peitoral na Máquina (Peck Deck) | Peito | Máquina | adução horizontal de ombro / isolador | 16 (equipamento), 15 (equipamento) | — |
| 25 | Pullover com Halter | Peito | Halteres | extensão de ombro em pullover / isolador | — | Nome não define a técnica nem o desenho da máquina; sugestões omitidas. |
| 26 | Supino Reto com Halteres e Pegada Neutra | Peito | Halteres | empurrar horizontal / composto | 2 (proxima) | Pegada, estabilidade e execução unilateral podem diferir. |
| 27 | Supino Unilateral na Máquina | Peito | Máquina | empurrar horizontal / composto | 4 (diferencas) | Pegada, estabilidade e execução unilateral podem diferir. |
| 28 | Barra Fixa com Pegada Pronada | Costas | Peso corporal/apoio | puxar vertical / composto | 32 (diferencas), 30 (proxima) | Pegada, assistência e execução unilateral mudam a demanda. |
| 29 | Barra Fixa com Pegada Supinada | Costas | Peso corporal/apoio | puxar vertical / composto | 33 (diferencas) | Pegada, assistência e execução unilateral mudam a demanda. |
| 30 | Barra Fixa com Pegada Neutra | Costas | Peso corporal/apoio | puxar vertical / composto | 34 (diferencas) | Pegada, assistência e execução unilateral mudam a demanda. |
| 31 | Barra Fixa Assistida na Máquina | Costas | Máquina | puxar vertical / composto | 32 (diferencas) | Pegada, assistência e execução unilateral mudam a demanda. |
| 32 | Puxada Frontal com Pegada Pronada | Costas | Polia | puxar vertical / composto | 36 (equipamento), 28 (diferencas) | Pegada, assistência e execução unilateral mudam a demanda. |
| 33 | Puxada Frontal com Pegada Supinada | Costas | Polia | puxar vertical / composto | 29 (diferencas) | Pegada, assistência e execução unilateral mudam a demanda. |
| 34 | Puxada Frontal com Triângulo | Costas | Polia | puxar vertical / composto | 30 (diferencas) | Pegada, assistência e execução unilateral mudam a demanda. |
| 35 | Puxada Frontal Unilateral na Polia | Costas | Polia | puxar vertical / composto | 36 (diferencas) | Pegada, assistência e execução unilateral mudam a demanda. |
| 36 | Puxada Frontal na Máquina Articulada | Costas | Máquina | puxar vertical / composto | 32 (equipamento) | Pegada, assistência e execução unilateral mudam a demanda. |
| 37 | Remada Curvada com Barra e Pegada Pronada | Costas | Barra | remar sem apoio de tronco / composto | 40 (equipamento), 63 (diferencas) | — |
| 38 | Remada Curvada com Barra e Pegada Supinada | Costas | Barra | remar sem apoio de tronco / composto | 41 (equipamento) | — |
| 39 | Remada Cavalinho com Barra | Costas | Barra | remar horizontal / composto | 61 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 40 | Remada Curvada com Halteres e Pegada Pronada | Costas | Halteres | remar sem apoio de tronco / composto | 37 (equipamento), 62 (diferencas) | — |
| 41 | Remada Curvada com Halteres e Pegada Supinada | Costas | Halteres | remar sem apoio de tronco / composto | 38 (equipamento) | — |
| 42 | Remada Curvada com Halteres e Pegada Neutra | Costas | Halteres | remar sem apoio de tronco / composto | 54 (diferencas) | — |
| 43 | Remada na Máquina com Pegada Pronada | Costas | Máquina | remar horizontal / composto | 46 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 44 | Remada na Máquina com Pegada Supinada | Costas | Máquina | remar horizontal / composto | 47 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 45 | Remada na Máquina com Pegada Neutra | Costas | Máquina | remar horizontal / composto | 48 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 46 | Remada Baixa na Polia com Pegada Pronada | Costas | Polia | remar horizontal / composto | 43 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 47 | Remada Baixa na Polia com Pegada Supinada | Costas | Polia | remar horizontal / composto | 44 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 48 | Remada Baixa na Polia com Triângulo | Costas | Polia | remar horizontal / composto | 45 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 49 | Remada Unilateral na Polia com Pegada Pronada | Costas | Polia | remar horizontal / composto | 52 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 50 | Remada Unilateral na Polia com Pegada Supinada | Costas | Polia | remar horizontal / composto | 53 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 51 | Remada Unilateral na Polia com Pegada Neutra | Costas | Polia | remar horizontal / composto | 54 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 52 | Remada Unilateral com Halter e Pegada Pronada | Costas | Halteres | remar horizontal / composto | 49 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 53 | Remada Unilateral com Halter e Pegada Supinada | Costas | Halteres | remar horizontal / composto | 50 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 54 | Remada Unilateral com Halter e Pegada Neutra | Costas | Halteres | remar horizontal / composto | 51 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 55 | Pulldown com Barra Reta na Polia | Costas | Polia | extensão de ombro na polia / isolador | — | Pulldown entendido como braços quase estendidos; nome precisa de revisão humana. |
| 56 | Pulldown com Corda na Polia | Costas | Polia | extensão de ombro na polia / isolador | — | Pulldown entendido como braços quase estendidos; nome precisa de revisão humana. |
| 57 | Pulldown com Pegada Pronada | Costas | Não especificado com segurança | extensão de ombro na polia / isolador | — | Pulldown entendido como braços quase estendidos; nome precisa de revisão humana. |
| 58 | Pulldown com Pegada Supinada | Costas | Não especificado com segurança | extensão de ombro na polia / isolador | — | Pulldown entendido como braços quase estendidos; nome precisa de revisão humana. |
| 59 | Levantamento Terra Convencional com Barra | Costas | Barra | levantar do chão / composto | 117 (diferencas) | Posição dos pés/barra muda a distribuição de esforço e a técnica. |
| 60 | Remada Australiana com Peso Corporal | Costas | Peso corporal/apoio | remar horizontal / composto | — | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 61 | Remada Cavalinho na Máquina | Costas | Máquina | remar horizontal / composto | 39 (equipamento) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 62 | Remada com Halteres no Banco Inclinado | Costas | Halteres | remar horizontal / composto | 40 (diferencas) | Apoio do tronco, pegada e unilateralidade exigem ajuste da execução. |
| 63 | Remada Pendlay com Barra | Costas | Barra | remar sem apoio de tronco / composto | 37 (diferencas) | — |
| 64 | Pullover na Máquina | Costas | Máquina | extensão de ombro em pullover / isolador | — | Nome não define a técnica nem o desenho da máquina; sugestões omitidas. |
| 65 | Agachamento Livre com Barra | Pernas | Barra | agachar bilateral / composto | 67 (equipamento) | — |
| 66 | Agachamento com Halteres | Pernas | Halteres | agachar bilateral / composto | 71 (diferencas) | — |
| 67 | Agachamento no Smith | Pernas | Smith | agachar bilateral / composto | 65 (equipamento), 68 (diferencas) | — |
| 68 | Agachamento Hack na Máquina | Pernas | Hack | agachar bilateral / composto | 86 (diferencas) | — |
| 69 | Agachamento Frontal com Barra | Pernas | Barra | agachar bilateral / composto | 70 (equipamento) | — |
| 70 | Agachamento Frontal no Smith | Pernas | Smith | agachar bilateral / composto | 69 (equipamento) | — |
| 71 | Agachamento Goblet com Halter | Pernas | Halteres | agachar bilateral / composto | 66 (diferencas) | — |
| 72 | Agachamento Sumô com Barra | Pernas | Barra | agachar bilateral / composto | 73 (equipamento) | — |
| 73 | Agachamento Sumô no Smith | Pernas | Smith | agachar bilateral / composto | 72 (equipamento) | — |
| 74 | Agachamento Sumô no Hack | Pernas | Hack | agachar bilateral / composto | 89 (diferencas) | — |
| 75 | Agachamento Búlgaro com Halteres | Pernas | Halteres | agachar unilateral com pé traseiro elevado / composto | 77 (equipamento), 76 (equipamento) | — |
| 76 | Agachamento Búlgaro com Barra | Pernas | Barra | agachar unilateral com pé traseiro elevado / composto | 75 (equipamento), 77 (equipamento) | — |
| 77 | Agachamento Búlgaro no Smith | Pernas | Smith | agachar unilateral com pé traseiro elevado / composto | 75 (equipamento) | — |
| 78 | Passada com Barra | Pernas | Barra | passada com deslocamento / composto | 79 (equipamento) | Passada/avanço são nomes possivelmente sobrepostos; identidades mantidas separadas. |
| 79 | Passada com Halteres | Pernas | Halteres | passada com deslocamento / composto | 78 (equipamento) | Passada/avanço são nomes possivelmente sobrepostos; identidades mantidas separadas. |
| 80 | Afundo Estático com Barra | Pernas | Barra | afundo estático / composto | 82 (equipamento), 81 (equipamento) | — |
| 81 | Afundo Estático com Halteres | Pernas | Halteres | afundo estático / composto | 80 (equipamento) | — |
| 82 | Afundo Estático no Smith | Pernas | Smith | afundo estático / composto | 80 (equipamento) | — |
| 83 | Avanço com Barra | Pernas | Barra | avanço / composto | 84 (equipamento), 85 (equipamento) | Não unificar automaticamente com passada: nome não confirma deslocamento ou retorno. |
| 84 | Avanço com Halteres | Pernas | Halteres | avanço / composto | 83 (equipamento) | Não unificar automaticamente com passada: nome não confirma deslocamento ou retorno. |
| 85 | Avanço no Smith | Pernas | Smith | avanço / composto | 83 (equipamento) | Não unificar automaticamente com passada: nome não confirma deslocamento ou retorno. |
| 86 | Leg Press 45 Graus | Pernas | Leg press | extensão de quadril e joelho em leg press / composto | 87 (proxima) | — |
| 87 | Leg Press Horizontal | Pernas | Leg press | extensão de quadril e joelho em leg press / composto | 86 (proxima) | — |
| 88 | Leg Press Unilateral | Pernas | Leg press | extensão de quadril e joelho em leg press / composto | 87 (diferencas) | — |
| 89 | Leg Press com Pés Afastados | Pernas | Leg press | extensão de quadril e joelho em leg press / composto | 74 (diferencas) | — |
| 90 | Cadeira Extensora Bilateral | Pernas | Máquina | extensão de joelho / isolador | 91 (diferencas) | Sissy exige controle e amplitude próprios; não equiparado à extensora. |
| 91 | Cadeira Extensora Unilateral | Pernas | Máquina | extensão de joelho / isolador | 90 (diferencas) | Sissy exige controle e amplitude próprios; não equiparado à extensora. |
| 92 | Mesa Flexora | Pernas | Máquina | flexão de joelho / isolador | 93 (diferencas) | Posição do quadril altera o comprimento muscular. Nórdica tem demanda excêntrica própria. |
| 93 | Cadeira Flexora | Pernas | Máquina | flexão de joelho / isolador | 92 (diferencas) | Posição do quadril altera o comprimento muscular. Nórdica tem demanda excêntrica própria. |
| 94 | Flexora em Pé na Máquina | Pernas | Máquina | flexão de joelho / isolador | 92 (diferencas) | Posição do quadril altera o comprimento muscular. Nórdica tem demanda excêntrica própria. |
| 95 | Stiff com Barra | Pernas | Barra | dobrar o quadril em stiff / composto | 96 (equipamento), 97 (equipamento) | Manter controle do quadril; stiff e romeno não foram unificados por nomenclatura. |
| 96 | Stiff com Halteres | Pernas | Halteres | dobrar o quadril em stiff / composto | 95 (equipamento) | Manter controle do quadril; stiff e romeno não foram unificados por nomenclatura. |
| 97 | Stiff no Smith | Pernas | Smith | dobrar o quadril em stiff / composto | 95 (equipamento) | Manter controle do quadril; stiff e romeno não foram unificados por nomenclatura. |
| 98 | Levantamento Terra Romeno com Barra | Pernas | Barra | dobrar o quadril em romeno / composto | 99 (equipamento) | — |
| 99 | Levantamento Terra Romeno com Halteres | Pernas | Halteres | dobrar o quadril em romeno / composto | 98 (equipamento) | — |
| 100 | Elevação Pélvica com Barra | Pernas | Barra | extensão de quadril com tronco apoiado / composto | 103 (equipamento), 102 (equipamento) | Ponte no chão tem amplitude diferente da elevação com banco. |
| 101 | Elevação Pélvica com Halter | Pernas | Halteres | extensão de quadril com tronco apoiado / composto | 104 (equipamento), 100 (equipamento) | Ponte no chão tem amplitude diferente da elevação com banco. |
| 102 | Elevação Pélvica na Máquina | Pernas | Máquina | extensão de quadril com tronco apoiado / composto | 103 (equipamento), 100 (equipamento) | Ponte no chão tem amplitude diferente da elevação com banco. |
| 103 | Elevação Pélvica no Smith | Pernas | Smith | extensão de quadril com tronco apoiado / composto | 100 (equipamento), 102 (equipamento) | Ponte no chão tem amplitude diferente da elevação com banco. |
| 104 | Elevação Pélvica com Anilha | Pernas | Anilha | extensão de quadril com tronco apoiado / composto | 101 (equipamento) | Ponte no chão tem amplitude diferente da elevação com banco. |
| 105 | Coice de Glúteos em Quatro Apoios com Joelho Flexionado | Pernas | Peso corporal/apoio | extensão de quadril com joelho flexionado / isolador | 110 (diferencas) | — |
| 106 | Coice de Glúteos em Quatro Apoios com Joelho Estendido | Pernas | Peso corporal/apoio | extensão de quadril com joelho estendido / isolador | 109 (diferencas) | — |
| 107 | Extensão de Quadril no Smith | Pernas | Smith | extensão de quadril em máquina / isolador | — | Descrição insuficiente da posição e do equipamento; sugestões omitidas. |
| 108 | Glúteos na Máquina | Pernas | Máquina | extensão de quadril em máquina / isolador | — | Descrição insuficiente da posição e do equipamento; sugestões omitidas. |
| 109 | Extensão de Quadril na Polia com Joelho Estendido | Pernas | Polia | extensão de quadril com joelho estendido / isolador | 106 (diferencas) | — |
| 110 | Extensão de Quadril na Polia com Joelho Flexionado | Pernas | Polia | extensão de quadril com joelho flexionado / isolador | 105 (diferencas) | — |
| 111 | Cadeira Abdutora | Pernas | Máquina | abdução de quadril / isolador | 113 (diferencas) | Em pé e sentado têm demandas distintas de estabilização. |
| 112 | Cadeira Adutora | Pernas | Máquina | adução de quadril / isolador | — | — |
| 113 | Abdução de Quadril na Polia | Pernas | Polia | abdução de quadril / isolador | 111 (diferencas) | Em pé e sentado têm demandas distintas de estabilização. |
| 114 | Agachamento com Peso Corporal | Pernas | Peso corporal/apoio | agachar bilateral / composto | — | — |
| 115 | Ponte de Glúteos no Solo | Pernas | Peso corporal/apoio | extensão de quadril com tronco apoiado / composto | — | Ponte no chão tem amplitude diferente da elevação com banco. |
| 116 | Levantamento Terra Sumô com Barra | Pernas | Barra | levantar do chão / composto | — | Posição dos pés/barra muda a distribuição de esforço e a técnica. |
| 117 | Levantamento Terra com Barra Hexagonal | Pernas | Barra | levantar do chão / composto | 59 (diferencas) | Posição dos pés/barra muda a distribuição de esforço e a técnica. |
| 118 | Flexão Nórdica de Posterior de Coxa | Pernas | Peso corporal/apoio | flexão de joelho / isolador | — | Posição do quadril altera o comprimento muscular. Nórdica tem demanda excêntrica própria. |
| 119 | Good Morning com Barra | Pernas | Barra | dobrar o quadril com barra nas costas / composto | — | Carga no tronco e controle próprios; sugestão omitida. |
| 120 | Agachamento Sissy | Pernas | Peso corporal/apoio | extensão de joelho / isolador | — | Sissy exige controle e amplitude próprios; não equiparado à extensora. |
| 121 | Subida no Banco com Halteres | Pernas | Halteres | subir em apoio / composto | — | — |
| 122 | Levantamento Terra Romeno Unilateral com Halter | Pernas | Halteres | dobrar o quadril em romeno / composto | — | — |
| 123 | Desenvolvimento com Halteres | Ombros | Halteres | empurrar vertical / composto | 127 (equipamento), 125 (equipamento) | Arnold inclui rotação e trajetória próprias. |
| 124 | Desenvolvimento Militar com Barra | Ombros | Barra | empurrar vertical / composto | 126 (diferencas) | Arnold inclui rotação e trajetória próprias. |
| 125 | Desenvolvimento Sentado com Barra | Ombros | Barra | empurrar vertical / composto | 126 (equipamento), 123 (equipamento) | Arnold inclui rotação e trajetória próprias. |
| 126 | Desenvolvimento no Smith | Ombros | Smith | empurrar vertical / composto | 125 (equipamento), 127 (equipamento) | Arnold inclui rotação e trajetória próprias. |
| 127 | Desenvolvimento na Máquina | Ombros | Máquina | empurrar vertical / composto | 126 (equipamento), 123 (equipamento) | Arnold inclui rotação e trajetória próprias. |
| 128 | Desenvolvimento Arnold com Halteres | Ombros | Halteres | empurrar vertical / composto | 123 (diferencas) | Arnold inclui rotação e trajetória próprias. |
| 129 | Elevação Lateral com Halteres | Ombros | Halteres | abdução de ombro / isolador | 130 (proxima), 134 (equipamento) | Apoio e posição do cabo alteram a resistência ao longo da amplitude. |
| 130 | Elevação Lateral Sentado com Halteres | Ombros | Halteres | abdução de ombro / isolador | 129 (proxima) | Apoio e posição do cabo alteram a resistência ao longo da amplitude. |
| 131 | Elevação Lateral Unilateral no Banco Inclinado | Ombros | Halter e banco inclinado | abdução de ombro / isolador | — | Apoio e posição do cabo alteram a resistência ao longo da amplitude. |
| 132 | Elevação Lateral na Polia com Cabo à Frente do Corpo | Ombros | Polia | abdução de ombro / isolador | 133 (diferencas), 134 (equipamento) | Apoio e posição do cabo alteram a resistência ao longo da amplitude. |
| 133 | Elevação Lateral na Polia com Cabo Atrás do Corpo | Ombros | Polia | abdução de ombro / isolador | 132 (diferencas) | Apoio e posição do cabo alteram a resistência ao longo da amplitude. |
| 134 | Elevação Lateral na Máquina | Ombros | Máquina | abdução de ombro / isolador | 129 (equipamento), 132 (equipamento) | Apoio e posição do cabo alteram a resistência ao longo da amplitude. |
| 135 | Elevação Frontal com Barra e Pegada Pronada | Ombros | Barra | flexão de ombro / isolador | 137 (equipamento) | — |
| 136 | Elevação Frontal com Barra e Pegada Supinada | Ombros | Barra | flexão de ombro / isolador | 139 (equipamento) | — |
| 137 | Elevação Frontal com Halteres e Pegada Pronada | Ombros | Halteres | flexão de ombro / isolador | 135 (equipamento) | — |
| 138 | Elevação Frontal com Halteres e Pegada Neutra | Ombros | Halteres | flexão de ombro / isolador | 143 (equipamento) | — |
| 139 | Elevação Frontal com Halteres e Pegada Supinada | Ombros | Halteres | flexão de ombro / isolador | 136 (equipamento) | — |
| 140 | Elevação Frontal Cruzada com Halteres | Ombros | Halteres | flexão de ombro / isolador | — | — |
| 141 | Elevação Frontal na Polia com Pegada Pronada | Ombros | Polia | flexão de ombro / isolador | 135 (equipamento) | — |
| 142 | Elevação Frontal na Polia com Pegada Supinada | Ombros | Polia | flexão de ombro / isolador | 136 (equipamento) | — |
| 143 | Elevação Frontal com Corda na Polia | Ombros | Polia | flexão de ombro / isolador | 138 (equipamento) | — |
| 144 | Elevação Frontal com Anilha | Ombros | Anilha | flexão de ombro / isolador | 137 (equipamento) | — |
| 145 | Crucifixo Inverso com Halteres | Ombros | Halteres | abdução horizontal de ombro / isolador | 147 (equipamento), 146 (equipamento) | — |
| 146 | Crucifixo Inverso na Polia | Ombros | Polia | abdução horizontal de ombro / isolador | 145 (equipamento), 147 (equipamento) | — |
| 147 | Crucifixo Inverso na Máquina | Ombros | Máquina | abdução horizontal de ombro / isolador | 145 (equipamento), 146 (equipamento) | — |
| 148 | Face Pull com Corda na Polia | Ombros | Polia | remada com rotação externa / composto | — | Não tratado como crucifixo inverso simples. |
| 149 | Rotação Externa de Ombros com Halter | Ombros | Halteres | rotação externa de ombro / isolador | — | Posição do corpo/úmero não especificada; sugestão omitida. |
| 150 | Rotação Externa de Ombros na Polia | Ombros | Polia | rotação externa de ombro / isolador | — | Posição do corpo/úmero não especificada; sugestão omitida. |
| 151 | Rotação Interna de Ombros na Polia | Ombros | Polia | rotação interna de ombro / isolador | — | — |
| 152 | Remada Alta com Barra | Ombros | Barra | remada alta / composto | 155 (equipamento), 154 (equipamento) | Amplitude e pegada devem respeitar a mobilidade e o conforto da pessoa. |
| 153 | Remada Alta com Halteres | Ombros | Halteres | remada alta / composto | 154 (equipamento) | Amplitude e pegada devem respeitar a mobilidade e o conforto da pessoa. |
| 154 | Remada Alta na Polia | Ombros | Polia | remada alta / composto | 152 (equipamento), 153 (equipamento) | Amplitude e pegada devem respeitar a mobilidade e o conforto da pessoa. |
| 155 | Remada Alta no Smith | Ombros | Smith | remada alta / composto | 152 (equipamento) | Amplitude e pegada devem respeitar a mobilidade e o conforto da pessoa. |
| 156 | Tríceps nas Paralelas | Tríceps | Peso corporal/apoio | mergulho / composto | — | Extensão do ombro e suporte corporal diferem; não equiparados entre si. |
| 157 | Tríceps no Banco (Mergulho) | Tríceps | Peso corporal/apoio | mergulho / composto | — | Extensão do ombro e suporte corporal diferem; não equiparados entre si. |
| 158 | Supino Fechado com Barra | Tríceps | Barra | empurrar horizontal com pegada fechada / composto | 159 (equipamento) | — |
| 159 | Supino Fechado no Smith | Tríceps | Smith | empurrar horizontal com pegada fechada / composto | 158 (equipamento) | — |
| 160 | Tríceps Testa com Barra e Pegada Pronada | Tríceps | Barra | extensão de cotovelo deitado / isolador | 162 (equipamento) | — |
| 161 | Tríceps Testa com Barra e Pegada Supinada | Tríceps | Barra | extensão de cotovelo deitado / isolador | — | — |
| 162 | Tríceps Testa com Halteres e Pegada Pronada | Tríceps | Halteres | extensão de cotovelo deitado / isolador | 160 (equipamento), 163 (proxima) | — |
| 163 | Tríceps Testa com Halteres e Pegada Neutra | Tríceps | Halteres | extensão de cotovelo deitado / isolador | 162 (proxima) | — |
| 164 | Tríceps Testa com Anilha | Tríceps | Anilha | extensão de cotovelo deitado / isolador | 163 (equipamento) | — |
| 165 | Tríceps na Polia com Barra Reta e Pegada Pronada | Tríceps | Polia | extensão de cotovelo com braço ao lado do tronco / isolador | 168 (proxima), 169 (diferencas) | — |
| 166 | Tríceps na Polia com Barra Reta e Pegada Supinada | Tríceps | Polia | extensão de cotovelo com braço ao lado do tronco / isolador | 170 (proxima) | — |
| 167 | Tríceps na Polia com Corda | Tríceps | Polia | extensão de cotovelo com braço ao lado do tronco / isolador | 168 (proxima), 165 (proxima) | — |
| 168 | Tríceps na Polia com Barra V | Tríceps | Polia | extensão de cotovelo com braço ao lado do tronco / isolador | 165 (proxima), 167 (proxima) | — |
| 169 | Tríceps Unilateral na Polia com Pegada Pronada | Tríceps | Polia | extensão de cotovelo com braço ao lado do tronco / isolador | 165 (diferencas) | — |
| 170 | Tríceps Unilateral na Polia com Pegada Supinada | Tríceps | Polia | extensão de cotovelo com braço ao lado do tronco / isolador | 166 (proxima) | — |
| 171 | Tríceps Francês Unilateral com Halter | Tríceps | Halteres | extensão de cotovelo acima da cabeça / isolador | 172 (diferencas) | Posição do ombro distingue estas opções dos pushdowns. |
| 172 | Tríceps Francês Bilateral com Halter | Tríceps | Halteres | extensão de cotovelo acima da cabeça / isolador | 174 (equipamento), 175 (diferencas) | Posição do ombro distingue estas opções dos pushdowns. |
| 173 | Tríceps Francês com Barra | Tríceps | Barra | extensão de cotovelo acima da cabeça / isolador | 176 (equipamento) | Posição do ombro distingue estas opções dos pushdowns. |
| 174 | Tríceps Francês com Anilha | Tríceps | Anilha | extensão de cotovelo acima da cabeça / isolador | 172 (equipamento) | Posição do ombro distingue estas opções dos pushdowns. |
| 175 | Tríceps Francês na Polia com Corda | Tríceps | Polia | extensão de cotovelo acima da cabeça / isolador | 176 (proxima), 172 (diferencas) | Posição do ombro distingue estas opções dos pushdowns. |
| 176 | Tríceps Francês na Polia com Barra | Tríceps | Polia | extensão de cotovelo acima da cabeça / isolador | 175 (proxima), 173 (equipamento) | Posição do ombro distingue estas opções dos pushdowns. |
| 177 | Tríceps Coice Unilateral com Halter | Tríceps | Halteres | extensão de cotovelo em coice / isolador | 179 (equipamento), 178 (diferencas) | — |
| 178 | Tríceps Coice Bilateral com Halteres | Tríceps | Halteres | extensão de cotovelo em coice / isolador | 177 (diferencas) | — |
| 179 | Tríceps Coice Unilateral na Polia | Tríceps | Polia | extensão de cotovelo em coice / isolador | 177 (equipamento) | — |
| 180 | Flexão de Braços com Pegada Fechada | Tríceps | Peso corporal/apoio | empurrar com pegada fechada e peso corporal / composto | 181 (diferencas) | — |
| 181 | Flexão Diamante | Tríceps | Peso corporal/apoio | empurrar com pegada fechada e peso corporal / composto | 180 (diferencas) | — |
| 182 | Tríceps na Máquina | Tríceps | Máquina | extensão de cotovelo em máquina / isolador | — | Nome não define a posição do ombro; sugestão omitida. |
| 183 | Rosca Direta com Barra Reta | Bíceps | Barra | flexão de cotovelo supinada / isolador | 184 (proxima), 185 (equipamento) | — |
| 184 | Rosca Direta com Barra W | Bíceps | Barra | flexão de cotovelo supinada / isolador | 183 (proxima), 185 (equipamento) | — |
| 185 | Rosca Direta com Halteres | Bíceps | Halteres | flexão de cotovelo supinada / isolador | 186 (equipamento), 183 (equipamento) | — |
| 186 | Rosca Direta na Polia | Bíceps | Polia | flexão de cotovelo supinada / isolador | 185 (equipamento) | — |
| 187 | Rosca Direta na Máquina | Bíceps | Máquina | flexão de cotovelo supinada / isolador | 186 (equipamento) | — |
| 188 | Rosca Martelo com Barra H | Bíceps | Barra | flexão de cotovelo neutra / isolador | 189 (equipamento) | — |
| 189 | Rosca Martelo com Halteres | Bíceps | Halteres | flexão de cotovelo neutra / isolador | 190 (equipamento), 188 (equipamento) | — |
| 190 | Rosca Martelo na Polia com Corda | Bíceps | Polia | flexão de cotovelo neutra / isolador | 189 (equipamento) | — |
| 191 | Rosca Alternada com Halteres | Bíceps | Halteres | flexão de cotovelo supinada / isolador | 193 (diferencas), 192 (equipamento) | — |
| 192 | Rosca Alternada na Polia | Bíceps | Polia | flexão de cotovelo supinada / isolador | 191 (equipamento) | — |
| 193 | Rosca Simultânea com Halteres | Bíceps | Halteres | flexão de cotovelo supinada / isolador | 185 (diferencas), 191 (diferencas) | — |
| 194 | Rosca Scott com Halter | Bíceps | Halteres | flexão de cotovelo com braço apoiado à frente / isolador | 196 (equipamento), 197 (equipamento) | — |
| 195 | Rosca Scott com Barra Reta | Bíceps | Barra | flexão de cotovelo com braço apoiado à frente / isolador | 196 (proxima) | — |
| 196 | Rosca Scott com Barra W | Bíceps | Barra | flexão de cotovelo com braço apoiado à frente / isolador | 195 (proxima), 194 (equipamento) | — |
| 197 | Rosca Scott na Máquina | Bíceps | Máquina | flexão de cotovelo com braço apoiado à frente / isolador | 196 (equipamento), 194 (equipamento) | — |
| 198 | Rosca Concentrada Unilateral com Halter | Bíceps | Halteres | flexão de cotovelo concentrada / isolador | 199 (diferencas) | — |
| 199 | Rosca Concentrada Bilateral com Halteres | Bíceps | Halteres | flexão de cotovelo concentrada / isolador | 198 (diferencas) | — |
| 200 | Rosca Concentrada Martelo com Halter | Bíceps | Halteres | flexão de cotovelo neutra / isolador | — | — |
| 201 | Rosca Inclinada com Halteres | Bíceps | Halteres | flexão de cotovelo com ombro estendido / isolador | 204 (diferencas) | — |
| 202 | Rosca Spider com Barra | Bíceps | Barra | flexão de cotovelo spider / isolador | — | Apoio do tronco e ombro diferem do Scott; sem sugestão direta. |
| 203 | Rosca 21 com Barra | Bíceps | Barra | flexão de cotovelo em amplitude parcial e completa / isolador | — | Método 21 não equivale a uma rosca em amplitude contínua. |
| 204 | Rosca Bayesiana na Polia | Bíceps | Polia | flexão de cotovelo com ombro estendido / isolador | 201 (diferencas) | — |
| 205 | Rosca Dupla na Polia Alta | Bíceps | Polia | flexão de cotovelo com ombros abduzidos / isolador | — | — |
| 206 | Elevação de Panturrilhas em Pé na Máquina | Panturrilha | Máquina | flexão plantar com joelho estendido / isolador | 207 (equipamento), 208 (equipamento) | — |
| 207 | Elevação de Panturrilhas em Pé no Smith | Panturrilha | Smith | flexão plantar com joelho estendido / isolador | 206 (equipamento) | — |
| 208 | Elevação de Panturrilhas em Pé no Hack | Panturrilha | Hack | flexão plantar com joelho estendido / isolador | 206 (equipamento) | — |
| 209 | Elevação de Panturrilhas em Pé com Barra | Panturrilha | Barra | flexão plantar com joelho estendido / isolador | 210 (equipamento) | — |
| 210 | Elevação de Panturrilhas em Pé com Halteres | Panturrilha | Halteres | flexão plantar com joelho estendido / isolador | 209 (equipamento) | — |
| 211 | Elevação de Panturrilhas Sentado na Máquina | Panturrilha | Máquina | flexão plantar com joelho flexionado / isolador | 212 (equipamento), 213 (equipamento) | — |
| 212 | Elevação de Panturrilhas Sentado no Smith | Panturrilha | Smith | flexão plantar com joelho flexionado / isolador | 211 (equipamento) | — |
| 213 | Elevação de Panturrilhas Sentado com Halter | Panturrilha | Halteres | flexão plantar com joelho flexionado / isolador | 211 (equipamento) | — |
| 214 | Elevação de Panturrilhas no Leg Press | Panturrilha | Leg press | flexão plantar com joelho estendido / isolador | 206 (diferencas) | — |
| 215 | Elevação de Panturrilhas Unilateral em Pé | Panturrilha | Peso corporal/apoio | flexão plantar com joelho estendido / isolador | — | — |
| 216 | Elevação de Panturrilhas no Degrau com Peso Corporal | Panturrilha | Peso corporal/apoio | flexão plantar com joelho estendido / isolador | — | — |
| 217 | Abdominal Supra | Abdômen | Peso corporal/apoio | flexão de tronco / isolador | 222 (equipamento), 223 (equipamento) | — |
| 218 | Abdominal Infra | Abdômen | Peso corporal/apoio | abdominal com descrição genérica / composto | — | Nome insuficiente para confirmar padrão e técnica; sugestões omitidas. |
| 219 | Abdominal Oblíquo | Abdômen | Peso corporal/apoio | abdominal com descrição genérica / composto | — | Nome insuficiente para confirmar padrão e técnica; sugestões omitidas. |
| 220 | Prancha Frontal | Abdômen | Peso corporal/apoio | anti-extensão do tronco / estabilizacao | — | Hollow exige alavancas e apoio diferentes da prancha. |
| 221 | Prancha Lateral | Abdômen | Peso corporal/apoio | anti-inclinação lateral / estabilizacao | — | — |
| 222 | Abdominal Crunch na Polia | Abdômen | Polia | flexão de tronco / isolador | 223 (equipamento), 217 (equipamento) | — |
| 223 | Abdominal na Máquina | Abdômen | Máquina | flexão de tronco / isolador | 222 (equipamento) | — |
| 224 | Abdominal Bicicleta | Abdômen | Peso corporal/apoio | flexão/rotação alternada do tronco / composto | — | — |
| 225 | Abdominal Canivete | Abdômen | Peso corporal/apoio | flexão simultânea de tronco e quadril / composto | — | — |
| 226 | Elevação de Joelhos na Barra Fixa | Abdômen | Peso corporal/apoio | flexão de quadril com controle pélvico / composto | — | Enrolamento da pelve diferencia ênfase abdominal; suspensão exige pegada. |
| 227 | Elevação de Pernas na Barra Fixa | Abdômen | Peso corporal/apoio | flexão de quadril com controle pélvico / composto | 226 (diferencas) | Enrolamento da pelve diferencia ênfase abdominal; suspensão exige pegada. |
| 228 | Elevação de Pernas Deitado | Abdômen | Peso corporal/apoio | flexão de quadril com controle pélvico / composto | — | Enrolamento da pelve diferencia ênfase abdominal; suspensão exige pegada. |
| 229 | Abdominal com Roda | Abdômen | Roda abdominal | anti-extensão com roda / estabilizacao | — | — |
| 230 | Prancha com Toque nos Ombros | Abdômen | Peso corporal/apoio | anti-rotação em prancha com toque / estabilizacao | — | — |
| 231 | Abdominal Russo com Halter | Abdômen | Halteres | rotação de tronco com carga / composto | — | — |
| 232 | Abdominal Hollow Body | Abdômen | Peso corporal/apoio | anti-extensão do tronco / estabilizacao | — | Hollow exige alavancas e apoio diferentes da prancha. |
| 233 | Vácuo Abdominal | Abdômen | Peso corporal/apoio | controle respiratório abdominal / estabilizacao | — | Não equivalente a flexão de tronco nem exercício de carga. |
