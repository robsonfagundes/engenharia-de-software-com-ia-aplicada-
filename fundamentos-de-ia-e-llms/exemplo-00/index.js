import tf from '@tensorflow/tfjs-node';

// Exemplo de pessoas para treino (cada pessoa com idade, cor e localização)
// const pessoas = [
//     { nome: "Robson", idade: 44, cor: "roxo", localizacao: "Curitiba" },
//     { nome: "Erick", idade: 30, cor: "azul", localizacao: "São Paulo" },
//     { nome: "Carlos", idade: 25, cor: "vermelho", localizacao: "Rio" }
// ];

// Vetores de entrada com valores já normalizados e one-hot encoded
// Ordem: [idade_normalizada, roxo ,azul, vermelho, São Paulo, Rio, Curitiba]
// const tensorPessoas = [
//     [1, 1, 0, 0, 1, 0, 0],    // Robson
//     [0.33, 0, 1, 0, 0, 1, 0], // Erick
//     [0, 0, 0, 1, 0, 0, 1]     // Carlos
// ]

// Usamos apenas os dados numéricos, como a rede neural só entende números.
// tensorPessoasNormalizado corresponde ao dataset de entrada do modelo.
const tensorPessoasNormalizado = [
    [1, 1, 0, 0, 1, 0, 0],    // Robson 
    [0.33, 0, 1, 0, 0, 1, 0], // Erick
    [0, 0, 0, 1, 0, 0, 1]     // Carlos
]

// Labels das categorias a serem previstas (one-hot encoded)
// [premium, medium, basic]
const labelsNomes = ["premium", "medium", "basic"]; // Ordem dos labels
const tensorLabels = [
    [1, 0, 0], // premium - Robson
    [0, 1, 0], // medium - Erick
    [0, 0, 1]  // basic - Carlos
];

// Criamos tensores de entrada (xs) e saída (ys) para treinar o modelo
const inputXs = tf.tensor2d(tensorPessoasNormalizado)
const outputYs = tf.tensor2d(tensorLabels)

inputXs.print();
outputYs.print();