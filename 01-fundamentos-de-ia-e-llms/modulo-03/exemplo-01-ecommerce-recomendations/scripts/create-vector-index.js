import 'dotenv/config';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
await client.connect();

// O índice é criado separadamente porque sua dimensão só é conhecida depois
// que o primeiro treinamento gera e persiste os embeddings do catálogo.
try {
    const db = client.db(process.env.MONGODB_DB || 'ecommerce_recommendations');
    const products = db.collection('products');
    // Usa um produto como amostra para descobrir automaticamente a dimensão.
    const sample = await products.findOne({ embedding: { $exists: true } });
    if (!sample?.embedding?.length) {
        throw new Error('Execute a aplicação uma vez para gerar os embeddings antes de criar o índice.');
    }

    const name = process.env.VECTOR_INDEX_NAME || 'product_embedding_index';
    // A verificação torna o script idempotente: executá-lo novamente é seguro.
    const existing = await products.listSearchIndexes(name).toArray();
    if (existing.length) {
        console.log(`Índice ${name} já existe.`);
    } else {
        // O cosseno compara a direção dos vetores e reduz a influência da
        // magnitude, sendo apropriado para as features ponderadas do exemplo.
        await products.createSearchIndex({
            name,
            type: 'vectorSearch',
            definition: {
                fields: [{
                    type: 'vector',
                    path: 'embedding',
                    numDimensions: sample.embedding.length,
                    similarity: 'cosine',
                }],
            },
        });
        console.log(`Índice ${name} criado com ${sample.embedding.length} dimensões.`);
    }
} finally {
    await client.close();
}
