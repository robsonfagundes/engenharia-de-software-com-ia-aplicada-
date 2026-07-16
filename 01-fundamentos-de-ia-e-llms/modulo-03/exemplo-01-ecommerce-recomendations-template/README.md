# Sistema de recomendação de e-commerce com TensorFlow.js e MongoDB Vector Search

## Português

### Contexto acadêmico

Este é um projeto acadêmico da **Pós-graduação em Engenharia de Software com IA Aplicada**, desenvolvido na disciplina de **Fundamentos de IA e LLMs**.

- Aluno: **Robson Fagundes**
- Instrutor: **Erick Wendel**

O projeto foi construído para estudar, de forma prática, vetorização de dados, busca por similaridade, redes neurais, sistemas de recomendação e integração entre uma aplicação JavaScript e um banco vetorial.

### O que o projeto faz

A aplicação simula um pequeno e-commerce. Ela permite:

- selecionar um cliente;
- visualizar idade e histórico de compras;
- pesquisar e filtrar produtos;
- adicionar ou remover compras;
- treinar uma rede neural no navegador;
- transformar produtos e clientes em vetores numéricos;
- persistir catálogo, clientes, compras e embeddings no MongoDB;
- encontrar produtos semelhantes com MongoDB Vector Search;
- reordenar os candidatos com TensorFlow.js;
- acompanhar `loss` e `accuracy` pelo TensorFlow Visor.

O objetivo não é oferecer um recomendador pronto para produção. O projeto serve como demonstração didática de um pipeline híbrido: o banco vetorial faz a recuperação eficiente de candidatos e a rede neural calcula a ordenação final.

### O que foi desenvolvido

A versão inicial executava o fluxo no navegador e mantinha clientes em `sessionStorage`. Nesta evolução foram desenvolvidos:

- servidor Node.js com Express;
- integração segura com o driver oficial do MongoDB;
- coleções `products` e `users`;
- persistência das compras e dos embeddings;
- API REST para produtos, clientes, sincronização e busca vetorial;
- índice MongoDB Vector Search com dimensão detectada automaticamente;
- busca ANN com o estágio de agregação `$vectorSearch`;
- recuperação de até 50 candidatos antes da inferência;
- reordenação dos candidatos pela rede neural existente;
- repetição automática da última recomendação solicitada durante o treinamento;
- exibição dos 12 melhores produtos ainda não comprados com percentual de compatibilidade;
- script idempotente para criação do índice;
- configuração por variáveis de ambiente;
- comentários didáticos em PT-BR nas classes e funções do projeto;
- documentação bilíngue.

### Como a recomendação funciona

1. O servidor lê produtos e clientes do MongoDB.
2. Um Web Worker cria um contexto comum com preços, idades, categorias e cores.
3. Preço e idade são normalizados entre 0 e 1.
4. Categoria e cor são representadas por codificação one-hot.
5. Cada feature recebe um peso definido no worker.
6. O vetor de um cliente com compras é a média dos vetores dos produtos comprados.
7. Para um cliente sem compras, somente a idade contribui inicialmente, representando um cenário de *cold start*.
8. Os vetores de produtos e clientes são enviados para a API e persistidos no campo `embedding`.
9. Ao solicitar uma recomendação, o vetor do cliente é consultado contra o índice `product_embedding_index`.
10. O MongoDB devolve os produtos vetorialmente mais próximos.
11. A rede neural recebe apenas esses candidatos, atribui um score e produz a ordem final.
12. A interface remove os itens já comprados e mostra as 12 melhores recomendações com o percentual de compatibilidade.

Se um cliente for selecionado enquanto o treinamento ainda está em andamento, a seleção mais recente fica pendente e a recomendação é executada automaticamente quando o modelo estiver pronto.

Os pesos didáticos atuais são:

| Feature | Peso |
|---|---:|
| Preço | 0,4 |
| Categoria | 0,3 |
| Idade | 0,2 |
| Cor | 0,1 |

### Arquitetura

```text
Navegador
├── Views: interface e interação com o DOM
├── Controllers: coordenação do fluxo
├── Services: consumo da API HTTP
├── Events: comunicação desacoplada entre módulos
└── Web Worker + TensorFlow.js
    ├── vetorização
    ├── treinamento
    └── reordenação dos candidatos
             │
             ▼ HTTP/JSON
Servidor Node.js + Express
├── API de produtos e clientes
├── sincronização dos embeddings
└── consulta $vectorSearch
             │
             ▼
MongoDB
├── products: catálogo + embedding
├── users: perfil + compras + embedding
└── product_embedding_index
```

O navegador nunca recebe `MONGODB_URI`. Somente o servidor Node.js acessa o banco, evitando a exposição de credenciais no código entregue ao cliente.

### Estrutura principal

```text
data/                         Dados iniciais acadêmicos
scripts/create-vector-index.js Criação do índice vetorial
src/controller/               Coordenação entre views, serviços e eventos
src/events/                   Barramento e nomes dos eventos
src/service/                  Cliente HTTP da API
src/view/                     Renderização e templates da interface
src/workers/                  Vetorização, treinamento e recomendação
server.js                     API, persistência e Vector Search
.env.example                  Exemplo de configuração
```

### Pré-requisitos

- Node.js 20 ou superior;
- npm;
- MongoDB local, MongoDB Atlas ou MongoDB self-managed/Community.

Quando `$vectorSearch` está disponível, a aplicação usa o índice ANN. Em uma instalação local contendo apenas `mongod`, ela utiliza automaticamente uma busca exata por similaridade de cosseno, adequada ao pequeno catálogo acadêmico.

### Configuração e execução

Entre na pasta do exemplo:

```bash
cd modulo-03/exemplo-01-ecommerce-recomendations-template
```

Crie o arquivo de configuração:

```bash
cp .env.example .env
```

Exemplo de `.env`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=ecommerce_recommendations
PORT=3000
VECTOR_INDEX_NAME=product_embedding_index
```

Instale as dependências e inicie:

```bash
npm install
npm start
```

Abra `http://localhost:3000`. No primeiro acesso, aguarde o treinamento terminar para que os embeddings sejam gravados. Em outro terminal, crie o índice uma única vez:

```bash
npm run db:create-vector-index
```

Espere o índice ficar ativo e selecione um cliente para executar a recomendação. Se a porta 3000 estiver ocupada:

```bash
PORT=3100 npm start
```

### API

| Método | Endpoint | Responsabilidade |
|---|---|---|
| `GET` | `/api/products` | Lista o catálogo sem expor embeddings |
| `GET` | `/api/users` | Lista clientes e compras |
| `GET` | `/api/users/:id` | Busca um cliente |
| `POST` | `/api/users` | Cadastra ou atualiza um cliente |
| `PUT` | `/api/users/:id` | Atualiza perfil e histórico |
| `POST` | `/api/vectors/sync` | Persiste vetores em lote |
| `POST` | `/api/vector-search/products` | Busca candidatos por similaridade |

Exemplo simplificado de documento vetorizado:

```json
{
  "id": 1,
  "name": "Fones de Ouvido Sem Fio",
  "category": "eletrônicos",
  "price": 129.99,
  "color": "preto",
  "embedding": [0.08, 0.1, 0.3, 0, 0.1]
}
```

### Limitações acadêmicas

- As features são estruturadas e não embeddings semânticos gerados por uma LLM.
- O conjunto de dados é pequeno e criado para demonstração.
- O modelo é treinado novamente quando os dados de compra mudam.
- Autenticação, autorização, validação completa e observabilidade não fazem parte deste exemplo.
- Um sistema real deve separar treino e inferência, versionar embeddings/modelos e medir métricas de negócio.

---

## English

### Academic context

This is an academic project from the **Postgraduate Program in Software Engineering with Applied AI**, developed for the **AI and LLM Fundamentals** course.

- Student: **Robson Fagundes**
- Instructor: **Erick Wendel**

The project provides a practical introduction to data vectorization, similarity search, neural networks, recommendation systems, and the integration of a JavaScript application with a vector database.

### What the project does

The application simulates a small e-commerce platform. It can:

- select a customer and display their purchase history;
- search and filter products;
- add or remove purchases;
- train a neural network in the browser;
- convert products and customers into numeric vectors;
- store catalog data, customers, purchases, and embeddings in MongoDB;
- retrieve similar products with MongoDB Vector Search;
- rerank candidates with TensorFlow.js;
- display training loss and accuracy with TensorFlow Visor.

This is not intended to be a production-ready recommendation platform. It is an educational demonstration of a hybrid pipeline: the vector database efficiently retrieves candidates, while the neural network produces the final ranking.

### What was developed

The original version ran entirely in the browser and stored customers in `sessionStorage`. This version adds:

- a Node.js and Express server;
- secure integration with the official MongoDB driver;
- `products` and `users` collections;
- persistent purchases and embeddings;
- REST endpoints for data access, vector synchronization, and search;
- a MongoDB Vector Search index with automatic dimension detection;
- ANN retrieval through the `$vectorSearch` aggregation stage;
- retrieval of up to 50 candidates before model inference;
- neural-network reranking;
- automatic retry of the latest recommendation requested during training;
- display of the top 12 not-yet-purchased products with compatibility scores;
- an idempotent index creation script;
- environment-based configuration;
- educational PT-BR code comments;
- bilingual documentation.

### Recommendation flow

1. The server loads products and customers from MongoDB.
2. A Web Worker builds a shared context containing prices, ages, categories, and colors.
3. Price and age are normalized to the 0–1 range.
4. Category and color use one-hot encoding.
5. Each feature receives an educational weight.
6. A customer with purchases is represented by the average vector of the purchased products.
7. For a customer without purchases, only age initially contributes, illustrating a cold-start scenario.
8. Product and customer vectors are persisted in each document's `embedding` field.
9. The customer vector is queried against `product_embedding_index`.
10. MongoDB returns the nearest vector candidates.
11. TensorFlow.js scores those candidates and creates the final ranking.
12. The UI removes previously purchased items and displays the top 12 recommendations with compatibility scores.

If a customer is selected while training is still running, the latest selection is retained and automatically recommended when the model becomes ready.

### Requirements and setup

- Node.js 20 or newer;
- npm;
- local MongoDB, MongoDB Atlas, or self-managed/Community MongoDB.

When `$vectorSearch` is available, the application uses the ANN index. With a local `mongod` process only, it automatically falls back to exact cosine-similarity search, which is suitable for this small educational catalog.

```bash
cd modulo-03/exemplo-01-ecommerce-recomendations-template
cp .env.example .env
npm install
npm start
```

Open `http://localhost:3000` and wait for the first training cycle to persist the embeddings. Then create the vector index from another terminal:

```bash
npm run db:create-vector-index
```

Once the index is active, select a customer to run the recommendation pipeline.

### Educational limitations

- Features are structured vectors, not semantic embeddings generated by an LLM.
- The dataset is small and intended for demonstration.
- The model is retrained when purchase data changes.
- Authentication, authorization, comprehensive validation, and observability are outside the scope of this example.
- A production system should separate training and inference, version models and embeddings, and measure business-oriented recommendation metrics.
