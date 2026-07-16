import 'dotenv/config';
import express from 'express';
import { MongoClient } from 'mongodb';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 3000);
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
await client.connect();

const db = client.db(process.env.MONGODB_DB || 'ecommerce_recommendations');
const products = db.collection('products');
const users = db.collection('users');
const indexName = process.env.VECTOR_INDEX_NAME || 'product_embedding_index';

/** Calcula similaridade de cosseno para o fallback sem MongoDB Search. */
function cosineSimilarity(left, right) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return -1;

    let dotProduct = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;
    for (let index = 0; index < left.length; index += 1) {
        dotProduct += left[index] * right[index];
        leftMagnitude += left[index] ** 2;
        rightMagnitude += right[index] ** 2;
    }

    const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
    return denominator ? dotProduct / denominator : 0;
}

/** Faz uma busca exata em memória quando o estágio $vectorSearch não existe. */
async function exactProductVectorSearch(queryVector, limit) {
    const candidates = await products.find(
        { embedding: { $type: 'array' } },
        { projection: { _id: 0 } },
    ).toArray();

    return candidates
        .map(product => ({
            ...product,
            vectorScore: cosineSimilarity(queryVector, product.embedding),
        }))
        .filter(product => product.vectorScore >= 0)
        .sort((left, right) => right.vectorScore - left.vectorScore)
        .slice(0, limit);
}

// Limita o JSON recebido para evitar requisições excessivamente grandes. O limite
// considera que os lotes de embeddings possuem vários valores numéricos.
app.use(express.json({ limit: '10mb' }));

/**
 * Carrega os dados acadêmicos de exemplo somente quando a coleção está vazia.
 * Assim, reiniciar a API não sobrescreve compras nem embeddings já persistidos.
 */
async function seedCollection(collection, fileName) {
    if (await collection.estimatedDocumentCount()) return;
    const documents = JSON.parse(await readFile(new URL(`./data/${fileName}`, import.meta.url)));
    await collection.insertMany(documents);
}

await Promise.all([
    seedCollection(products, 'products.json'),
    seedCollection(users, 'users.json'),
]);

// Retorna o catálogo sem o _id interno e sem os embeddings, que não são
// necessários para a renderização inicial da interface.
app.get('/api/products', async (_request, response) => {
    response.json(await products.find({}, { projection: { _id: 0, embedding: 0 } }).toArray());
});

// Lista os clientes e suas compras. O embedding fica restrito à API de vetores.
app.get('/api/users', async (_request, response) => {
    response.json(await users.find({}, { projection: { _id: 0, embedding: 0 } }).toArray());
});

// Busca um cliente pelo identificador numérico usado na aplicação.
app.get('/api/users/:id', async (request, response) => {
    const user = await users.findOne({ id: Number(request.params.id) }, { projection: { _id: 0, embedding: 0 } });
    if (!user) return response.status(404).json({ error: 'Cliente não encontrado' });
    response.json(user);
});

// Cadastra um novo cliente ou atualiza o registro com o mesmo id.
app.post('/api/users', async (request, response) => {
    await users.updateOne({ id: request.body.id }, { $set: request.body }, { upsert: true });
    response.status(201).json(request.body);
});

// Persiste alterações cadastrais e no histórico de compras do cliente.
app.put('/api/users/:id', async (request, response) => {
    const id = Number(request.params.id);
    const user = { ...request.body, id };
    await users.updateOne({ id }, { $set: user }, { upsert: true });
    response.json(user);
});

/**
 * Recebe os vetores produzidos pelo Web Worker e os grava em lote.
 * bulkWrite reduz as viagens ao banco e upsert permite criar ou atualizar
 * documentos usando a mesma operação.
 */
app.post('/api/vectors/sync', async (request, response) => {
    const { products: productVectors = [], users: userVectors = [] } = request.body;
    if (!productVectors.length || !userVectors.length) {
        return response.status(400).json({ error: 'Vetores de produtos e clientes são obrigatórios' });
    }

    await Promise.all([
        products.bulkWrite(productVectors.map(({ meta, vector }) => ({
            updateOne: {
                filter: { id: meta.id },
                update: { $set: { ...meta, embedding: vector } },
                upsert: true,
            },
        }))),
        users.bulkWrite(userVectors.map(({ vector, ...user }) => ({
            updateOne: {
                filter: { id: user.id },
                update: { $set: { ...user, embedding: vector } },
                upsert: true,
            },
        }))),
    ]);

    response.json({ products: productVectors.length, users: userVectors.length });
});

/**
 * Persiste o vetor atual do cliente e executa a busca por similaridade no
 * catálogo. O estágio $vectorSearch usa o índice HNSW gerenciado pelo
 * Atlas Search/mongot e devolve candidatos para reordenação pelo TensorFlow.
 */
app.post('/api/vector-search/products', async (request, response) => {
    const { user, limit = 50 } = request.body;
    if (!Array.isArray(user?.vector)) {
        return response.status(400).json({ error: 'O vetor do cliente é obrigatório' });
    }

    try {
        // `vector` serve apenas como entrada da busca. Removê-lo do objeto
        // persistido evita tentar usar o mesmo caminho em $set e $unset.
        const { vector, ...userData } = user;
        await users.updateOne(
            { id: userData.id },
            { $set: { ...userData, embedding: vector }, $unset: { vector: '' } },
            { upsert: true },
        );

        let matches;
        try {
            matches = await products.aggregate([
                {
                    $vectorSearch: {
                        index: indexName,
                        path: 'embedding',
                        queryVector: vector,
                        numCandidates: Math.max(limit * 10, 100),
                        limit,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        id: 1,
                        name: 1,
                        category: 1,
                        price: 1,
                        color: 1,
                        embedding: 1,
                        vectorScore: { $meta: 'vectorSearchScore' },
                    },
                },
            ]).toArray();
        } catch (vectorSearchError) {
            console.warn(`MongoDB Vector Search indisponível; usando busca exata local: ${vectorSearchError.message}`);
            matches = await exactProductVectorSearch(vector, limit);
        }

        response.json(matches);
    } catch (error) {
        response.status(503).json({
            error: 'Não foi possível executar a busca de produtos por similaridade.',
            details: error.message,
        });
    }
});

// Publica index.html, CSS, templates, dados e módulos ES pelo mesmo servidor.
app.use(express.static(fileURLToPath(new URL('.', import.meta.url))));

app.listen(port, () => {
    console.log(`Aplicação disponível em http://localhost:${port}`);
});

// Fecha a conexão com o MongoDB ao encerrar o processo, evitando conexões órfãs.
async function shutdown() {
    await client.close();
    process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
