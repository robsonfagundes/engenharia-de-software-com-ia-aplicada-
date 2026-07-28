# JavaScript Solitaire Game

Jogo de paciência desenvolvido em JavaScript.

## Atualização do projeto

O projeto foi atualizado para funcionar com **Node.js 22**. Durante a modernização, foram realizadas as seguintes alterações:

- substituição do fluxo antigo de desenvolvimento e build baseado em Webpack pelo Vite;
- atualização das dependências de desenvolvimento, com uso do Vite 5 e do Sass;
- criação do arquivo `vite.config.mjs`, configurando o servidor local na porta `3000` e a saída de produção na pasta `build`;
- adequação do HTML para carregar o JavaScript como módulo ES;
- atualização dos scripts `start` e `build` no `package.json`;
- atualização do arquivo `yarn.lock` com as dependências compatíveis.

## Requisitos

- Node.js 22
- Yarn

## Executando em ambiente de desenvolvimento

```bash
yarn
yarn start
```

Depois, acesse `http://localhost:3000` no navegador.

## Gerando a versão de produção

```bash
yarn build
```

Os arquivos gerados serão salvos na pasta `build`.

## Imagens

![JavaScript Solitaire](https://raw.githubusercontent.com/uzi88/js-solitaire/master/screen-shot.png)

![JavaScript Solitaire Win](https://raw.githubusercontent.com/uzi88/js-solitaire/master/screen-shot-win.png)

Demo original: http://radovanjanjic.com/js-solitaire/
