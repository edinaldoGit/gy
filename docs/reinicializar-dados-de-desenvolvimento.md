# Reinicialização local dos dados de fichas

O schema IndexedDB passou a usar `fichas` como programas, `treinos` como registros separados e sessões com snapshots. A aplicação não apaga nem migra registros antigos automaticamente. Registros antigos de fichas não são exibidos como programas válidos.

Para limpar somente os dados do módulo Fichas e as sessões de teste, abra o Gy no **ambiente local de desenvolvimento** (por exemplo, `http://localhost:5173`), confira a origem exibida na barra de endereço e execute o trecho abaixo no console do navegador. Ele atua somente no banco IndexedDB chamado `GyDB` dessa origem. Perfil (`perfil`) e catálogo (`catalogo`) são preservados.

```js
const databaseName = 'GyDB';
const storesToClear = ['fichas', 'treinos', 'historico', 'configuracoes', 'programacoes'];
const request = indexedDB.open(databaseName);

request.onsuccess = () => {
  const database = request.result;
  const missing = storesToClear.filter(name => !database.objectStoreNames.contains(name));
  if (missing.length) {
    console.error('Schema inesperado; nada foi apagado:', missing);
    database.close();
    return;
  }

  const transaction = database.transaction(storesToClear, 'readwrite');
  for (const name of storesToClear) transaction.objectStore(name).clear();
  transaction.oncomplete = () => {
    console.info(`Dados locais reinicializados em ${location.origin}/${databaseName}. Perfil e catálogo foram preservados.`);
    database.close();
    location.reload();
  };
  transaction.onerror = () => console.error('A limpeza falhou e foi revertida.', transaction.error);
};

request.onerror = () => console.error(`Não foi possível abrir ${databaseName}; nenhum dado foi apagado.`, request.error);
```

Não execute o trecho em produção nem em uma origem cujo banco não queira limpar. A confirmação é manual e a operação remove os históricos locais junto com os dados antigos de fichas.
