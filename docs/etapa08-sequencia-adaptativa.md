# Etapa 08 — Sequência adaptativa de treinos

## Implementação e inspeção

O checkout local estava limpo no início da tarefa. A implementação reutiliza `configuracoes.fichaAtivaId`, os dias dos treinos (`diasDaSemana`) e os snapshots imutáveis de `programacoes`. As sessões usam `em_andamento`, `cancelado` e `finalizado`, com instantes `Date` em `dataInicio`/`dataFim`.

O valor fictício 3 foi substituído por um resultado derivado exclusivamente dos registros persistidos. Não há contador independente salvo. Nenhuma tabela ou índice novo foi necessário: os campos temporais opcionais cabem no modelo atual do IndexedDB, sem alterar a versão 4 nem reescrever snapshots existentes.

## Arquivos

Criados:

- `src/utils/diasLocais.ts`: dias civis, aritmética de calendário e contexto de fuso.
- `src/utils/sequencia.ts`: cálculo puro, resultados, marcos de feedback e relógio injetável.
- `src/services/sequencia.ts`: leitura consistente do IndexedDB, observação reativa e atualização temporal.
- `tests/sequencia.test.mjs`: testes determinísticos do domínio temporal.
- `docs/etapa08-sequencia-adaptativa.md`: este relatório.

Modificados:

- `src/database/db.ts`: contexto temporal opcional das vigências e conclusões.
- `src/utils/programacao.ts`: contexto local dos snapshots novos e proteção contra vigências que recuem após mudança de fuso.
- `src/stores/fichaStore.ts`: gravação atômica das edições e seus snapshots; reutilização da rotina de registro na ativação/desativação.
- `src/stores/treinoStore.ts`: captura da data civil da conclusão e feedback após a gravação real.
- `src/App.vue`: ciclo de vida do observador.
- `src/components/layout/TopBar.vue`: número real, floco/fogo e identificação acessível do estado.
- `vite.config.ts`: inclusão de imagens e demais recursos visuais no precache, após o teste offline revelar a logo ausente no cache anterior.

## Regras de cálculo

O cálculo percorre os dias civis abrangidos pelos snapshots. Para cada data, identifica a obrigação vigente e a existência de ao menos uma sessão válida finalizada. Retorna quantidade, desbloqueio, último dia programado concluído, dias programados, cumpridos, perdidos e data avaliada.

- 0 e 1: floco de neve, sequência congelada.
- 2 ou mais: fogo, sem limite artificial de contagem.
- Descanso: não aumenta nem quebra a sequência, independentemente de sua duração.
- Dia programado atual sem conclusão: permanece pendente; não quebra antecipadamente.
- Dia programado anterior sem conclusão: falta consolidada, reinicia a contagem em zero.
- Conclusão depois de uma falta: nova sequência em 1.
- Qualquer treino pode cumprir um dia programado, inclusive um substituto.
- Várias sessões no mesmo dia contam uma vez.
- Sessões extras no descanso permanecem no histórico, mas não aumentam a sequência.
- Estados em andamento, cancelado ou ausente não contam. Exige-se `finalizado`, `dataFim` válida e instante não futuro.

## Vigência histórica e política para o próprio dia

Cada snapshot contém a programação semanal, a referência e o nome da ficha, o instante da alteração e agora seu contexto civil. O fim da vigência é determinado pelos registros posteriores, sem atualizar ou duplicar os anteriores.

**Durante o mesmo dia, vale a união dos compromissos assumidos naquele dia.** A programação que entrou no dia e as alterações efetuadas nele podem acrescentar uma obrigação, mas não apagar uma obrigação já assumida. A última programação passa a valer integralmente nos dias seguintes.

Assim, remover o treino de quarta na própria quarta não transforma essa quarta retroativamente em descanso. Trocar para uma programação com treino hoje pode tornar hoje obrigatório. Qualquer conclusão válida nesse dia pode cumpri-lo. Essa política também se aplica à primeira ativação: nenhuma obrigação é atribuída a datas anteriores ao início registrado.

Ativar outra ficha não zera o resultado. Excluir a ficha remove suas entidades operacionais, mas preserva sessões e snapshots. A desativação registra uma programação vazia: cessam as obrigações futuras, preservando-se uma sequência válida já existente. Se não houver sequência válida, o estado é floco com zero.

Edições da ficha ativa e o respectivo snapshot são gravados na mesma transação. Uma falha não deve deixar a programação nova sem o registro histórico correspondente.

## Datas, meia-noite e fusos

A sessão pertence ao **dia local em que termina**, mesmo se começou antes da meia-noite. `dataFim`, `diaConclusaoLocal`, `fusoConclusao` e `offsetConclusaoMinutos` são capturados a partir do mesmo instante na finalização. Os snapshots novos guardam `diaLocalVigencia`, `fusoHorario` e `offsetMinutos`.

O offset segue `Date.getTimezoneOffset`: minutos de UTC menos a hora local. Os identificadores `YYYY-MM-DD` são validados como datas civis antes de serem ordenados. UTC é usado somente para avançar componentes do calendário, sem dividir milissegundos por 24 horas; a identificação de hoje usa a data local do dispositivo.

Uma troca de fuso não recalcula os dias já salvos a partir dos instantes UTC. Se uma viagem recuar a data civil, registros anteriores não são descartados como se fossem futuros, e novas vigências não são inseridas antes do último dia de vigência registrado. Um mesmo identificador de dia civil conta no máximo uma vez, inclusive se o dispositivo repetir essa data durante uma viagem.

Registros legados sem contexto civil usam a interpretação local disponível no dispositivo. Não é possível recuperar seu fuso original com certeza; não houve migração nem reescrita desses dados. Se houver ficha ativa e nenhum snapshot, registra-se o início no momento da abertura, sem inventar obrigações anteriores.

## Atualização e custo

O serviço observa os snapshots e a consulta indexada de sessões finalizadas com `Dexie.liveQuery`. As duas fontes são lidas em uma transação de leitura para evitar uma combinação inconsistente de versões. Não há consultas por renderização nem consultas recorrentes durante cada tick do cronômetro.

Os dados ficam em memória e o domínio é reavaliado perto da meia-noite local e em intervalos de até um minuto para acompanhar mudanças do relógio/fuso. O retorno de segundo plano, foco e restauração da página também disparam atualização e releitura. O serviço é iniciado e encerrado pelo ciclo de vida do aplicativo.

## TopBar e feedback

A geometria, altura, avatar, logo, cronômetro, cores de seção, menu e animações da TopBar foram mantidos. Apenas o indicador recebeu dados reais e os estados Lucide `Snowflake`/`Flame`. Ele permanece visível com zero e anuncia seu estado por uma identificação acessível. Não foram adicionados efeitos contínuos.

O serviço permanece ativo enquanto o feedback oculta os elementos normais da TopBar. Ao terminar a notificação, o mesmo indicador reaparece com o resultado atualizado. A fila e o cronômetro existentes não foram alterados.

Depois de uma conclusão persistida, emite-se o feedback habitual de sessão salva e, quando aplicável, a mensagem de primeiro dia ou desbloqueio no segundo. A comparação desconsidera a sessão recém-gravada para detectar o marco, sem depender da ordem de atualização do observador. Sessões repetidas no dia não geram um novo marco. Continuação e faltas não geram notificações adicionais.

## Verificações automatizadas

- `npm run build`: aprovado, incluindo TypeScript e geração do service worker.
- `npm test`: 50 testes aprovados, sendo 23 testes novos da sequência e 27 existentes.
- `git diff --check`: aprovado.

Os testes novos cobrem os cenários temporais A–V solicitados, agrupando casos relacionados: estados congelado/fogo, crescimento, descanso, faltas, hoje pendente, extras, deduplicação, estados inválidos, troca e edição, desativação/exclusão por snapshots, relógio controlado, reinício, conclusão atravessando meia-noite, diferenças UTC/local, mudanças de fuso, viagem recuando a data, mês/ano/bissexto/DST, registros futuros/inválidos, feedback independente e 401 dias sem limite artificial. Os testes anteriores continuam cobrindo compartilhamento, programação, histórico e feedback/confirmações.

## Verificações na interface

Foi utilizado exclusivamente o ambiente isolado `http://127.0.0.1:5184`, com perfil, ficha, treino, catálogo e sessões fictícios. Os dados de `http://localhost:5173` não foram modificados.

Executados no navegador:

- Floco com 0 na abertura e floco com 1 depois de iniciar, concluir séries e finalizar uma sessão real de teste.
- Restauração com 1 a partir de uma conclusão fictícia de ontem; finalização hoje elevou para fogo com 2.
- Feedback “Seu foguinho acendeu! Sequência de 2 treinos.” e retorno do indicador atualizado após as notificações.
- Recuperação de 2 depois de recarregar a página.
- Menu expansível e navegação para fichas/histórico.
- Edição dos dias pelo fluxo de três etapas, salvamento e preservação de 2.
- Exclusão apenas da ficha fictícia, com preservação das duas sessões e do resultado.
- Conferência visual nas larguras 320, 375, 390, 430, 768 e 1280 px.
- Versão de produção instalada no cache: desligamento do servidor local e recarga completa com histórico, fogo com 2 e logo disponíveis. O primeiro teste revelou a falta de precache da logo; a inclusão dos recursos visuais foi aplicada e a recarga sem servidor foi repetida com sucesso.

A validação offline simulou indisponibilidade do servidor da aplicação; não desligou fisicamente a conexão de rede do computador. A primeira instalação ainda exige carregamento prévio do aplicativo. Não foi simulada suspensão física de um aparelho nem esperada uma meia-noite real: esses comportamentos foram exercitados no domínio com relógio controlado e integrados aos eventos do navegador.

## Limitações e pendências

Em 320 px permanece o recorte pré-existente do lado direito da TopBar, perceptível na aba Histórico. Ele não foi redesenhado nesta tarefa. Em 375 px e nas demais larguras conferidas, o indicador compacto permaneceu legível.

O contexto original de fuso dos registros legados não pode ser reconstruído. O cálculo consulta as sessões finalizadas e snapshots locais; não há sincronização externa nem defesa contra adulteração manual do relógio ou do banco.

Nenhum commit ou push foi realizado. Backup, medidas corporais e gráficos ficaram fora desta etapa.
