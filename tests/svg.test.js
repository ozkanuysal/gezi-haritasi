const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { bolgeBul } = require('../cekirdek.js');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const gruplar = [...html.matchAll(/<g id="([^"]+)" data-plakakodu="(\d+)"/g)].map(m => [m[1], Number(m[2])]);

test('SVG 1–81 arası her plakayı içerir ve her biri bir bölgede', () => {
  const plakalar = new Set(gruplar.map(([, p]) => p).filter(p => p > 0));
  assert.equal(plakalar.size, 81);
  for (const p of plakalar) assert.notEqual(bolgeBul(p), null, `plaka ${p}`);
});

test('İstanbul iki parça, Kıbrıs bölgesiz', () => {
  assert.deepEqual(gruplar.filter(([, p]) => p === 34).map(([id]) => id).sort(), ['istanbul-asya', 'istanbul-avrupa']);
  assert.ok(gruplar.some(([id, p]) => id === 'kuzey-kibris' && p === 0));
  assert.ok(html.includes('id="guney-kibris"'));
});

test('betikler doğru sırada', () => {
  const sira = ['bolgeler.js', 'cekirdek.js', 'harita.js'].map(f => html.indexOf(`src="${f}"`));
  assert.ok(sira.every(i => i > 0) && sira[0] < sira[1] && sira[1] < sira[2]);
});
