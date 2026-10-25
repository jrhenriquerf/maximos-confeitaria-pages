import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { restoreCart, orderSummary, orderMessage, whatsappUrl, productCard } from '../src/core.mjs';
const products = [
  { id: 'brownie', name: 'Brownie', active: true, availability: 'encomenda', priceCents: 1234, variants: [] },
  { id: 'pote', name: 'Pote', active: true, availability: 'consultar', priceCents: 999, variants: [{ id: 'branco', name: 'Branco', priceCents: null }] },
  { id: 'off', active: false, variants: [] },
  { id: 'sold', active: true, availability: 'indisponivel', variants: [] }
];
test('reidrata somente produtos ativos e variações válidas, sem confiar em preços armazenados', () => {
  assert.deepEqual(restoreCart([{ id: 'off', quantity: 1 }, { id: 'sold', quantity: 1 }, { id: 'x', quantity: 1 }, { id: 'pote', variantId: 'x', quantity: 1 }, { id: 'brownie', quantity: -1 }, { id: 'brownie', quantity: 1.5 }, { id: 'brownie', quantity: 1000, priceCents: 1 }], products), [{ id: 'brownie', variantId: '', quantity: 99 }]);
  assert.deepEqual(restoreCart([{ id: 'brownie', quantity: 2 }, { id: 'brownie', quantity: 3 }], products), [{ id: 'brownie', variantId: '', quantity: 5 }]);
});
test('soma valores em centavos e não usa preço base como preço de variação sem valor', () => {
  const cart = [{ id: 'brownie', quantity: 3 }, { id: 'pote', variantId: 'branco', quantity: 2 }];
  const summary = orderSummary(cart, products);
  assert.equal(summary.total, 3702); assert.equal(summary.pending, true);
  const msg = orderMessage(cart, products, 'Retirada no sábado');
  assert.ok(msg.startsWith('Olá! Vim pelo catálogo da Maximos Confeitaria e gostaria de fazer uma encomenda.'));
  assert.match(msg, /2x Pote — Branco — valor a consultar/);
  assert.match(msg, /Total estimado: a confirmar/);
  assert.match(msg, /Subtotal dos itens com preço/);
  assert.match(msg, /depende de confirmação de disponibilidade/);
  assert.match(msg, /Retirada no sábado/);
});
test('o total fica pendente quando nenhum item tem preço', () => {
  const { total, pending } = orderSummary([{ id: 'pote', variantId: 'branco', quantity: 1 }], products);
  assert.equal(total, 0); assert.equal(pending, true);
});

test('modo sem preços omite valores e totais mesmo se houver preços cadastrados', () => {
  const cart = [{ id: 'brownie', quantity: 2 }, { id: 'pote', variantId: 'branco', quantity: 1 }];
  const msg = orderMessage(cart, products, 'Entrega a combinar', false);
  assert.match(msg, /2x Brownie/);
  assert.match(msg, /1x Pote — Branco/);
  assert.match(msg, /Gostaria de consultar os valores/);
  assert.doesNotMatch(msg, /R\$|Total|Subtotal|por unidade|valor a consultar/);
  assert.match(msg, /Entrega a combinar/);
  const card = productCard({ ...products[0], category: 'Brownies', description: 'Brownie artesanal.', image: null }, false);
  assert.doesNotMatch(card, /R\$|Valor a consultar/);
  assert.match(card, /Adicionar à sacola/);
});
test('WhatsApp ausente ou malformado não produz link; mensagem é codificada', () => {
  for (const value of ['', null, '+55 11 9', 'javascript:alert(1)']) assert.equal(whatsappUrl(value, 'Olá'), null);
  const result = whatsappUrl('5511999999999', 'Olá!\n2x Brownie & Cream');
  assert.equal(new URL(result).searchParams.get('text'), 'Olá!\n2x Brownie & Cream');
  assert.equal(new URL(result).hostname, 'wa.me');
});

test('sacolas antigas mantêm Branco e Kinder ao separar os cards', async () => {
  const { products } = JSON.parse(await readFile(new URL('../data/catalog.json', import.meta.url), 'utf8'));
  const cart = restoreCart([
    { id: 'brownie-pote', variantId: 'branco', quantity: 2 },
    { id: 'brownie-pote', variantId: 'kinder', quantity: 3 },
    { id: 'brownie-pote-kinder', variantId: '', quantity: 1 }
  ], products);
  assert.deepEqual(cart, [
    { id: 'brownie-pote', variantId: '', quantity: 2 },
    { id: 'brownie-pote-kinder', variantId: '', quantity: 4 }
  ]);
  assert.match(orderMessage(cart, products, '', false), /4x Brownie no Pote com Kinder Bueno/);
});
