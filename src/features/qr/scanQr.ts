export type QrDecoder = (pixels: ImageData) => string | null;
let decoderRequest: Promise<QrDecoder> | undefined;

/** Camera and image reads share one lazy, local decoder. */
export function loadQrDecoder(): Promise<QrDecoder> {
  decoderRequest ??= import('jsqr').then(({ default: jsQR }) => (pixels: ImageData) => {
    return jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' })?.data || null;
  }).catch(failure => { decoderRequest = undefined; throw failure; });
  return decoderRequest;
}

/** Decode image pixels locally; no upload or server request is performed. */
export async function scanQrImage(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024 || !/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) throw new Error('Elegí una imagen PNG, JPG, WebP o SVG de hasta 10 MB.');
  const objectURL = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectURL;
    try { await image.decode(); }
    catch { throw new Error('No pudimos abrir la imagen. Elegí otra foto o pegá el código del pase.'); }
    const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('No pudimos leer la imagen. Pegá el código del pase.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const decode = await loadQrDecoder();
    const value = decode(context.getImageData(0, 0, canvas.width, canvas.height));
    if (!value) throw new Error('No encontramos un QR legible en la imagen. Probá otra foto o pegá el código.');
    return value;
  } finally { URL.revokeObjectURL(objectURL); }
}
