# Etapa 12C — PWA, instalação e atualizações

## Identidade e publicação

O manifest mantém o nome `Gy`, idioma `pt-BR`, exibição `standalone`, orientação retrato e os ícones existentes de 192×192, 512×512 e Apple Touch. O ícone principal foi preservado. Ele não está marcado como `maskable`, pois a composição atual da marca não garante a margem segura exigida por recortes circulares e outras máscaras.

O build de produção usa `base: '/gy/'`; o servidor de desenvolvimento usa `/`. O manifest usa `id`, `start_url` e `scope` relativos, e o Vue Router recebe `import.meta.env.BASE_URL`. O build produz recursos sob `/gy/`, incluindo o service worker. Nenhum workflow de publicação foi criado nesta etapa.

Para publicar uma futura versão, incremente `version` em `package.json`, execute `npm run build` e publique o conteúdo de `dist/` no caminho `/gy/` com HTTPS. A versão aparece no Perfil. O service worker compara seu precache com os arquivos publicados e oferece a nova versão dentro do Gy; não é preciso apagar o IndexedDB nem reinstalar o aplicativo.

## Instalação

O aplicativo reconhece `display-mode: standalone`, `window-controls-overlay` e o sinal legado `navigator.standalone` da Apple. Quando o navegador envia `beforeinstallprompt`, o Perfil apresenta **Instalar Gy** e chama o prompt apenas após um toque. O resultado vem de `userChoice`; `appinstalled` e o modo standalone atualizam a interface. A página não consegue detectar todas as instalações feitas anteriormente.

Quando o navegador não fornece o prompt, o Perfil mostra instruções sob demanda. No iOS, o guia cita o Safari como referência e informa que a disponibilidade de **Adicionar à Tela de Início** e **Abrir como App** depende do navegador e da versão do sistema. Não há um botão falso de instalação para esses casos. O guia começa fechado e a opção de dispensá-lo fica registrada neste navegador.

O ícone Apple Touch existente é mantido, e a versão local do Fredoka é incorporada ao build. A fonte e sua licença OFL ficam nos assets do Gy, de modo que o texto e a tipografia principal também estejam disponíveis offline.

## Aparência de sistema e safe areas

`viewport-fit=cover` permite usar as safe areas. A área superior externa da TopBar recebe `safe-area-inset-top` com a mesma cor da aba ou do feedback; o conteúdo interno aprovado mantém sua altura. O `theme-color` muda com a seção e o feedback quando o navegador suporta essa integração. No iOS é usado `apple-mobile-web-app-status-bar-style=default`; o Gy não desenha uma barra de status própria.

A área rolável principal soma a safe area inferior ao espaçamento já existente. Os bottom sheets compartilhados reservam a safe area inferior no próprio painel, sem duplicar o padding do conteúdo. O layout já usa `dvh`; formulários e modais continuam roláveis quando o teclado ocupa parte da tela.

O sistema operacional controla a cor e os ícones da barra de status. A aparência pode variar entre versões do Android, Safari, outros navegadores iOS e modo instalado. A validação feita neste ambiente não substitui a checagem física em aparelhos com notch ou Dynamic Island.

## Cache e funcionamento offline

O service worker precacheia os arquivos do build, incluindo JavaScript, CSS, HTML, ícones, manifest, imagens, Fredoka e licença. O precache de produção medido neste build tem 45 entradas e cerca de 2,1 MB. O Workbox usa o `index.html` como fallback de navegação dentro do escopo `/gy/`.

O cache contém recursos estáticos do aplicativo; os registros pessoais continuam no IndexedDB e não são copiados para o cache do service worker. A abertura offline depende de uma visita online anterior que tenha concluído a instalação do service worker e o cache inicial. A aplicação não promete que o sistema operacional manterá armazenamento local permanentemente; o backup continua sendo a forma de recuperação.

## Atualizações seguras

O único registro do service worker é `useRegisterSW()` do `vite-plugin-pwa`, com `registerType: 'prompt'`. Não há registro automático adicional. O worker não pula a etapa de confirmação; após a confirmação, o Gy pede `SKIP_WAITING`, aguarda a ativação/controle e recarrega a aba que iniciou a atualização. `clientsClaim` permite ao worker ativado controlar essa aba. Nenhum aviso de atualização significa que o conteúdo já foi atualizado.

O Gy verifica ao abrir, ao voltar ao primeiro plano após 15 minutos, ao recuperar conexão, a cada seis horas e quando o usuário solicita a verificação no Perfil. Uma consulta offline não é apresentada como “atualizado”. A atualização pode ser adiada; enquanto houver uma sessão ativa, a seção informa que ela ficará para depois do treino e não oferece recarga.

Antes de atualizar, o Gy bloqueia se houver sessão, autosave/finalização/cancelamento em curso, edição de ficha, restauração ou operação de backup. Para uma atualização segura, bloqueia novas gravações e adquire o Web Lock exclusivo `gy-dados-gravacao`, que aguarda transações compartilhadas existentes. Uma falha mantém o modal aberto e libera o bloqueio, sem declarar sucesso.

Abas do mesmo escopo mantêm um Web Lock compartilhado `gy-pwa-tab-presence`; a quantidade de locks ativos é consultada antes de atualizar. Quando a API de consulta de locks não estiver disponível, a coordenação usa `BroadcastChannel` e pulsa cada 2,5 segundos. Se detectar outra aba, a ação de atualização é adiada até o usuário fechar as demais abas. O bloqueio conservador protege uma sessão ou formulário que esteja em outra aba; congelamento extremo do navegador pode limitar a resposta do canal alternativo, portanto o controle multiaba não é absoluto.

## Dados e banco

Esta etapa não altera o schema do IndexedDB. Atualizações de frontend não executam `deleteDatabase`, não limpam `localStorage` global e não removem registros. A versão do aplicativo vem do `package.json`; ela é independente da versão do banco. Uma futura alteração de schema precisa de migração explícita no Dexie.

## Validação desta etapa

- `npm run build`: passou; manifest, assets e worker gerados com base `/gy/`.
- `npm test`: passou, incluindo os testes de política de instalação e bloqueio de atualização.
- `git diff --check`: passou.
- Produção local A/B, mesma origem e caminho `/gy/`: build `0.0.0` detectou `0.0.1`; a confirmação ativou a nova versão, recarregou o app e preservou um perfil fictício no IndexedDB.
- Offline: com o servidor de teste parado, a rota `/gy/historico` abriu por navegação interna e após recarga, com os recursos já precacheados.
- Inspeção visual: Perfil e guia de instalação foram conferidos em viewport móvel do navegador (380×844 CSS px). Esse teste não equivale a validação em telefone físico.

## Limitações e verificações pendentes

O prompt Android `beforeinstallprompt`, a adição à Tela de Início do iOS, o teclado virtual, as safe areas em hardware real e a instalação standalone precisam de conferência em Chrome Android e Safari iOS. A seção e o guia foram inspecionados em navegador desktop/mobile responsivo; nenhuma instalação física foi executada. As larguras 320, 375, 390, 430, 768 px e desktop ainda devem ser revisadas em navegador/dispositivo. O teste A/B usou localhost isolado com dados fictícios; não foi feito deploy nem validação em GitHub Pages.
