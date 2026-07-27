# Módulo 04 — Web Machine Learning: Como Vencer Qualquer Jogo

## Contexto acadêmico

Este diretório reúne os estudos e projetos do **Módulo 04 da Pós-graduação em Engenharia de Software com IA Aplicada**.

- Capítulo 1: **Como Vencer Qualquer Jogo — PT01**
- Instrutor: **Erick Wendel**
- Aluno: **Robson Fagundes**

## Objetivo do módulo

O módulo propõe a criação de uma inteligência artificial capaz de jogar automaticamente um jogo executado no navegador. O desafio apresentado no material é o clássico **Duck Hunt**, no qual a aplicação precisa identificar os patos e interagir com o jogo em tempo real.

A proposta é explorar como modelos de detecção de objetos já treinados podem ser integrados a aplicações JavaScript para automatizar tarefas visuais complexas. Em vez de construir e treinar uma rede neural do zero, o foco está em combinar modelos existentes, bibliotecas web e APIs do navegador de maneira criativa e eficaz.

## Conceitos estudados

- Web Machine Learning;
- execução de IA diretamente no navegador;
- modelos pré-treinados de detecção de objetos;
- captura e análise da imagem do jogo;
- identificação de elementos visuais em tempo real;
- conversão das detecções em coordenadas da tela;
- simulação de interações e cliques;
- integração entre inteligência artificial, JavaScript e Web APIs.

## Desafio prático

O fluxo esperado para a automação de um jogo é:

1. capturar a imagem atual do jogo;
2. enviar a imagem para um modelo de detecção de objetos;
3. localizar o alvo e obter suas coordenadas;
4. converter as coordenadas do modelo para a área do jogo;
5. simular a ação do jogador;
6. repetir o processo enquanto o jogo estiver em execução.

```text
Jogo no navegador
       │
       ▼
Captura da imagem
       │
       ▼
Modelo de detecção
       │
       ▼
Coordenadas do alvo
       │
       ▼
Interação automática
```

## Projetos

### DuckHunt-JS

Projeto-base do jogo Duck Hunt utilizado para estudar a automação proposta pelo módulo.

```bash
cd vencendo-qualquer-jogo/DuckHunt-JS
npm install
npm start
```

### JavaScript Solitaire

Projeto obtido do GitHub e adaptado para Node.js 22 como uma segunda base de experimentação. A infraestrutura antiga, baseada em Webpack 2 e `node-sass`, foi substituída por Vite e Dart Sass. O jogo também foi configurado para virar uma carta por vez.

```bash
cd vencendo-qualquer-jogo/js-solitaire-master
yarn install
yarn start
```

Depois de iniciar um dos projetos, acesse o endereço exibido no terminal.

## Aprendizado esperado

Ao final da atividade, o objetivo é compreender que soluções de Machine Learning não precisam começar obrigatoriamente pelo treinamento de um modelo. Modelos prontos podem ser integrados a aplicações web para interpretar o estado de uma interface, tomar decisões e executar ações em tempo real.

## Referência

Conteúdo elaborado com base na página 39 do material **Módulo 04: Web Machine Learning — Como Vencer Qualquer Jogo**, capítulo **Como Vencer Qualquer Jogo PT01**.
