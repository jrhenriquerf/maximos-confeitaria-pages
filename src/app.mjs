import { escape, money, availability, selection, restoreCart, orderSummary, orderMessage, whatsappUrl, productCard } from './core.mjs';
const { products, settings } = JSON.parse(document.querySelector('#catalog-data').textContent);
const $ = s => document.querySelector(s);
const productDialog = $('#product-dialog'), cartDialog = $('#cart-dialog');
let cart = [], category = 'Todos', query = '', note = '', toastTimer;
try { cart = restoreCart(JSON.parse(localStorage.getItem('maximos-sacola-v1')), products); } catch { /* Storage indisponível: sacola permanece em memória. */ }
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500); }
function persist() {
  try { localStorage.setItem('maximos-sacola-v1', JSON.stringify(cart)); } catch { toast('Sua sacola está disponível nesta visita. O navegador não permitiu salvá-la.'); }
  updateCount();
}
function updateCount() { document.querySelectorAll('.bag-count').forEach(el => el.textContent = cart.reduce((s, r) => s + r.quantity, 0)); }
function add(id, variantId = '', quantity = 1) {
  const p = products.find(p => p.id === id && p.active && p.availability !== 'indisponivel');
  if (!p || !selection(p, variantId)) return;
  const old = cart.find(r => r.id === id && r.variantId === variantId);
  if (old) old.quantity = Math.min(99, old.quantity + quantity);
  else cart.push({ id, variantId, quantity: Math.min(99, quantity) });
  persist(); toast(`${p.name} adicionado à sacola.`);
}
function normalize(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function renderProducts() {
  const visible = products.filter(p => (category === 'Todos' || p.category === category) && normalize(`${p.name} ${p.description} ${p.variants.map(v => v.name).join(' ')}`).includes(normalize(query)));
  $('#products').innerHTML = visible.length ? visible.map(p => productCard(p, settings.showPrices)).join('') : '<div class="empty"><h3>Nenhum doce encontrado.</h3><p>Experimente outro nome ou outra categoria.</p><button class="button secondary" id="reset-search">Ver todos os doces</button></div>';
  $('#result-count').textContent = `${visible.length} ${visible.length === 1 ? 'doce para descobrir' : 'doces para descobrir'}`;
  document.querySelectorAll('[data-filter]').forEach(b => { b.classList.toggle('active', b.dataset.filter === category); b.setAttribute('aria-pressed', String(b.dataset.filter === category)); });
}
function imageMarkup(p, image) { return image ? `<img class="detail-photo" src="/images/${escape(image)}" alt="${escape(p.name)}" width="960" height="1440">` : '<div class="detail-photo photo-pending"><img src="/images/mini.webp" alt=""><span>Fotografia em breve</span></div>'; }
function showProduct(id, changeUrl = true) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  let variantId = p.variants[0]?.id || '';
  let count = 1;
  productDialog.innerHTML = `<button data-close class="close detail-close" aria-label="Fechar detalhes">×</button><div class="detail-image">${imageMarkup(p, selection(p, variantId).image)}</div><div class="detail-copy"><p class="eyebrow">${escape(p.category)}</p><h2>${escape(p.name)}</h2><p>${escape(p.description)}</p><p class="stock">${availability[p.availability]}</p>${p.variants.length ? `<fieldset><legend>Escolha seu sabor</legend><div class="variants">${p.variants.map((v, i) => `<label><input type="radio" name="variant" value="${escape(v.id)}" ${i === 0 ? 'checked' : ''}><span>${escape(v.name)}</span></label>`).join('')}</div></fieldset>` : ''}<strong id="detail-price" ${settings.showPrices ? '' : 'hidden'}>${money(selection(p, variantId).price)}</strong><div class="detail-actions"><div class="quantity"><button id="detail-minus" aria-label="Diminuir quantidade">−</button><output id="detail-quantity">1</output><button id="detail-plus" aria-label="Aumentar quantidade">+</button></div><button class="button primary" id="detail-add" ${p.availability === 'indisponivel' ? 'disabled' : ''}>${p.availability === 'indisponivel' ? 'Indisponível' : 'Adicionar à sacola'} <span>+</span></button></div><p class="fine-print">Disponibilidade, valores e prazo de produção serão confirmados no atendimento. Para restrições alimentares, consulte a composição antes de encomendar.</p><button class="share" id="share-product">Compartilhar este doce ↗</button></div>`;
  if (!productDialog.open) productDialog.showModal();
  if (changeUrl) history.replaceState(null, '', `/produtos/${p.id}/`);
  productDialog.querySelectorAll('[name=variant]').forEach(radio => radio.addEventListener('change', () => {
    variantId = radio.value; const chosen = selection(p, variantId);
    $('#detail-price').textContent = money(chosen.price);
    productDialog.querySelector('.detail-image').innerHTML = imageMarkup(p, chosen.image);
  }));
  function quantity(value) { count = Math.max(1, Math.min(99, value)); $('#detail-quantity').value = count; }
  $('#detail-minus').onclick = () => quantity(count - 1);
  $('#detail-plus').onclick = () => quantity(count + 1);
  $('#detail-add').onclick = () => { add(p.id, variantId, count); productDialog.close(); };
  $('#share-product').onclick = async () => {
    const url = `${location.origin}/produtos/${p.id}/`;
    try { if (navigator.share) await navigator.share({ title: p.name, url }); else { await navigator.clipboard.writeText(url); toast('Link do produto copiado.'); } }
    catch (error) { if (error.name !== 'AbortError') toast(`Copie o endereço do produto na barra do navegador.`); }
  };
}
productDialog.addEventListener('close', () => { history.replaceState(null, '', '/#catalogo'); });
function renderCart() {
  cart = restoreCart(cart, products);
  const { rows, total, pending } = orderSummary(cart, products);
  const target = whatsappUrl(settings.whatsappNumber, orderMessage(cart, products, note, settings.showPrices));
  $('#cart-content').innerHTML = rows.length ? `<div class="cart-items">${rows.map((r, i) => `<article class="cart-row">${r.image ? `<img src="/images/${escape(r.image)}" alt="" width="72" height="108">` : '<div class="cart-placeholder">M</div>'}<div><h3>${escape(r.product.name)}</h3>${r.variant ? `<p>${escape(r.variant.name)}</p>` : ''}${settings.showPrices ? `<p>${money(r.price)}${r.price != null ? ' / un.' : ''}</p>` : ''}<div class="quantity"><button data-quantity="${i}" data-delta="-1" aria-label="Diminuir quantidade de ${escape(r.product.name)}">−</button><output>${r.quantity}</output><button data-quantity="${i}" data-delta="1" aria-label="Aumentar quantidade de ${escape(r.product.name)}">+</button></div></div><div class="cart-row-end"><button class="remove" data-remove="${i}" aria-label="Remover ${escape(r.product.name)}">Remover</button>${settings.showPrices ? `<strong>${r.price == null ? 'A consultar' : money(r.price * r.quantity)}</strong>` : ''}</div></article>`).join('')}</div><label class="note-field">Algum detalhe para a sua encomenda?<textarea id="order-note" maxlength="500" rows="3" placeholder="Conte para a gente…">${escape(note)}</textarea></label><div class="totals">${settings.showPrices ? `${pending && total ? `<p><span>Subtotal com preço definido</span><strong>${money(total)}</strong></p>` : ''}<p><span>Total estimado</span><strong>${pending ? 'A confirmar' : money(total)}</strong></p><small>${pending ? 'Há itens com valor a consultar. O total será informado no atendimento.' : 'Entrega ou retirada a combinar. Não inclui eventual taxa de entrega.'}</small>` : '<p><strong>Vamos combinar pelo WhatsApp</strong></p><small>Consulte os valores e a disponibilidade dos seus favoritos no atendimento.</small>'}</div><button id="checkout" class="button primary checkout" ${target ? '' : 'disabled'}>Enviar pedido pelo WhatsApp <span>↗</span></button>${target ? '' : '<p class="pending-contact">Atendimento pelo WhatsApp em breve. Você já pode montar sua sacola.</p>'}<p class="fine-print">Sua solicitação será enviada para confirmação. A encomenda só é confirmada após o atendimento.</p>` : '<div class="empty"><span class="empty-mark">M</span><h3>Seu próximo favorito espera por você.</h3><p>Escolha um doce no catálogo para começar sua sacola.</p><button class="button primary" data-close>Explorar o catálogo ↗</button></div>';
  $('#order-note')?.addEventListener('input', e => { note = e.target.value; });
  $('#checkout')?.addEventListener('click', () => {
    const url = whatsappUrl(settings.whatsappNumber, orderMessage(cart, products, note, settings.showPrices));
    if (url && cart.length) window.open(url, '_blank', 'noopener,noreferrer');
  });
}
document.addEventListener('click', e => {
  const target = e.target.closest('button, a');
  if (!target) return;
  if (target.hasAttribute('data-filter')) { category = target.dataset.filter; renderProducts(); }
  if (target.id === 'reset-search') { category = 'Todos'; query = ''; $('#search').value = ''; renderProducts(); }
  if (target.hasAttribute('data-product')) { e.preventDefault(); showProduct(target.dataset.product); }
  if (target.hasAttribute('data-add')) add(target.dataset.add);
  if (target.hasAttribute('data-cart')) { renderCart(); cartDialog.showModal(); }
  if (target.hasAttribute('data-close')) target.closest('dialog').close();
  if (target.hasAttribute('data-remove')) { cart.splice(Number(target.dataset.remove), 1); persist(); renderCart(); }
  if (target.hasAttribute('data-quantity')) {
    const index = Number(target.dataset.quantity); cart[index].quantity = Math.max(1, Math.min(99, cart[index].quantity + Number(target.dataset.delta))); persist(); renderCart();
  }
});
$('#search').addEventListener('input', e => { query = e.target.value; renderProducts(); });
for (const dialog of [cartDialog, productDialog]) dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
if (settings.instagramUrl) document.querySelectorAll('[data-instagram]').forEach(link => { link.href = settings.instagramUrl; link.hidden = false; link.target = '_blank'; link.rel = 'noopener noreferrer'; });
updateCount(); renderProducts();
const initial = location.pathname.match(/^\/produtos\/([a-z0-9-]+)\/?$/)?.[1];
if (initial) showProduct(initial, false);
addEventListener('storage', e => { if (e.key === 'maximos-sacola-v1') { try { cart = restoreCart(JSON.parse(e.newValue), products); updateCount(); if (cartDialog.open) renderCart(); } catch {} } });
