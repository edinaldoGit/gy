# Etapa 13.1 — exclusão integral dos dados locais

## Causa raiz

O botão antigo chamava `db.perfil.clear()`: removia somente o perfil, embora o próprio texto dissesse que fichas, treinos e histórico permaneceriam. A navegação para o onboarding escondia o problema; as demais tabelas continuavam disponíveis para o próximo cadastro.

## Correção

A exclusão agora exige confirmação explícita, descreve os dados que serão removidos e recomenda exportar um backup. A opção de cancelar mantém os dados. Após confirmar, o Gy coordena as outras abas com o mecanismo existente de restauração: cada aba bloqueia a interface, conclui e pausa os autosaves em andamento, e confirma que está pronta. A aba que iniciou a exclusão também pausa a sessão e adquire o bloqueio exclusivo de gravações antes de apagar.

Uma transação única do IndexedDB limpa perfil, fichas, treinos, configuração da ficha ativa, programação e seus deslocamentos, histórico de vigência, sessões finalizadas/canceladas/em andamento e medidas corporais. O catálogo é recomposto com o catálogo oficial empacotado no aplicativo, removendo exercícios personalizados sem apagar recursos locais. Um erro durante a transação causa rollback; o modal mostra o erro e permanece aberto, sem anunciar sucesso nem navegar para o onboarding.

Depois do commit da transação, são removidas as chaves temporárias `gy:` da `sessionStorage` e avançada a geração local `gy:geracao-dados`. Escritas iniciadas por stores antigas comparam sua geração de origem antes de gravar e são recusadas após a exclusão. As outras abas recebem a nova geração e o sinal `done`, limpam rascunhos e recarregam. A geração também invalida uma escrita atrasada mesmo quando ela tenta prosseguir depois de a exclusividade de gravação ser liberada. A aba iniciadora navega para o onboarding após a conclusão real.

## Inventário do que permanece

- Permanecem: catálogo oficial de exercícios e assets, service worker, cache offline, manifesto, fonte, ícones e configuração técnica.
- O catálogo personalizado do perfil anterior é removido.
- A única chave localStorage de interface identificada guarda a dispensa do guia de instalação, que não é pessoal e foi preservada. `gy:backup-restauracao` continua sendo administrada pelo coordenador e não é apagada indiscriminadamente.
- As chaves `gy:` temporárias da sessionStorage (incluindo o rascunho de sessão) são removidas. Armazenamento de outros projetos/origens não é tocado.
- Não foi necessário alterar o schema Dexie (permanece v6).

## Jornada e validação

A tela agora permite cancelar a confirmação e apresenta a opção destrutiva como “Apagar tudo”. Ao terminar, reinicia a página no `/onboarding`, zerando referências de Pinia, timers e assinaturas em memória. O próximo perfil começa sem ficha/histórico/cargas anteriores; a regra existente ativa a primeira ficha local.

- `npm test`: 122 testes aprovados, 0 falhas.
- `npm run build`: aprovado; PWA gerada com 49 itens no precache.
- `git diff --check`: aprovado.
- Harness `tests/exclusao-conta-integracao.html`, executado com IndexedDB real e somente em `127.0.0.1:5196`: 4/4 aprovações. Cobriu rollback por falha de gravação, escrita antiga enfileirada, exclusão de perfil/ficha/configuração/programação/sessões concluídas/canceladas/em andamento/medidas, preservação do catálogo oficial e de dados não Gy na sessionStorage, fechamento e reabertura do IndexedDB e cadastro de Perfil B sem retorno dos dados A.
- Fluxo de interface real em duas abas locais fictícias: confirmação personalizada, exclusão, retorno ao onboarding nas duas abas, novo cadastro e aviso “Primeira ficha criada e ativada!”.
- Nenhum dado pessoal do armazenamento normal do desenvolvedor foi usado nos testes; a origem isolada e dedicada foi `127.0.0.1:5196`.

## Limitações

A limpeza da sessionStorage é local a cada aba; as abas abertas participam do protocolo e limpam seus próprios rascunhos antes de recarregar. O mecanismo de geração bloqueia gravações atrasadas fora da coordenação. O armazenamento técnico de outros sites no mesmo host não é enumerado nem modificado.

## Publicação

A versão foi atualizada de 0.1.3 para 0.1.4. Commit, push, execução do workflow e URL pública serão registrados após as verificações finais desta entrega.
