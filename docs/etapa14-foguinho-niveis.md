# Etapa 14 — níveis do Foguinho

## Objetivo

A sequência passou a ter progressão visual por consistência semanal. O nível é calculado a partir dos snapshots de programação e das sessões concluídas; não há um contador de conquistas paralelo salvo no banco.

## Níveis

| Nível | Cor | Critério |
| --- | --- | --- |
| Chama Polar | Azul-gelo `#54BDF2` | 0 ou 1 treino programado seguido na sequência inicial |
| Faísca | Laranja `#F89337` | 2 ou mais obrigações consecutivas concluídas antes de consolidar a primeira semana |
| Brasa Viva | Âmbar `#E5A523` | 1 semana completa válida |
| Labareda | Coral `#F35F52` | 2 semanas completas consecutivas |
| Fogaréu | Rosa-magenta `#D94C9D` | 3 semanas completas consecutivas |
| Gy Prime | Gradiente `#7946FF` → `#B456FF` → `#EFA5FF` | 4 semanas completas consecutivas |

Uma falta consolidada interrompe a sequência semanal. O progresso não concede níveis permanentes: cada trilha representa a sequência vigente.

## Semanas e contador

Os ciclos seguem a semana civil local, de segunda a domingo. A programação aplicável é reconstruída dia a dia a partir dos registros imutáveis em `programacoes`, respeitando a vigência local e as agendas efetivas de deslocamento. A conclusão usa `diaConclusaoLocal`, gravado com a sessão, e só vale quando o `treinoId` corresponde a uma obrigação do dia. Sessões extras, canceladas, em andamento ou de outro treino não pontuam; o limite existente de uma sessão concluída por dia permanece aplicado.

O ciclo só é consolidado depois do domingo local. Uma semana válida precisa ter pelo menos uma obrigação e todas as obrigações conhecidas concluídas. Uma falta só é registrada após o encerramento civil do dia obrigatório. Dias de descanso não contam como treino nem como falta.

O número no badge é a quantidade de obrigações válidas concluídas na semana atual, exibida junto ao total esperado pela programação efetiva. Reiniciar o contador na segunda-feira não reduz o nível semanal já conquistado. Semanas sem obrigações não concedem nível nem geram falta; não interrompem, por si só, o nível anterior.

## Primeira ativação e histórico antigo

Uma semana só pode ser considerada completa se houver cobertura da programação para todos os sete dias. Se a primeira vigência começar numa segunda-feira, essa semana pode ser avaliada. Se começar depois, o ciclo parcial não concede conquista; o primeiro ciclo elegível começa na segunda-feira seguinte. Dias anteriores ao primeiro snapshot não são presumidos como descanso, treino cumprido ou falta.

Instalações existentes aproveitam o histórico quando já possuem snapshots e sessões suficientes. Se não houver snapshot histórico de programação, o Gy cria o ponto inicial com a ficha que estiver ativa no primeiro carregamento; sessões antigas sem programação comprovável não geram conquistas retroativas. Registros sem identificação suficiente para relacionar a sessão à obrigação permanecem sem pontuação.

## Trocas, edições e deslocamentos

Trocas de ficha, edições e desativações criam novos snapshots com vigência local. Alterações não reescrevem as obrigações e faltas anteriores. Mudanças ocorridas no próprio dia preservam a obrigação já assumida naquele dia, em linha com o cálculo anterior da sequência.

O deslocamento substitui a agenda efetiva nos dias abrangidos e conserva cada treino em seu novo dia. A obrigação do dia original continua no histórico; se já venceu sem conclusão, a falta não pode ser apagada pelos treinos recuperados depois. A semana deslocada, portanto, não é marcada perfeita retroativamente.

## Persistência, backup e exclusão

O resultado semanal é derivado em tempo real de `programacoes` e `historico`, e recalculado ao abrir a aplicação, atualizar sessões/programações, voltar à aba ou cruzar a meia-noite local. Isso mantém uma única fonte de verdade entre abas e após recarregamento.

Não foi adicionado campo nem tabela; o schema Dexie continua na versão 6, sem migração. O formato de backup permanece na versão 4: os snapshots de programação e sessões já são exportados e restaurados, então o nível é recomposto com os mesmos registros. A exclusão integral da conta validada na Etapa 13.1 limpa essas tabelas pessoais; como o nível não é persistido separadamente, um novo perfil começa em Chama Polar.

## Badge e modal

O badge circular fica sobre o canto inferior direito do avatar na TopBar. Reúne a chama do nível e o contador atual, com fundo claro relacionado à cor do nível, borda branca e sombra discreta. O avatar e o badge abrem o mesmo modal sem propagação duplicada.

O modal “Seu foguinho” mostra nível, semanas completas, progresso real da semana, treinos e descansos por dia, próximo requisito ou manutenção do Gy Prime, trilha dos seis estados e uma explicação curta das regras. É um bottom sheet rolável em telas pequenas e um diálogo limitado em telas maiores; permanece abaixo da TopBar.

## Animação e acessibilidade

A chama usa uma silhueta SVG própria. A Chama Polar sobrepõe um pequeno floco à chama azul; os outros níveis compartilham a mesma forma e evoluem pela cor. Partículas e movimento suave aparecem somente quando o Gy Prime está em destaque no badge ou no cartão principal do modal. A trilha e a prévia do próximo nível mantêm o Prime estático.

As animações respeitam `prefers-reduced-motion`. Badge e avatar são botões com nomes acessíveis; o modal tem título e descrição, foco inicial, contenção de Tab, fechamento por Escape e retorno de foco ao acionador. Os dias incluem nome, data, situação e treino na descrição para leitor de tela, mesmo quando a etiqueta visual curta é truncada.

## Testes e limitações

`tests/foguinho.test.mjs` cobre início, Faísca, consolidação apenas depois do domingo, os quatro níveis semanais, semana parcial, quebra, cancelamentos, treinos extras, deslocamento, troca de ficha e mudança de fuso. `tests/foguinho-integracao.html` grava uma jornada fictícia no IndexedDB real e só executa em `127.0.0.1:5197`; ela foi usada para conferir quatro semanas válidas, o Prime, o ciclo atual e o modal na interface real. A suíte completa passou com 132 testes, e `npm run build` gerou a PWA com 48 recursos no precache.

O nível depende da qualidade dos snapshots históricos existentes. O sistema prefere deixar um ciclo antigo sem pontuação quando não há cobertura comprovável, em vez de inventar conclusão. A verificação visual local foi feita em 320, 375, 390, 430, 768 e 1280 px; nesses tamanhos o documento, a TopBar e os sete marcadores não excederam a largura disponível, e o modal manteve rolagem própria. O funcionamento sem rede não foi confirmado nesta execução porque a prévia de produção abriu sem montar a interface no navegador disponível; por isso a publicação permanece pendente até essa validação.

## Revisão dos modais

Na revisão dos modais, o `inert` aplicado ao `main` foi limitado aos diálogos montados fora dele; os modais internos deixam de herdar o bloqueio que impedia seus botões de fechar. O fundo dos modais agora usa uma camada visual compartilhada que alcança a área atrás das curvas da TopBar, acompanhando a altura real da barra sem alterar a posição dos painéis. O foco é transferido sem rolar o conteúdo, e o contêiner da aplicação não pode ser rolado durante a animação.

Foram conferidos na origem isolada os fechamentos do Foguinho, histórico, edição de perfil e compartilhamento de fichas, além de desistir da confirmação global sem excluir dados. O histórico foi aberto e fechado em 320, 375 e 390 px; Enter e Escape também foram conferidos. Os 132 testes e o build passaram novamente após os ajustes.

## Publicação

Versão preparada: `0.1.5`. O build, os testes, a integração IndexedDB e `git diff --check` passaram. O teste sem rede não foi concluído, então não houve commit, push ou publicação. O resultado do workflow e da URL publicada será registrado depois que a validação offline puder ser feita.
