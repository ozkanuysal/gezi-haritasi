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

// İl ekranı (2026-11-26)
const { ilGezileri, ilEkraniMi, hashtenDurum, durumdanHash, projeksiyon } = require('../cekirdek.js');

test('ilGezileri ve ilEkraniMi', () => {
  assert.equal(ilGezileri(34).length, 1);
  assert.deepEqual(ilGezileri(6), []);
  assert.equal(ilEkraniMi({ bolge: 'marmara', plaka: 34 }), true);
  assert.equal(ilEkraniMi({ bolge: 'marmara', plaka: 10 }), false);
  assert.equal(ilEkraniMi(BOS), false);
});

test('sonrakiDurum: il-ac, bolgeye-don; Türkiye görünümünde İstanbul şekli Marmara\'yı açar', () => {
  assert.deepEqual(sonrakiDurum(BOS, { tur: 'tik', plaka: 34 }), { bolge: 'marmara', plaka: null });
  assert.deepEqual(sonrakiDurum(BOS, { tur: 'il-ac', plaka: 34 }), { bolge: 'marmara', plaka: 34 });
  assert.deepEqual(sonrakiDurum({ bolge: 'marmara', plaka: 34 }, { tur: 'bolgeye-don' }), { bolge: 'marmara', plaka: null });
  assert.deepEqual(sonrakiDurum(BOS, { tur: 'hash', hash: '#marmara/34' }), { bolge: 'marmara', plaka: 34 });
});

test('hashtenDurum', () => {
  assert.deepEqual(hashtenDurum('#marmara/34'), { bolge: 'marmara', plaka: 34 });
  assert.deepEqual(hashtenDurum('#ege'), { bolge: 'ege', plaka: null });
  for (const h of ['#marmara/99', '#marmara/10', '#marmara/abc']) assert.deepEqual(hashtenDurum(h), { bolge: 'marmara', plaka: null }, h);
  assert.deepEqual(hashtenDurum('#ege/34'), { bolge: 'ege', plaka: null });
  for (const h of ['#xyz/34', '', '#']) assert.deepEqual(hashtenDurum(h), BOS, h);
});

test('durumdanHash', () => {
  assert.equal(durumdanHash({ bolge: 'marmara', plaka: 34 }), '#marmara/34');
  assert.equal(durumdanHash({ bolge: 'marmara', plaka: 10 }), '#marmara');
  assert.equal(durumdanHash(BOS), '');
});

test('projeksiyon', () => {
  assert.deepEqual(projeksiyon(41, 29, { lon0: 28, lat0: 42, kos: 0.75, olcek: 100 }), { x: 75, y: 100 });
});

// İl etiketi yerleştirme (2026-11-26): bölge adlarıyla çakışmasın
const { etiketYeri } = require('../cekirdek.js');

test('etiketYeri: üst, doluysa alt, sonra sağ, sol; hepsi doluysa üst', () => {
  const n = { x: 100, y: 100 }, o = { w: 40, h: 10 };
  assert.deepEqual(etiketYeri(n, o, 5, []), { yon: 'ust', x: 80, y: 85, width: 40, height: 10 });
  const ust = { x: 70, y: 80, width: 60, height: 12 };
  assert.deepEqual(etiketYeri(n, o, 5, [ust]), { yon: 'alt', x: 80, y: 105, width: 40, height: 10 });
  const alt = { x: 70, y: 106, width: 60, height: 12 };
  assert.deepEqual(etiketYeri(n, o, 5, [ust, alt]), { yon: 'sag', x: 105, y: 95, width: 40, height: 10 });
  const sag = { x: 104, y: 90, width: 50, height: 20 };
  assert.deepEqual(etiketYeri(n, o, 5, [ust, alt, sag]), { yon: 'sol', x: 55, y: 95, width: 40, height: 10 });
  const sol = { x: 40, y: 90, width: 30, height: 20 };
  assert.equal(etiketYeri(n, o, 5, [ust, alt, sag, sol]).yon, 'ust');
});
