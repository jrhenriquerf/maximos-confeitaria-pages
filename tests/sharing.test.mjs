import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

test('prévia usa URL pública estável, imagem JPEG e metadados presentes no HTML', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  execFileSync(process.execPath, ['scripts/build.mjs'], {
    cwd: root,
    env: { ...process.env, PUBLIC_SITE_URL: '', CF_PAGES_URL: 'https://preview.example.invalid' },
    stdio: 'pipe'
  });
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('property="og:url" content="https://maximos-confeitaria-catalogo.pages.dev/"'));
  assert.ok(html.includes('content="https://maximos-confeitaria-catalogo.pages.dev/images/compartilhar-catalogo-v1.jpg"'));
  assert.ok(html.includes('property="og:image:type" content="image/jpeg"'));
  assert.ok(html.includes('property="og:image:width" content="1200"'));
  assert.ok(html.includes('property="og:image:height" content="630"'));
  assert.ok(!html.includes('preview.example.invalid'));
  assert.ok(!/__OG_|__TITLE__|__DESCRIPTION__/.test(html));
  const image = await readFile(new URL('../dist/images/compartilhar-catalogo-v1.jpg', import.meta.url));
  assert.deepEqual([...image.subarray(0, 3)], [255, 216, 255]);
  const product = await readFile(new URL('../dist/produtos/brownie-pote-kinder/index.html', import.meta.url), 'utf8');
  assert.ok(product.includes('Brownie no Pote com Kinder Bueno | Maximos Confeitaria'));
  assert.ok(product.includes('content="https://maximos-confeitaria-catalogo.pages.dev/images/brownie-kinder.webp"'));
});
