export const money = cents => cents == null ? 'Valor a consultar' : (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const availability = { consultar: 'Disponibilidade a consultar', encomenda: 'Sob encomenda', pronta: 'Pronta entrega', indisponivel: 'Indisponível' };
export function selection(product, variantId = '') {
  const variant = product.variants.find(v => v.id === variantId);
  if (product.variants.length && !variant) return null;
  return { product, variant, price: variant ? variant.priceCents : product.priceCents, image: variant?.image || product.image };
}
export function restoreCart(raw, products) {
  if (!Array.isArray(raw)) return [];
  const result = [];
  for (const row of raw.slice(0, 100)) {
    const p = products.find(p => p.id === row?.id && p.active && p.availability !== 'indisponivel');
    if (!p || !selection(p, row.variantId || '') || !Number.isInteger(row.quantity) || row.quantity < 1) continue;
    const variantId = row.variantId || '';
    const old = result.find(r => r.id === p.id && r.variantId === variantId);
    if (old) old.quantity = Math.min(99, old.quantity + row.quantity);
    else result.push({ id: p.id, variantId, quantity: Math.min(99, row.quantity) });
  }
  return result;
}
export function orderSummary(cart, products) {
  const rows = restoreCart(cart, products).map(row => ({ ...row, ...selection(products.find(p => p.id === row.id), row.variantId) }));
  return { rows, total: rows.reduce((s, r) => s + (r.price ?? 0) * r.quantity, 0), pending: rows.some(r => r.price == null) };
}
export function orderMessage(cart, products, note = '', showPrices = true) {
  const { rows, total, pending } = orderSummary(cart, products);
  return ['Olá! Vim pelo catálogo da Maximos Confeitaria e gostaria de fazer uma encomenda.', '', 'Meu pedido:', ...rows.map(r => `- ${r.quantity}x ${r.product.name}${r.variant ? ` — ${r.variant.name}` : ''}${showPrices ? ` — ${r.price == null ? 'valor a consultar' : `${money(r.price)} por unidade · ${money(r.price * r.quantity)}`}` : ''}`), '', ...(showPrices ? [`Total estimado: ${pending ? 'a confirmar (há itens sem preço definido)' : money(total)}`] : ['Gostaria de consultar os valores dos itens selecionados.']), ...(showPrices && pending && total ? [`Subtotal dos itens com preço: ${money(total)}`] : []), ...(note.trim() ? ['', `Observações: ${note.trim().slice(0, 500)}`] : []), '', 'A encomenda depende de confirmação de disponibilidade e valores. Gostaria de combinar a entrega ou retirada.'].join('\n');
}
export function whatsappUrl(number, message) {
  if (!/^[1-9]\d{9,14}$/.test(number || '')) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
export function productCard(p, showPrices = true) {
  return `<article class="product-card"><a class="product-photo ${p.image ? '' : 'photo-pending'}" href="/produtos/${escape(p.id)}/" data-product="${escape(p.id)}">${p.image ? `<img src="/images/${escape(p.image)}" alt="${escape(p.name)}" width="960" height="1440" loading="lazy" decoding="async">` : '<img src="/images/mini.webp" alt="" loading="lazy"><span>Fotografia em breve</span>'}${p.featured ? '<span class="photo-label">Seleção Maximos</span>' : ''}<span class="photo-open" aria-hidden="true">↗</span></a><div class="product-body"><p class="eyebrow">${escape(p.category)}${p.variants.length ? ` <span>· ${p.variants.length} sabores</span>` : ''}</p><h3><a href="/produtos/${escape(p.id)}/" data-product="${escape(p.id)}">${escape(p.name)}</a></h3><p class="description">${escape(p.description)}</p><p class="stock">${availability[p.availability]}</p><div class="product-bottom"><span>${p.variants.length ? 'Escolher sabor' : showPrices ? money(p.priceCents) : 'Adicionar à sacola'}</span><button class="add-circle" data-${p.variants.length ? 'product' : 'add'}="${escape(p.id)}" aria-label="${p.variants.length ? 'Escolher sabor de' : 'Adicionar'} ${escape(p.name)}" ${p.availability === 'indisponivel' ? 'disabled' : ''}>+</button></div></div></article>`;
}
