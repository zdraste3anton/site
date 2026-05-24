export const PORTRAIT_MAX_BYTES = 5 * 1024 * 1024;

const ACCEPT_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ACCEPT_EXT = /\.(jpe?g|png|webp)$/i;

export function validatePortraitFile(file) {
  if (!file) return 'Файл не выбран';
  if (file.size > PORTRAIT_MAX_BYTES) {
    return 'Размер файла не должен превышать 5 МБ. Выберите изображение поменьше.';
  }
  const mimeOk = ACCEPT_MIME.has(String(file.type || '').toLowerCase());
  const extOk = ACCEPT_EXT.test(file.name || '');
  if (!mimeOk && !extOk) {
    return 'Поддерживаются только JPG, PNG и WEBP.';
  }
  return null;
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}

function convertToJpegDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Не удалось обработать изображение'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch {
        reject(new Error('Не удалось обработать изображение'));
      }
    };
    img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
    img.src = dataUrl;
  });
}

export async function processPortraitFile(file) {
  const validationError = validatePortraitFile(file);
  if (validationError) {
    throw new Error(validationError);
  }
  let dataUrl = await readAsDataURL(file);
  const isWebp =
    /^data:image\/webp/i.test(String(dataUrl)) ||
    String(file.type || '').toLowerCase() === 'image/webp';
  if (isWebp) {
    dataUrl = await convertToJpegDataUrl(dataUrl);
  }
  return String(dataUrl);
}
