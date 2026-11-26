const test = require('node:test');
const assert = require('node:assert/strict');
const GEZILER = require('../geziler.js');

test('Santral İstanbul gezisi tablodaki değerlerle', () => {
  assert.equal(GEZILER.length, 1);
  const g = GEZILER[0];
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
