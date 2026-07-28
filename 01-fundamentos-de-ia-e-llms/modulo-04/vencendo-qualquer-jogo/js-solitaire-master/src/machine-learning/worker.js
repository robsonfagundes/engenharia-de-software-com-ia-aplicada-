// Esta fronteira segue o exemplo com YOLO. `observations` funciona como fallback
// didático enquanto não existe um modelo TFJS específico para as cartas.
self.onmessage = async ({ data }) => {
    if (data.type !== 'predict') return;
    const { image, observations } = data;

    // Processa a imagem fora da thread principal para não travar a interface.
    const canvas = new OffscreenCanvas(image.width, image.height);
    canvas.getContext('2d').drawImage(image, 0, 0);
    const sample = canvas.getContext('2d').getImageData(0, 0, 1, 1).data;
    image.close();

    self.postMessage({
        type: 'prediction',
        observations,
        detector: 'development-fallback',
        confidence: null,
        frame: { width: canvas.width, height: canvas.height },
        sample: Array.from(sample)
    });
};
