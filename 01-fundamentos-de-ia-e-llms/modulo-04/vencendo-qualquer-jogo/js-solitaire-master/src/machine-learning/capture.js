import html2canvas from 'html2canvas';

/**
 * Renderiza o tabuleiro HTML em um canvas e o converte para ImageBitmap.
 * O bitmap pode ser transferido ao Web Worker sem copiar todos os pixels.
 */
export async function captureGame(gameEl) {
    const canvas = await html2canvas(gameEl, {
        backgroundColor: null,
        logging: false,
        scale: 1
    });
    return createImageBitmap(canvas);
}
