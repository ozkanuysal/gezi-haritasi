const test = require('node:test');
const assert = require('node:assert/strict');
const BOLGELER = require('../bolgeler.js');

test('7 bölge, beklenen sıra ve il sayıları', () => {
  assert.deepEqual(BOLGELER.map(b => [b.id, b.plakalar.length]), [
    ['marmara', 11], ['ege', 8], ['akdeniz', 8], ['ic-anadolu', 13],
    ['karadeniz', 18], ['dogu-anadolu', 14], ['guneydogu-anadolu', 9],
  ]);
});

test('1–81 arası her plaka tam bir bölgede', () => {
  const hepsi = BOLGELER.flatMap(b => b.plakalar).sort((a, b) => a - b);
  assert.deepEqual(hepsi, Array.from({ length: 81 }, (_, i) => i + 1));
});

test('adlar doğru, renkler birbirinden farklı', () => {
  assert.equal(BOLGELER.find(b => b.id === 'ic-anadolu').ad, 'İç Anadolu Bölgesi');
  assert.equal(new Set(BOLGELER.map(b => b.renk.toLowerCase())).size, 7);
});
