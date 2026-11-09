# Etapa 09 — Backup e restauração

## Contrato `gy-backup` v1

O arquivo JSON contém `formato`, `versao`, `criadoEm`, `schemaOrigem` e `tabelas`. A versão do contrato é independente da versão do IndexedDB. A versão inicial exporta o schema 4 e só aceita o formato v1. Datas persistidas são convertidas para ISO 8601 em campos de data conhecidos e reconstruídas como `Date`; outras strings não são interpretadas como datas.

As sete tabelas incluídas são `perfil`, `catalogo`, `fichas`, `treinos`, `configuracoes`, `programacoes` e `historico`. Isso abrange fotos em data URL, exercícios personalizados, origem de fichas, ficha ativa, exercícios planejados, sessões em todos os estados, séries, snapshots históricos, datas locais e informações de fuso usadas pela sequência. Cache da PWA, arquivos da aplicação e estado de runtime das stores Pinia ficam fora do arquivo.

## Exportação e validação

O app primeiro aguarda a persistência imediata da sessão em andamento. Em seguida, lê as sete tabelas numa única transação Dexie somente de leitura e serializa o snapshot já obtido. O arquivo tem limite de 50 MB.

A validação ocorre antes de mostrar a prévia e antes de abrir uma transação de escrita. Ela verifica formato e versão, campos reconhecidos, tipos, limites, IDs únicos, datas, estados, dias semanais, tabelas, exercícios referenciados pelo catálogo, treinos ligados a fichas e ficha ativa. Campos novos não reconhecidos são rejeitados para evitar uma restauração incompleta silenciosa. A prévia resume perfil, fichas, treinos, exercícios, sessões, sessão ativa e programações.

O download usa um nome `gy-backup-AAAA-MM-DD.json` baseado na data local. A interface informa que o arquivo foi preparado para download; o navegador não confirma se a pessoa o guardou.

## Restauração, autosave e abas

O usuário confere a prévia, pode exportar uma cópia do estado atual e confirma a substituição no diálogo personalizado. A substituição limpa e grava as sete tabelas numa única transação Dexie de leitura e escrita. O rollback de IndexedDB mantém os registros anteriores se qualquer operação falhar. IDs e relações são mantidos. Repetir o mesmo arquivo substitui pelos mesmos registros, sem duplicar.

Antes de permitir a confirmação, a aba atual e as outras abas Gy identificadas pelo canal `BroadcastChannel` flusham o autosave da sessão e suspendem novas gravações. As rotas de escrita do app compartilham um Web Lock; a restauração adquire o lock exclusivo e espera gravações já iniciadas terminarem antes de abrir a transação. A interface das demais abas fica inerte durante a operação. Outro Web Lock serializa duas restaurações simultâneas; um marcador temporário em `localStorage` também bloqueia uma nova restauração e páginas abertas durante o processo. Após o commit, as outras abas recarregam e a aba atual mostra o feedback de sucesso antes de recarregar. Ao cancelar, as abas retomam normalmente.

A persistência gerenciada pelo Gy está toda no IndexedDB; a foto é armazenada junto do perfil como texto local. A atomicidade cobre essas sete tabelas do IndexedDB. O arquivo de backup não é criptografado. A sequência é recalculada pelo serviço existente a partir dos mesmos registros restaurados; nenhum contador novo é criado e regras da sequência não foram alteradas.

## Limitações e transferência

Registros anteriores à Etapa 08 que não possuam data civil ou fuso congelados mantêm a informação que já existia; o backup não pode reconstruir metadados que nunca foram armazenados. No navegador sem `BroadcastChannel`, o marcador local impede restaurações simultâneas, mas a detecção de outra aba aberta não é garantida; feche outras abas Gy antes de restaurar nesses ambientes. Abas abertas em dispositivos diferentes não compartilham o mesmo IndexedDB nem são coordenadas.

Para transferir dados, abra **Perfil → Dados e backup → Exportar meus dados** no aparelho de origem e transfira o JSON por um meio escolhido pela pessoa. No outro aparelho, use **Já tenho um backup para restaurar** no cadastro inicial ou abra Perfil, selecione o arquivo, confira a prévia, exporte os dados atuais se quiser guardá-los e confirme a substituição. Se o backup não tiver perfil, após restaurar o app seguirá as regras existentes e abrirá o cadastro inicial. A recuperação funciona sem conexão com a internet. O arquivo inclui dados pessoais e deve ser mantido em local seguro.

## Arquivos e verificações da Etapa 09

Serviço/contrato: `src/services/backup.ts`. Coordenação entre abas: `src/services/backupCoordinator.ts` e `src/database/writeLock.ts`. Interface Perfil: `src/components/perfil/BackupDados.vue`, `src/views/PerfilView.vue`, `src/components/onboarding/OnboardingForm.vue` e `src/views/OnboardingView.vue`. Integrações de gravação/autosave: `src/App.vue`, `src/database/seed.ts`, `src/router/index.ts`, `src/services/sequencia.ts`, `src/stores/fichaStore.ts`, `src/stores/onboardingStore.ts`, `src/stores/treinoStore.ts` e `src/utils/fichaCompartilhamento.ts`. Testes: `tests/backup.test.mjs`.

Verificações executadas: `npm run build` aprovado; `npm test` aprovado com 57 testes; `git diff --check` sem apontamentos. Os testes do novo serviço usam um adaptador de banco isolado em memória e dados fictícios; validam estrutura, relacionamentos, serialização de datas, foto, repetição de restauração, rollback do adaptador e equivalência do resultado da sequência. Os testes existentes de importação de fichas e sequência também passaram.

O navegador local não estava disponível: a tentativa de iniciar o servidor de desenvolvimento foi recusada pelo ambiente com `EPERM` ao abrir a porta local. Por isso, não foi feita inspeção visual, restauração real por IndexedDB no navegador nem teste de rede offline. Nenhum dado pessoal de desenvolvimento foi alterado durante os testes.
