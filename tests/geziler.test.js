const test = require('node:test');
const assert = require('node:assert/strict');
const GEZILER = require('../geziler.js');

test('iki gezi: İstanbul ve Konya', () => {
  assert.deepEqual(GEZILER.map(g => g.plaka), [34, 42]);
});

test('Santral İstanbul gezisi tablodaki değerlerle', () => {
  const g = GEZILER.find(x => x.plaka === 34);
  assert.equal(g.plaka, 34);
  assert.equal(g.mekan, 'Santral İstanbul');
  assert.equal(g.tur, 'Şehir içi');
  assert.equal(g.hafta, 18);
  assert.equal(g.sinif, 4);
  assert.equal(g.ders, 'Fen Bilimleri');
  assert.deepEqual(g.kazanimlar.map(k => k.kod), ['F.4.7.1.1.', 'F.4.7.1.2.', 'F.4.7.1.3.']);
  assert.equal(g.kazanimlar[1].metin, 'Çalışan bir elektrik devresi kurar.');
  assert.deepEqual(g.anahtarKelimeler, ['pil', 'ampul', 'kablo ve anahtar', 'elektrik devresi']);
  assert.deepEqual(g.konum, { enlem: 41.06639, boylam: 28.94611 });
  assert.equal(g.fotograf.dosya, 'gorseller/santral-istanbul.jpg');
  assert.equal(g.fotograf.lisans, 'CC BY-SA 4.0');
  assert.equal(g.fotograf.yazar, 'Kurmanbek');
});

test('Konya gezisi tablodaki değerlerle', () => {
  const g = GEZILER.find(x => x.plaka === 42);
  assert.equal(g.mekan, 'Konya Gezisi');
  assert.equal(g.tur, 'Şehir dışı');
  assert.equal(g.hafta, 30);
  assert.equal(g.sinif, 6);
  assert.equal(g.ders, 'Sosyal Bilgiler');
  assert.equal(g.kazanimlar.length, 5);
  assert.ok(g.kazanimlar.every(k => k.kod === null));
  assert.equal(g.kazanimlar[0].metin, "Anadolu'nun Türk yurdu hâline gelmesinde siyasi ve askerî gelişmelerin etkisini açıklar.");
  assert.equal(g.kazanimlar[4].metin, 'Doğal ve beşerî coğrafya özelliklerinin ekonomik faaliyetler üzerindeki etkisini açıklar.');
  assert.equal(g.anahtarKelimeler.length, 17);
  assert.equal(g.anahtarKelimeler[0], 'Anadolu Selçuklu Devleti');
  assert.equal(g.anahtarKelimeler[16], 'okul dışı öğrenme');
  assert.deepEqual(g.konum, { enlem: 37.87056, boylam: 32.50472 });
  assert.equal(g.fotograf.dosya, 'gorseller/mevlana-muzesi.jpg');
  assert.equal(g.fotograf.yazar, 'Niels Elgaard Larsen');
  assert.equal(g.fotograf.lisans, 'CC BY-SA 3.0');
});
