import { mkdir, readFile, writeFile, cp, access, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { escape, productCard } from '../src/core.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
if (dirname(dist) !== root || !dist.endsWith('dist')) throw new Error('Diretório de saída fora do módulo.');
const source = JSON.parse(await readFile(resolve(root, 'data/catalog.json'), 'utf8'));
const fail = message => { throw new Error(`Catálogo inválido: ${message}`); };
const text = (value, max, label) => typeof value === 'string' && value.trim().length > 0 && value.length <= max ? value : fail(label);
const price = value => value === null || (Number.isSafeInteger(value) && value >= 0 && value <= 10000000) ? value : fail('preço em centavos');
const slug = value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80 ? value : fail('identificador');
const image = async value => {
  if (value === null) return null;
  if (typeof value !== 'string' || !/^[a-z0-9-]+\.(webp|png|jpg)$/.test(value)) fail('nome de imagem');
  await access(resolve(root, 'public/images', value)); return value;
};
const seen = new Set();
if (!Array.isArray(source.products)) fail('lista de produtos');
const products = [];
for (const p of source.products) {
  if (typeof p.active !== 'boolean') fail('status ativo');
  if (!p.active) continue;
  const id = slug(p.id); if (seen.has(id)) fail('produto duplicado'); seen.add(id);
  if (!['consultar', 'encomenda', 'pronta', 'indisponivel'].includes(p.availability)) fail('disponibilidade');
  if (!Array.isArray(p.variants)) fail('variações');
  const ids = new Set(); const variants = [];
  for (const v of p.variants) {
    const vid = slug(v.id); if (ids.has(vid)) fail('variação duplicada'); ids.add(vid);
    variants.push({ id: vid, name: text(v.name, 120, 'nome da variação'), image: await image(v.image ?? null), priceCents: price(v.priceCents) });
  }
  // Projeção explícita: campos internos nunca são copiados ao frontend.
  products.push({ id, name: text(p.name, 120, 'nome'), category: text(p.category, 60, 'categoria'), description: text(p.description, 2000, 'descrição'), image: await image(p.image), priceCents: price(p.priceCents), availability: p.availability, active: true, featured: p.featured === true, variants });
}
const configured = source.settings || {};
const whatsappNumber = process.env.PUBLIC_WHATSAPP_NUMBER ?? configured.whatsappNumber ?? '';
const instagramUrl = process.env.PUBLIC_INSTAGRAM_URL ?? configured.instagramUrl ?? '';
const siteUrl = (process.env.PUBLIC_SITE_URL || configured.siteUrl || process.env.CF_PAGES_URL || '').replace(/\/$/, '');
if (whatsappNumber && !/^[1-9]\d{9,14}$/.test(whatsappNumber)) fail('WhatsApp deve conter código do país e apenas dígitos');
if (instagramUrl && !/^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/.test(instagramUrl)) fail('URL do Instagram');
if (siteUrl) { const url = new URL(siteUrl); if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') fail('URL pública deve ser uma origem HTTPS'); }
const showPrices = configured.showPrices !== false;
const settings = { whatsappNumber, instagramUrl, siteUrl, showPrices };
const template = await readFile(resolve(root, 'src/index.html'), 'utf8');
const description = 'Brownies, doces no pote e tortas artesanais. Escolha seus favoritos e faça sua encomenda pelo WhatsApp.';
const serialized = JSON.stringify({ settings, products }).replace(/</g, '\\u003c');
function page(product) {
  const path = product ? `/produtos/${product.id}/` : '/';
  const title = product ? `${product.name} | Maximos Confeitaria` : 'Maximos Confeitaria | Catálogo de doces artesanais';
  const ogImage = `${siteUrl}/images/${product?.image || 'compartilhar-catalogo-v1.jpg'}`;
  const replacements = { __TITLE__: escape(title), __DESCRIPTION__: escape(product?.description || description), __OG_IMAGE__: escape(ogImage), __OG_IMAGE_TYPE__: product?.image ? 'image/webp' : 'image/jpeg', __OG_WIDTH__: product?.image ? '960' : '1200', __OG_HEIGHT__: product?.image ? '1440' : '630', __OG_ALT__: escape(product?.name || 'Maximos Confeitaria — catálogo de doces artesanais'), __CANONICAL__: siteUrl ? `<link rel="canonical" href="${escape(siteUrl + path)}"><meta property="og:url" content="${escape(siteUrl + path)}">` : '', __PRODUCTS__: products.map(p => productCard(p, showPrices)).join(''), __DATA__: serialized };
  return template.replace(/__[A-Z_]+__/g, key => replacements[key] ?? key);
}
// Apenas a saída gerada deste módulo é substituída.
await rm(dist, { recursive: true, force: true }); await mkdir(dist, { recursive: true });
await cp(resolve(root, 'public'), dist, { recursive: true });
for (const name of ['app.mjs', 'core.mjs', 'styles.css']) await cp(resolve(root, 'src', name), resolve(dist, name));
await writeFile(resolve(dist, 'index.html'), page());
for (const product of products) {
  const folder = resolve(dist, 'produtos', product.id); await mkdir(folder, { recursive: true });
  await writeFile(resolve(folder, 'index.html'), page(product));
}
await writeFile(resolve(dist, '404.html'), '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Página não encontrada | Maximos</title><body style="font-family:Georgia;background:#faf8f4;color:#39261f;padding:10%"><h1>Este doce mudou de lugar.</h1><p>A página que você procurou não está disponível.</p><a href="/">Voltar ao catálogo da Maximos Confeitaria</a></body></html>');
await writeFile(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`);
if (siteUrl) await writeFile(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', ...products.map(p => `/produtos/${p.id}/`)].map(path => `<url><loc>${escape(siteUrl + path)}</loc></url>`).join('')}</urlset>`);
console.log(`Build concluído: ${products.length} produtos → ${dist}`);
if (!whatsappNumber) console.log('WhatsApp pendente: envio de pedidos desativado.');
if (!siteUrl) console.log('URL pública pendente: canonical e sitemap serão gerados quando PUBLIC_SITE_URL ou CF_PAGES_URL estiver configurado.');
