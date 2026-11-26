const test = require('node:test');
const assert = require('node:assert/strict');
const YURTDISI = require('../yurtdisi.js');

test('Almanya-Hollanda gezisi tablodaki değerlerle', () => {
  assert.equal(YURTDISI.length, 1);
  const g = YURTDISI[0];
  assert.equal(g.ad, 'Almanya-Hollanda Matematik, Sanat ve Kültür Gezisi');
  assert.equal(g.tur, 'Yurt dışı');
  assert.equal(g.hafta, 28);
  assert.equal(g.sinif, '5-6');
  assert.equal(g.ders, 'Matematik & Sanat');
  assert.equal(g.amac, 'Mat-Fen-İng.-sanat akademik ve beceri gelişimi');
  assert.deepEqual(g.anahtarKelimeler, ['Matematik ve sanat ilişkisi', 'kültürlerarası etkileşim',
    'Avrupa kültürel mirası', 'geometrik ve estetik düşünme', 'disiplinler arası öğrenme']);
  assert.deepEqual(g.ulkeler, [
    { ad: 'Almanya', konum: { enlem: 51.1638, boylam: 10.4478 }, yon: 'sag',
      sehirler: [{ ad: 'Frankfurt', konum: { enlem: 50.1106, boylam: 8.6822 }, yon: 'sol' }] },
    { ad: 'Hollanda', konum: { enlem: 52.2435, boylam: 5.6343 }, yon: 'ust',
      sehirler: [{ ad: 'Amsterdam', konum: { enlem: 52.37, boylam: 4.88 }, yon: 'sol' }] },
  ]);
  assert.equal(g.fotograf.dosya, 'gorseller/rijksmuseum.jpg');
  assert.equal(g.fotograf.yazar, 'Trougnouf (Benoit Brummer)');
  assert.equal(g.fotograf.lisans, 'CC BY 4.0');
});
