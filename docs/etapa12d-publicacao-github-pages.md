# Etapa 12D — Publicação do Gy no GitHub Pages

## Estado da publicação

O workflow `.github/workflows/deploy.yml` está na branch `main` e executa em pushes para `main` ou por acionamento manual. O job só publica quando a referência é `main`; pull requests e outras branches não disparam publicação automática e uma execução manual em outra branch é ignorada.

A primeira tentativa do commit `5bf488c95b4610416acd9534fe33580bf4cdaf44` passou por instalação, testes, build e rotas, mas falhou em **Configure GitHub Pages**. Na conferência da Etapa 13, a [mesma execução, reexecutada](https://github.com/edinaldoGit/gy/actions/runs/42573039572), já estava concluída com sucesso, e `https://edinaldogit.github.io/gy/` respondeu HTTP 200. O bloqueio anterior foi resolvido no repositório; a configuração remota não foi alterada pela Etapa 13.

A conexão GitHub gerenciada continua com `push: false` e `admin: false`, e a CLI `gh` não está instalada. Isso descreve essa conexão, não necessariamente outras credenciais legítimas do Git local. A consulta anônima à API de configuração Pages retorna 404 e não serve, isoladamente, para afirmar que o site não existe: a URL pública e o resultado do deploy confirmam a publicação anterior.

## O que o workflow faz

O workflow usa as ações oficiais `actions/checkout`, `actions/setup-node`, `actions/configure-pages`, `actions/upload-pages-artifact` e `actions/deploy-pages`. Configura Node.js 22, instala exatamente o lockfile com `npm ci`, executa `npm test` e `npm run build`, prepara os pontos de entrada das rotas, envia `dist` como artefato e publica no ambiente `github-pages`.

Qualquer falha de instalação, teste, build ou preparação interrompe o job antes do upload e do deploy. O workflow limita as permissões a `contents: read`, `pages: write` e `id-token: write`, e mantém apenas uma publicação ativa no grupo `github-pages`.

## Caminhos e rotas

O build de produção continua usando `base: '/gy/'`; o servidor de desenvolvimento continua usando `/`. O manifest conserva URLs relativas para `id`, `start_url` e `scope`, o Vue Router usa `import.meta.env.BASE_URL`, e os recursos do HTML usam `%BASE_URL%`.

Como o GitHub Pages não oferece fallback de SPA para rotas diretas, `scripts/prepare-github-pages.mjs` copia o `dist/index.html` para entradas estáticas de `/onboarding`, `/fichas`, `/historico` e `/perfil`. Assim, abrir ou recarregar `/gy/fichas/` entrega o mesmo app e o Vue Router restaura a tela. Os assets continuam apontando para `/gy/`; não se adiciona `/gy/` às rotas. A lista dessas entradas precisa acompanhar qualquer nova rota de primeiro nível.

O service worker permanece sob o escopo `/gy/`. O Workbox mantém o fallback de navegação para o `index.html` principal e precacheia os arquivos estáticos do build. As cópias de entrada por rota não contêm dados pessoais; perfil, fichas, sessões e histórico continuam no IndexedDB do dispositivo. A publicação não limpa IndexedDB, `localStorage` ou caches do navegador.

## Acompanhar ou reexecutar a publicação

1. Abra **Actions → Build and deploy Gy to GitHub Pages** e confira a execução do commit desejado.
2. Para reexecutar, use **Re-run all jobs** ou **Run workflow** com a branch `main`.
3. Após a conclusão verde, verifique a URL pública, as entradas de rota, manifest e service worker.

Em um novo repositório, selecione **GitHub Actions** como fonte em **Settings → Pages → Build and deployment → Source** antes do primeiro deploy. Essa habilitação exige permissão apropriada. O workflow normal usa `GITHUB_TOKEN`, sem credencial de administração para habilitar automaticamente um site ausente.

## Publicações futuras e versão

Antes de uma publicação, incremente `version` em `package.json` e execute `npm ci`, `npm test` e `npm run build`. Revise e registre as alterações no Git; depois de enviá-las para `main`, o workflow publica o novo build. A versão exibida em Perfil vem dessa propriedade no momento do build.

Usuários instalados precisam de conexão para consultar uma publicação nova. O service worker identifica os recursos alterados, e o Gy apresenta a atualização com opção de adiar. A aplicação verifica se há sessão ativa, gravações críticas, edição de ficha ou operação de backup antes de atualizar. A atualização normal não requer reinstalação e mantém o IndexedDB.

Para corrigir uma publicação problemática, reverta o commit de código por uma alteração normal na branch `main` e publique a versão corrigida. O novo build terá uma versão própria; não apague o banco local nem peça que usuários reinstalem o aplicativo. Em caso de dúvida sobre os registros locais, oriente a exportação de backup antes de qualquer ação do usuário.

## Privacidade, instalação e limites

O Pages hospeda apenas os arquivos estáticos do Gy. Não envia perfil, treinos ou histórico ao GitHub, e não há sincronização automática entre aparelhos. Cada instalação mantém seu próprio armazenamento; limpar os dados do navegador pode removê-los. O backup do Gy é o mecanismo de transferência e recuperação.

Android e iOS continuam usando os fluxos de instalação preparados na Etapa 12C. O prompt de instalação depende do navegador no Android; no iOS, a adição à Tela de Início segue as opções disponíveis no navegador e na versão do sistema. Safe areas, instalação física, barra de status e atualização precisam ser conferidas em dispositivos reais.

## Validação desta etapa

Na preparação 12D, `npm ci`, `npm test` (101 testes), `npm run build`, preparo de `dist` e `git diff --check` passaram. O artefato local respondeu HTTP 200 para a raiz, as quatro rotas originais, o manifest e o service worker. A tentativa inicial do Actions foi interrompida na configuração de Pages. Sua reexecução terminou com sucesso, e a conferência posterior confirmou HTTP 200 na URL pública. As alterações e verificações da versão 0.1.0 são descritas em `docs/etapa13-evolucao-experiencia.md`.
