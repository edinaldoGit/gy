# Etapa 12D — Publicação do Gy no GitHub Pages

## Estado da publicação

O repositório está preparado para publicar em `https://edinaldoGit.github.io/gy/`. O workflow `.github/workflows/deploy.yml` executa em pushes para `main` e também pode ser iniciado manualmente. O job só publica quando a referência é `main`; pull requests e outras branches não disparam publicação automática e uma execução manual em outra branch é ignorada.

O deploy público ainda depende de enviar estas alterações à branch `main` e selecionar **GitHub Actions** como fonte em **Settings → Pages → Build and deployment → Source**. Nenhuma configuração remota foi alterada e nenhum deploy foi executado nesta etapa.

## O que o workflow faz

O workflow usa as ações oficiais `actions/checkout`, `actions/setup-node`, `actions/configure-pages`, `actions/upload-pages-artifact` e `actions/deploy-pages`. Configura Node.js 22, instala exatamente o lockfile com `npm ci`, executa `npm test` e `npm run build`, prepara os pontos de entrada das rotas, envia `dist` como artefato e publica no ambiente `github-pages`.

Qualquer falha de instalação, teste, build ou preparação interrompe o job antes do upload e do deploy. O workflow limita as permissões a `contents: read`, `pages: write` e `id-token: write`, e mantém apenas uma publicação ativa no grupo `github-pages`.

## Caminhos e rotas

O build de produção continua usando `base: '/gy/'`; o servidor de desenvolvimento continua usando `/`. O manifest conserva URLs relativas para `id`, `start_url` e `scope`, o Vue Router usa `import.meta.env.BASE_URL`, e os recursos do HTML usam `%BASE_URL%`.

Como o GitHub Pages não oferece fallback de SPA para rotas diretas, `scripts/prepare-github-pages.mjs` copia o `dist/index.html` para entradas estáticas de `/onboarding`, `/fichas`, `/historico` e `/perfil`. Assim, abrir ou recarregar `/gy/fichas/` entrega o mesmo app e o Vue Router restaura a tela. Os assets continuam apontando para `/gy/`; não se adiciona `/gy/` às rotas. A lista dessas entradas precisa acompanhar qualquer nova rota de primeiro nível.

O service worker permanece sob o escopo `/gy/`. O Workbox mantém o fallback de navegação para o `index.html` principal e precacheia os arquivos estáticos do build. As cópias de entrada por rota não contêm dados pessoais; perfil, fichas, sessões e histórico continuam no IndexedDB do dispositivo. A publicação não limpa IndexedDB, `localStorage` ou caches do navegador.

## Primeira publicação

1. Envie as alterações revisadas para a branch `main`.
2. No GitHub, abra **Settings → Pages** e selecione **GitHub Actions** como fonte de publicação.
3. Abra **Actions → Build and deploy Gy to GitHub Pages** e acompanhe as etapas de teste, build e deploy. Para o primeiro deploy, também é possível usar **Run workflow** com a branch `main` selecionada.
4. Após a conclusão verde, abra `https://edinaldoGit.github.io/gy/` e valide carregamento, rotas `/fichas/`, `/historico/` e `/perfil/`, manifest e service worker.

Se o workflow não aparecer, confirme que `.github/workflows/deploy.yml` foi enviado para `main` e que Actions está habilitado no repositório. Se o deploy falhar por configuração do Pages, selecione GitHub Actions como fonte e execute novamente. O workflow não configura as opções remotas do repositório automaticamente.

## Publicações futuras e versão

Antes de uma publicação, incremente `version` em `package.json` e execute `npm ci`, `npm test` e `npm run build`. Revise e registre as alterações no Git; depois de enviá-las para `main`, o workflow publica o novo build. A versão exibida em Perfil vem dessa propriedade no momento do build.

Usuários instalados precisam de conexão para consultar uma publicação nova. O service worker identifica os recursos alterados, e o Gy apresenta a atualização com opção de adiar. A aplicação verifica se há sessão ativa, gravações críticas, edição de ficha ou operação de backup antes de atualizar. A atualização normal não requer reinstalação e mantém o IndexedDB.

Para corrigir uma publicação problemática, reverta o commit de código por uma alteração normal na branch `main` e publique a versão corrigida. O novo build terá uma versão própria; não apague o banco local nem peça que usuários reinstalem o aplicativo. Em caso de dúvida sobre os registros locais, oriente a exportação de backup antes de qualquer ação do usuário.

## Privacidade, instalação e limites

O Pages hospeda apenas os arquivos estáticos do Gy. Não envia perfil, treinos ou histórico ao GitHub, e não há sincronização automática entre aparelhos. Cada instalação mantém seu próprio armazenamento; limpar os dados do navegador pode removê-los. O backup do Gy é o mecanismo de transferência e recuperação.

Android e iOS continuam usando os fluxos de instalação preparados na Etapa 12C. O prompt de instalação depende do navegador no Android; no iOS, a adição à Tela de Início segue as opções disponíveis no navegador e na versão do sistema. Safe areas, instalação física, barra de status e atualização precisam ser conferidas em dispositivos reais.

## Validação desta etapa

Foram executados o workflow equivalente localmente (`npm ci`, `npm test`, `npm run build` e preparo de `dist`) e uma verificação HTTP local sob `/gy/` para a raiz e as quatro entradas de rota. Isso valida a estrutura do artefato, mas não substitui um deploy real no GitHub Pages. A publicação pública, o acesso offline depois da instalação e o ciclo A/B entre duas publicações permanecem pendentes até o primeiro deploy.
