# Etapa 12D — Publicação do Gy no GitHub Pages

## Estado da publicação

O workflow `.github/workflows/deploy.yml` está na branch `main` e executa em pushes para `main` ou por acionamento manual. O job só publica quando a referência é `main`; pull requests e outras branches não disparam publicação automática e uma execução manual em outra branch é ignorada.

A primeira execução, para o commit `5bf488c95b4610416acd9534fe33580bf4cdaf44`, passou por instalação, testes, build e preparação das rotas, mas falhou em **Configure GitHub Pages** porque ainda não existe um site Pages configurado para o repositório. A [execução do GitHub Actions](https://github.com/edinaldoGit/gy/actions/runs/42573039572) registrou `Not Found` nesse passo. A API pública de Pages retornou HTTP 404 e `https://edinaldogit.github.io/gy/` também retornou HTTP 404; portanto, o Gy ainda não está publicado.

A configuração remota não pôde ser aplicada nesta execução: a conexão GitHub disponível informa permissões `push: false` e `admin: false`. A CLI `gh` não está instalada. A criação do site Pages exige permissão de administração, manutenção ou gerenciamento das configurações do Pages, conforme a [documentação da API do GitHub](https://docs.github.com/en/rest/pages/pages#create-a-github-pages-site). O proprietário precisa selecionar **GitHub Actions** em **Settings → Pages → Build and deployment → Source**. Depois disso, o push existente em `main` pode ser republicado pelo botão **Re-run all jobs** na execução acima, ou acionando **Run workflow** na branch `main`.

## O que o workflow faz

O workflow usa as ações oficiais `actions/checkout`, `actions/setup-node`, `actions/configure-pages`, `actions/upload-pages-artifact` e `actions/deploy-pages`. Configura Node.js 22, instala exatamente o lockfile com `npm ci`, executa `npm test` e `npm run build`, prepara os pontos de entrada das rotas, envia `dist` como artefato e publica no ambiente `github-pages`.

Qualquer falha de instalação, teste, build ou preparação interrompe o job antes do upload e do deploy. O workflow limita as permissões a `contents: read`, `pages: write` e `id-token: write`, e mantém apenas uma publicação ativa no grupo `github-pages`.

## Caminhos e rotas

O build de produção continua usando `base: '/gy/'`; o servidor de desenvolvimento continua usando `/`. O manifest conserva URLs relativas para `id`, `start_url` e `scope`, o Vue Router usa `import.meta.env.BASE_URL`, e os recursos do HTML usam `%BASE_URL%`.

Como o GitHub Pages não oferece fallback de SPA para rotas diretas, `scripts/prepare-github-pages.mjs` copia o `dist/index.html` para entradas estáticas de `/onboarding`, `/fichas`, `/historico` e `/perfil`. Assim, abrir ou recarregar `/gy/fichas/` entrega o mesmo app e o Vue Router restaura a tela. Os assets continuam apontando para `/gy/`; não se adiciona `/gy/` às rotas. A lista dessas entradas precisa acompanhar qualquer nova rota de primeiro nível.

O service worker permanece sob o escopo `/gy/`. O Workbox mantém o fallback de navegação para o `index.html` principal e precacheia os arquivos estáticos do build. As cópias de entrada por rota não contêm dados pessoais; perfil, fichas, sessões e histórico continuam no IndexedDB do dispositivo. A publicação não limpa IndexedDB, `localStorage` ou caches do navegador.

## Primeira publicação

1. No GitHub, abra **Settings → Pages** e selecione **GitHub Actions** como fonte de publicação.
2. Na execução acima, use **Re-run all jobs**; alternativamente, abra **Actions → Build and deploy Gy to GitHub Pages** e escolha **Run workflow** com `main`.
3. Acompanhe testes, build e deploy. Após a conclusão verde, abra `https://edinaldogit.github.io/gy/` e valide carregamento, rotas `/onboarding/`, `/fichas/`, `/historico/` e `/perfil/`, manifest e service worker.

Se o workflow não aparecer, confirme que `.github/workflows/deploy.yml` foi enviado para `main` e que Actions está habilitado no repositório. Se o deploy falhar por configuração do Pages, selecione GitHub Actions como fonte e execute novamente. O workflow não configura as opções remotas do repositório automaticamente.

## Publicações futuras e versão

Antes de uma publicação, incremente `version` em `package.json` e execute `npm ci`, `npm test` e `npm run build`. Revise e registre as alterações no Git; depois de enviá-las para `main`, o workflow publica o novo build. A versão exibida em Perfil vem dessa propriedade no momento do build.

Usuários instalados precisam de conexão para consultar uma publicação nova. O service worker identifica os recursos alterados, e o Gy apresenta a atualização com opção de adiar. A aplicação verifica se há sessão ativa, gravações críticas, edição de ficha ou operação de backup antes de atualizar. A atualização normal não requer reinstalação e mantém o IndexedDB.

Para corrigir uma publicação problemática, reverta o commit de código por uma alteração normal na branch `main` e publique a versão corrigida. O novo build terá uma versão própria; não apague o banco local nem peça que usuários reinstalem o aplicativo. Em caso de dúvida sobre os registros locais, oriente a exportação de backup antes de qualquer ação do usuário.

## Privacidade, instalação e limites

O Pages hospeda apenas os arquivos estáticos do Gy. Não envia perfil, treinos ou histórico ao GitHub, e não há sincronização automática entre aparelhos. Cada instalação mantém seu próprio armazenamento; limpar os dados do navegador pode removê-los. O backup do Gy é o mecanismo de transferência e recuperação.

Android e iOS continuam usando os fluxos de instalação preparados na Etapa 12C. O prompt de instalação depende do navegador no Android; no iOS, a adição à Tela de Início segue as opções disponíveis no navegador e na versão do sistema. Safe areas, instalação física, barra de status e atualização precisam ser conferidas em dispositivos reais.

## Validação desta etapa

Localmente, `npm ci`, `npm test` (101 testes), `npm run build`, preparo de `dist` e `git diff --check` passaram. O artefato sob `/gy/` respondeu HTTP 200 para a raiz, as quatro entradas de rota, o manifest e o service worker. No GitHub Actions, `npm ci`, todos os testes, build e preparo das rotas também passaram; o job foi bloqueado apenas pela configuração ausente do Pages. A verificação pública confirmou HTTP 404 para a URL do Gy e para a API de configuração Pages. Não foi possível verificar os recursos servidos pelo site, funcionamento online/offline publicado, instalação ou atualização em produção até que o Pages seja habilitado.
