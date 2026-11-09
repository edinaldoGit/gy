# Homologação do backup após Etapa 10

## Resumo

Auditoria do backup implementado na Etapa 09 e da integração adicionada na Etapa 10. **Versão atual do arquivo: `gy-backup` v2.** O schema Dexie continua na versão 4; não há tabela nova. O arquivo inclui sete tabelas: perfil, catálogo, fichas, treinos, configurações, programações e histórico.

A versão v2 é necessária para transportar as identidades canônicas e os snapshots do exercício planejado/executado e dos registros editados. Arquivos v1 continuam aceitos, desde que não contenham campos v2; testes rejeitam campos novos apresentados como v1.

## Correção aplicada

A validação v2 aceitava uma sessão que declarasse o ID canônico de um exercício oficial diferente do nome/grupo no snapshot. Como o histórico usa esse ID para procurar cargas, um arquivo inconsistente poderia atribuir o desempenho ao exercício errado. A validação agora verifica que identidade oficial de snapshots executados e planejados corresponde ao catálogo oficial estático, incluindo o vídeo quando informado. Também rejeita ID local zero em exercício realizado. Foram acrescentados testes de regressão.

Isso mantém snapshots históricos válidos quando o exercício já não existe no catálogo: a verificação canônica usa os descritores oficiais versionados no código e não obriga que sessões antigas referenciem uma linha atual.

## Ambiente e procedimento do teste real

- Aplicação executada em origem temporária `127.0.0.1:5186`; duas bases Dexie separadas, `GyHomologacaoInstalacaoA` e `GyHomologacaoInstalacaoB`, schema 4. Nenhum dado pessoal ou banco do usuário foi acessado.
- A origem A recebeu dados fictícios: 1 perfil com imagem embutida, catálogo oficial completo mais 1 exercício personalizado, 2 fichas, 3 treinos, ficha ativa, 2 programações históricas e 4 sessões (2 finalizadas, 1 cancelada, 1 em andamento).
- A exportação chamou `exportarBackup` sobre snapshot lido em transação real do IndexedDB. A restauração B usou `restaurarBackup` com adaptador que opera as tabelas reais em uma transação Dexie `rw`.
- Para atomicidade, B foi preenchida com um marcador original. Uma transação real limpou as tabelas e gravou perfil e catálogo do backup; uma falha controlada foi lançada dentro da transação. Após o abort, todas as sete tabelas foram relidas e comparadas com o estado original.
- A seguir, o serviço restaurou o backup duas vezes em B e as sete tabelas foram comparadas com A após normalização JSON das datas.

Este é um teste de integração real com IndexedDB/Dexie, porém executado por uma página temporária de homologação e adaptadores de teste. Não representa uso dos botões de exportar/restaurar da interface em duas instalações do navegador.

## Resultados

### APROVADO

- Exportação e validação do formato v2; versão, datas e sete tabelas preservadas.
- Ida e volta entre duas bases IndexedDB independentes. Perfil, imagem, 234 itens do catálogo, 2 fichas, 3 treinos, ficha ativa, 2 programações e 4 sessões comparados.
- Falha lançada depois de operações reais de escrita: transação abortada e as sete tabelas do destino permaneceram idênticas ao estado anterior.
- Duas restaurações consecutivas não duplicaram nem alteraram registros.
- Sessão concluída de Crucifixo Reto na Polia conservou o Peck Deck como planejado; séries e cargas continuaram no exercício executado.
- Consulta global encontrou a última sessão válida em outra ficha, com séries `[47,5; 50]`; sessão cancelada ignorada. Não houve transferência de carga ao Peck Deck.
- Sessão em andamento manteve identidade canônica, carga e flag de série ainda não concluída ao passar pelo restaurador de modelo.
- Catálogo restaurado continuou resolvendo sugestões estáticas do exercício oficial; identidade do exercício personalizado permaneceu igual.
- Resultado de `calcularSequencia` antes/depois idêntico com o mesmo instante de referência.
- Teste de compatibilidade v1/v2 e rejeição explícita de campos da v2 num documento declarado v1.
- Arquivos malformados, formato/versão errados, maiores que 50 MB, datas e URLs inválidas, relacionamentos de ficha/treino inválidos, IDs duplicados, campos desconhecidos/ausentes, identidade oficial incoerente e ID de exercício realizado inválido são cobertos pela suíte.
- Build de produção e suíte automatizada aprovados.
- Onboarding exibiu o acesso “Já tenho um backup para restaurar” e navegou à tela Perfil em uma origem fictícia vazia.

### NÃO EXECUTADO

- Selecionar o arquivo e completar a restauração pela interface do Perfil/onboarding. O navegador disponível não expôs o seletor de arquivos local para anexar o fixture durante esta homologação; a tela de prévia, a confirmação visual, o feedback, a recarga completa e a entrada subsequente no app não foram aprovados.
- Concorrência de duas abas em tempo real, duas restaurações simultâneas, nem gravações de sessão pendentes em outra aba durante exportação/restauração. A coordenação foi inspecionada no código; isso não é prova funcional. Exportação salva a sessão da store local antes do snapshot; não foi demonstrado que uma store aberta noutra aba tenha sincronizado alterações ainda não persistidas.
- Fluxo de sessão ativa restaurada continuando pela tela de execução; foi verificada a restauração do snapshot pelo modelo/utilitário, não pelo app completo após reload.
- Teste de rede desligada durante exportação/restauração, outros navegadores/dispositivos e responsividade dos modais do backup nos seis breakpoints.
- Exercício de todos os casos inválidos pela interface. A rejeição foi testada nas funções de leitura/validação antes de chamar o adaptador.

A versão v2 e o service worker apoiam a arquitetura offline-first, mas o caminho completo de backup sob modo avião permanece não homologado.

## Resultado automatizado

- `npm run build`: **APROVADO** — `vue-tsc`, bundle Vite e geração do service worker.
- `npm test`: **APROVADO** — 73 testes, zero falhas, incluindo regressões de identidade inválida.
- `git diff --check`: **APROVADO**.

Os testes unitários de falha do adaptador não foram usados como evidência de atomicidade real; a evidência de rollback está descrita separadamente acima.

## Arquivos alterados nesta homologação

- `src/services/backup.ts`: checagem de coerência do ID oficial com snapshot planejado/executado e validação de ID realizado positivo.
- `tests/exerciciosInteligentes.test.mjs`: rejeição de identidade canônica oficial incompatível no exercício planejado ou executado.
- `tests/backup.test.mjs`: IDs duplicados, referências quebradas de ficha/treino, ID realizado inválido e campos obrigatórios.

Nenhuma alteração no mecanismo de backup, versão do arquivo, curadoria, sequência, UI, onboarding ou TopBar além dessas validações foi necessária. Recomenda-se completar os cenários marcados NÃO EXECUTADO antes de declarar a homologação operacional integral.
