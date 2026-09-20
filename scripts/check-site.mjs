import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const failures = [];

// The RIFF length catches interrupted binary transfers without re-encoding.
// Full decoding is a separate release audit; this is a structural check only.
export function webpStructureError(bytes) {
  if (bytes.length < 12 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
    return 'Неверный заголовок WebP';
  }
  const expected = bytes.readUInt32LE(4) + 8;
  return bytes.length === expected ? null : `Неполный WebP: ${bytes.length} байт вместо ${expected}`;
}
const requiredFiles = [
  'public/.htaccess',
  'public/robots.txt',
  'public/sitemap.xml',
  'public/404.html',
  'public/media/gallery/manifest.json',
  'public/docs/preyskurant-2026.pdf',
  'public/docs/grafik-zaezdov-2026.pdf',
];

for (const file of requiredFiles) {
  if (!existsSync(resolve(root, file))) failures.push(`Отсутствует обязательный файл: ${file}`);
}

const manifestPath = resolve(root, 'public/media/gallery/manifest.json');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(manifest) || manifest.length === 0) failures.push('Манифест фотогалереи пуст');
  for (const category of manifest) {
    for (const image of category.images ?? []) {
      for (const key of ['src', 'thumb']) {
        const relative = String(image[key] ?? '').replace(/^\//, 'public/');
        if (!relative || !existsSync(resolve(root, relative))) {
          failures.push(`Не найден файл галереи: ${image[key]}`);
        } else if (relative.endsWith('.webp')) {
          const error = webpStructureError(readFileSync(resolve(root, relative)));
          if (error) failures.push(`${relative}: ${error}`);
        }
      }
    }
  }
}

const sitemap = readFileSync(resolve(root, 'public/sitemap.xml'), 'utf8');
for (const route of ['about', 'treatment', 'procedures', 'doctors', 'stay', 'prepare', 'prices', 'official', 'news', 'contacts']) {
  if (!sitemap.includes(`/${route}`)) failures.push(`Маршрут отсутствует в sitemap: /${route}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Проверка структуры сайта пройдена');
