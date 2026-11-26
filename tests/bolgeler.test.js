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

test('hiçbir bölge mavi tonunda değil (v4: lacivert ad kutularından ayrılsın)', () => {
  const ton = hex => {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (d === 0) return 0;
    const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };
  for (const b of BOLGELER) {
    const h = ton(b.renk);
    assert.ok(h < 165 || h > 255, `${b.id} mavi tonunda (${Math.round(h)}°)`);
  }
});
