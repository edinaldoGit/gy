# Etapa 13 — Evolução da experiência

## Organização e identidade

A versão 0.1.0 acrescenta a rota `/evolucao`, com entradas para evolução corporal e de desempenho. Os componentes e cálculos anteriores são reaproveitados; Perfil e Histórico deixam de exibir esses acessos. As subseções usam `?area=corporal` e `?area=desempenho`, mantendo links e botão de voltar. O resumo consulta contagens reais e é atualizado ao retornar à página principal.

Evolução usa tokens `sage` próprios, com base `#3F795F`, fundos claros e variações escuras. Os gráficos também podem receber essa identidade. As quatro paletas anteriores permanecem preservadas. A TopBar mantém a composição e as transições, com cinco opções em grade e largura máxima no desktop. A entrada estática de `/gy/evolucao/` é gerada pelo preparo do GitHub Pages.

O estado congelado da sequência usa uma chama azul Lucide com um floco menor sobreposto. A sequência ativa continua com chama laranja. O rótulo acessível informa estado e número de dias; o cálculo não foi alterado para trocar o ícone.

## Área inferior da PWA

`theme-color` e a variável CSS `--gy-system-color` acompanham Treino (Amethyst), Fichas (Cerulean), Histórico (Teal), Evolução (Sage), Perfil e onboarding (Bubblegum). A raiz e uma área estrutural de `safe-area-inset-bottom` usam essa variável. O espaço protegido fica fora da área de conteúdo, evitando sobrepor controles ao indicador de gestos. Feedbacks visíveis acompanham a mesma cor; uma confirmação global retoma a cor da seção. Onboarding conserva Bubblegum mesmo com mensagens pausadas.

Isso cobre as regiões controláveis pelo Gy. Android/iOS podem escolher a aparência da barra e do indicador nativos. Não foi desenhada uma barra falsa; a cor física, o notch, o teclado e o modo instalado exigem teste em aparelhos reais. Em navegador desktop a safe area inferior geralmente é zero.

## Perfil e peso atual

O Perfil oferece edição compacta de nome, idade, altura, peso e foto. A idade continua sendo um inteiro em anos; não existe data de nascimento para criar uma segunda fonte de verdade. Altura permanece em centímetros. A foto aceita JPEG, PNG e WebP até 5 MB, é decodificada localmente, reduzida para até 640 px no maior lado e salva como JPEG. Existe seleção de arquivo, captura quando o dispositivo permitir, prévia, substituição e remoção. Cancelar descarta o rascunho da edição.

O peso mostrado no Perfil e usado no IMC vem da medição corporal mais recente que contém peso. Sem medição, usa o peso original do cadastro como fallback. Alterar o peso no Perfil cria ou atualiza somente o peso da medição do dia civil local, preservando as outras medidas dessa data. A interface explica essa regra antes de salvar. Alterações de outros campos não criam medições. O valor original de cadastro é mantido como fallback, não como outro peso atual independente.

`usePerfilAtual` observa o IndexedDB via `liveQuery`; Perfil e foto da TopBar reagem a gravações e restaurações. Perfil e medição são gravados na mesma transação, coordenada com o sistema de backup.

## Uma sessão concluída por dia

A criação e a finalização verificam o histórico dentro da transação de escrita. Um treino finalizado bloqueia novos inícios naquele dia, mesmo trocando treino, ficha, rota ou aba. Sessões canceladas não contam. Registros antigos permanecem intactos; conclusões legadas com data final também são consideradas.

O dia de conclusão registrado (`diaConclusaoLocal`) é a referência; na ausência desse campo, deriva-se da data final no calendário local. Uma sessão iniciada antes da meia-noite e encerrada depois pertence ao dia da conclusão. O dia seguinte libera novo início. Uma sessão em andamento é recuperada, em vez de criar outra em paralelo. A finalização é novamente validada para impedir uma segunda conclusão quando existem sessões antigas concorrentes.

A tela mostra “Treino concluído hoje”, acesso ao Histórico e orientação de descanso. A própria finalização atualiza o estado imediatamente; o Histórico observado também atualiza outras abas. Mudanças de dia são verificadas no retorno à tela e periodicamente. Uma conclusão remota encerra a execução local sem permitir que autosaves reabram o registro.

## Deslocamento de programação

A ação está em **Trocar treino do dia → Deslocar programação +1 dia**. Ela é diferente de escolher outro treino somente para a sessão atual. Uma confirmação personalizada apresenta cada data de origem e destino antes da gravação.

O deslocamento cria uma nova `ProgramacaoVigente` com motivo `deslocamento` e uma `agenda` de datas civis, com início, fim e itens contendo treino, nome e dia. Não muda os `diasDaSemana` da ficha. Treino do dia, próxima sessão e calendário da ficha ativa consultam essa agenda no intervalo afetado; fora dele, a rotina semanal original volta a valer. A grade da ficha sinaliza quando mostra a agenda efetiva.

No cenário segunda–sexta, faltar segunda e deslocar terça produz A na terça, B na quarta, C na quinta, D na sexta e E no sábado. A cadeia inclui a semana afetada e, quando necessário, atravessa o domingo até encontrar uma folga. Não sobrescreve o próximo ciclo. Uma rotina sem folga que exigiria uma cadeia infinita é recusada.

O ajuste de exatamente um dia pode recuperar a pendência de ontem. Havendo outras pendências anteriores a ontem na semana vigente, a ação explica que +1 ainda deixaria treinos no passado e é recusada; permanece disponível a escolha manual do treino de hoje. Nenhuma obrigação histórica é apagada para simular recuperação.

A prévia é recalculada dentro de uma transação e comparada antes de gravar. Sessão ativa, conclusão no dia, destino já concluído, treino removido ou mudança desde a prévia impedem a operação. Cliques simultâneos não duplicam o deslocamento. Um segundo deslocamento no mesmo dia é recusado; em outro dia, uma nova prévia pode mover apenas o que continua pendente.

Edição, exclusão ou troca da ficha ativa é impedida enquanto houver datas atuais/futuras da agenda deslocada ainda não concluídas. Isso evita perder compromissos pendentes. Fichas inativas permanecem intactas. Não existe desfazer: a confirmação informa esse limite, pois desfazer após mudança de data ou execução poderia reescrever obrigações consolidadas.

A sequência consulta a agenda efetiva para os compromissos futuros, mantendo as versões anteriores. A falta de segunda continua sendo falta mesmo que A seja executado na terça. Mudanças no próprio dia conservam a união de compromissos, como anteriormente; dias históricos não são reescritos.

## Primeira ficha

O primeiro cadastro local é ativado na mesma transação em que a ficha é persistida. O cadastro do programa ocorre antes dos seus treinos; os treinos salvos atualizam sua programação. O contador é lido dentro da transação, de forma que dois primeiros cadastros simultâneos não possam ativar duas fichas. Cadastros posteriores permanecem inativos. Se todas as fichas forem excluídas, um novo primeiro cadastro local volta a ser elegível.

Importações continuam inativas, inclusive quando a biblioteca está vazia. Falhas de gravação fazem rollback da ficha, configuração ativa e programação.

## Compartilhamento

O menu **Compartilhar ficha** reutiliza o documento `gy-training-program` v3. Quando `navigator.canShare({ files })` permite, o arquivo JSON é criado em memória e enviado diretamente a `navigator.share()` por interação do usuário. Cancelar a folha nativa não produz erro. Os aplicativos de destino são escolhidos pelo sistema; não há garantia de destino específico. Exportar arquivo continua disponível como alternativa.

Também é possível gerar um link contendo o documento comprimido com gzip e codificado em base64url no fragmento `#gy-ficha=v1.…`. Não existe backend, URL curta ou upload para armazenar a ficha. O fragmento não é enviado ao servidor HTTP. O endereço usa a base do build, inclusive `/gy/fichas/` em produção.

O link completo é limitado a 6.000 caracteres e a descompressão a 1 MB. Um conteúdo grande é recusado integralmente, sem truncar exercícios. Links corrompidos, versões e estruturas inválidas são rejeitados pela validação já existente. Se o navegador não oferece Compression/Decompression Streams, o arquivo é a alternativa. A etapa usa link como alternativa ao arquivo; não gera QR Code de alta densidade.

Ao receber, o Gy mostra ficha, treinos e exercícios e exige confirmação. A ficha ativa permanece preservada. O fluxo também funciona sem perfil cadastrado: o acesso temporário à biblioteca continua após a remoção do fragmento da barra de endereço; ao sair dessa seção, a proteção normal do cadastro é retomada. A prévia é transitória e uma recarga antes de confirmar exige reabrir o link.

O documento compartilhado exclui perfil, foto, medidas, sessões e cargas pessoais. A programação enviada é a rotina original da ficha, não a agenda pessoal deslocada; a agenda efetiva pertence ao backup pessoal.

## Banco e backup

Schema Dexie 6: as mesmas oito tabelas e os mesmos índices. A migração registra a evolução do formato opcional da programação sem recriar tabelas ou reescrever registros antigos. O campo `agenda` só existe nas novas versões de programação deslocada; sua ausência mantém a interpretação semanal anterior.

Backup `gy-backup` v4 inclui a agenda, valida datas, limite do intervalo, unicidade diária e referências aos treinos. Leitores v1, v2 e v3 continuam disponíveis. O backup pessoal preserva o fallback de peso do cadastro, medições e foto. A restauração continua transacional. Uma versão antiga do aplicativo pode precisar ser atualizada antes de ler um backup v4.

## Arquivos desta etapa

43 arquivos criados ou modificados:

- `docs/etapa12d-publicacao-github-pages.md`
- `docs/etapa13-evolucao-experiencia.md`
- `package-lock.json`
- `package.json`
- `scripts/prepare-github-pages.mjs`
- `src/App.vue`
- `src/components/evolucao/EvolucaoLinha.vue`
- `src/components/feedback/ConfirmDialog.vue`
- `src/components/fichas/FichaList.vue`
- `src/components/fichas/FichasCompartilhamento.vue`
- `src/components/historico/EvolucaoDesempenho.vue`
- `src/components/layout/TopBar.vue`
- `src/components/perfil/EditarPerfil.vue`
- `src/components/perfil/EvolucaoCorporal.vue`
- `src/components/treino/TreinoPreview.vue`
- `src/composables/usePerfilAtual.ts`
- `src/database/db.ts`
- `src/router/index.ts`
- `src/services/backup.ts`
- `src/services/deslocamento.ts`
- `src/services/fichaCompartilhamento.ts`
- `src/services/perfil.ts`
- `src/stores/fichaStore.ts`
- `src/stores/treinoStore.ts`
- `src/style.css`
- `src/theme/sectionThemes.ts`
- `src/utils/fichaLink.ts`
- `src/utils/limiteDiario.ts`
- `src/utils/programacaoEfetiva.ts`
- `src/utils/sequencia.ts`
- `src/views/EvolucaoView.vue`
- `src/views/FichasView.vue`
- `src/views/HistoricoView.vue`
- `src/views/OnboardingView.vue`
- `src/views/PerfilView.vue`
- `src/views/TreinoView.vue`
- `tests/backup.test.mjs`
- `tests/etapa13-integracao.html`
- `tests/etapa13-integracao.ts`
- `tests/etapa13-servicos.test.mjs`
- `tests/etapa13.test.mjs`
- `tests/exerciciosInteligentes.test.mjs`
- `tests/sessaoPersistencia.test.mjs`

## Verificações e publicação

A linha de base tinha 101 testes aprovados; a suíte ampliada possui 121 testes. Foram acrescentados testes de limites diários, meia-noite, conclusão em outra aba, deslocamentos, faltas preservadas, conflitos, compartilhamento, payloads grandes/corrompidos, cancelamento nativo, validação do Perfil e backup v4 com leitura v3.

O roteiro `tests/etapa13-integracao.html` executa somente em `127.0.0.1:5193`, com dados fictícios e reinicialização explícita do banco dessa origem. Verifica migração real 5→6, primeiros cadastros concorrentes, rollback de falha, inícios concorrentes, conclusão diária, terça–sábado, round-trip de backup, peso/foto e recebimento sem perfil. O roteiro não entra no artefato público de produção.

Foram verificadas pela interface a edição/cancelamento do Perfil, seleção e prévia de foto real de teste, persistência após recarga, geração/recebimento de link e confirmação de importação em origem sem perfil. Os dois gráficos foram conferidos na nova aba. Em duas abas reais, o segundo início recuperou a mesma sessão, a conclusão na primeira atualizou a outra para “Treino concluído hoje” e recarregar manteve zero botões de início. O alcance das cinco opções do menu foi medido em 320, 375, 390, 430, 768 e 1280 px. As cores de `theme-color` e da variável raiz foram conferidas nas cinco seções e no onboarding.

Instalação física Android/iOS, teclado virtual, captura pela câmera e cor nativa da área de gestos não são declarados como homologados por emulação de viewport. O compartilhamento nativo foi testado com capacidades simuladas; a folha e os destinos reais dependem do dispositivo. O teste A/B de duas versões públicas não exige uma versão experimental: deve ser feito numa atualização real seguinte com dados fictícios e sessão ativa, conferindo adiamento e preservação antes/depois.

A revisão final passou em `npm test` (121 testes), `npm run build` e dez jornadas com IndexedDB real. A produção local em `127.0.0.1:5195/gy/` serviu os 51 arquivos do artefato por HTTP 200. Depois de desligar o servidor, o service worker permitiu recarregar Perfil, abrir Evolução corporal, salvar uma medição, refletir o peso no Perfil e exportar/restaurar um backup v4 pela interface. Isso simula indisponibilidade da origem local, sem afirmar que a rede física do computador foi desligada.

A versão 0.1.0 mantém a atualização controlada da Etapa 12C. O commit de implementação `7419aff` foi enviado para `main`. O workflow [42728722066](https://github.com/edinaldoGit/gy/actions/runs/42728722066) concluiu testes, build e publicação com sucesso. A conferência pública em 09/11/2026 confirmou HTTP 200 na página principal, em Fichas, Histórico, Evolução e Perfil, no manifesto e no service worker; o JavaScript publicado contém a versão 0.1.0. Treino corresponde à rota principal `/gy/`, e não a `/gy/treino/`. Endereço publicado: https://edinaldogit.github.io/gy/. `git diff --check` também passou. Nenhuma pendência de publicação permanece; as limitações de homologação em dispositivos físicos estão descritas acima.
