const test = require('node:test');
const assert = require('node:assert/strict');
const { bolgeBul, ilAdiSade, hashtenBolge, sonrakiDurum, kutuBirlestir } = require('../cekirdek.js');
const BOS = { bolge: null, plaka: null };

test('bolgeBul', () => {
  assert.equal(bolgeBul(35), 'ege');
  assert.equal(bolgeBul(34), 'marmara');
  assert.equal(bolgeBul(0), null);
  assert.equal(bolgeBul(82), null);
});

test('ilAdiSade', () => {
  assert.equal(ilAdiSade('İstanbul (Asya)'), 'İstanbul');
  assert.equal(ilAdiSade('İstanbul (Avrupa)'), 'İstanbul');
  assert.equal(ilAdiSade('Ağrı'), 'Ağrı');
});

test('hashtenBolge', () => {
  assert.equal(hashtenBolge('#ege'), 'ege');
  assert.equal(hashtenBolge('#guneydogu-anadolu'), 'guneydogu-anadolu');
  for (const h of ['', '#', '#xyz', '#EGE']) assert.equal(hashtenBolge(h), null);
});

test('sonrakiDurum: tıklamalar', () => {
  assert.deepEqual(sonrakiDurum(BOS, { tur: 'tik', plaka: 35 }), { bolge: 'ege', plaka: null });
  const ege = { bolge: 'ege', plaka: null };
  assert.deepEqual(sonrakiDurum(ege, { tur: 'tik', plaka: 35 }), { bolge: 'ege', plaka: 35 });
  assert.deepEqual(sonrakiDurum(ege, { tur: 'tik', plaka: 7 }), { bolge: 'akdeniz', plaka: null });
  assert.deepEqual(sonrakiDurum(ege, { tur: 'tik', plaka: 0 }), ege);
  assert.deepEqual(sonrakiDurum(BOS, { tur: 'tik', plaka: 0 }), BOS);
});

test('sonrakiDurum: geri ve adres', () => {
  assert.deepEqual(sonrakiDurum({ bolge: 'ege', plaka: 35 }, { tur: 'geri' }), BOS);
  assert.deepEqual(sonrakiDurum(BOS, { tur: 'hash', hash: '#karadeniz' }), { bolge: 'karadeniz', plaka: null });
  assert.deepEqual(sonrakiDurum({ bolge: 'ege', plaka: 35 }, { tur: 'hash', hash: '#xyz' }), BOS);
});

test('sonrakiDurum girdiyi değiştirmez', () => {
  const d = { bolge: 'ege', plaka: null };
  sonrakiDurum(d, { tur: 'tik', plaka: 35 });
  assert.deepEqual(d, { bolge: 'ege', plaka: null });
});

test('kutuBirlestir', () => {
  assert.deepEqual(
    kutuBirlestir([{ x: 10, y: 20, width: 30, height: 40 }, { x: 50, y: 5, width: 10, height: 10 }], 5),
    { x: 5, y: 0, width: 60, height: 65 });
});
