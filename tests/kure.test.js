const test = require('node:test');
const assert = require('node:assert/strict');
const { TURKIYE, SURE, ortografik, turkiyeyeOturt, cizelge, oynatilsinMi } = require('../kure.js');

const MERKEZ = { lon: (TURKIYE.bati + TURKIYE.dogu) / 2, lat: (TURKIYE.guney + TURKIYE.kuzey) / 2 };
const yakin = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

test('Türkiye sınırları ve süre', () => {
  assert.deepEqual(TURKIYE, { bati: 25.67, dogu: 44.82, guney: 35.82, kuzey: 42.10 });
  assert.equal(SURE, 2600);
});

test('ortografik: merkez (0,0), arka yüz görünmez', () => {
  const m = ortografik(MERKEZ.lon, MERKEZ.lat, MERKEZ);
  yakin(m.x, 0); yakin(m.y, 0); assert.equal(m.gorunur, true);
  assert.equal(ortografik(MERKEZ.lon + 180, -MERKEZ.lat, MERKEZ).gorunur, false);
  assert.ok(ortografik(MERKEZ.lon + 10, MERKEZ.lat, MERKEZ).x > 0, 'doğu sağda');
  assert.ok(ortografik(MERKEZ.lon, MERKEZ.lat + 5, MERKEZ).y > 0, 'kuzey yukarıda');
});

test('turkiyeyeOturt: Türkiye genişliği hedef kutuya eşit, merkez kutunun ortası', () => {
  const s = turkiyeyeOturt({ left: 100, top: 50, width: 1000, height: 430 });
  const w = ortografik(TURKIYE.dogu, MERKEZ.lat, MERKEZ).x - ortografik(TURKIYE.bati, MERKEZ.lat, MERKEZ).x;
  yakin(s.R * w, 1000);
  assert.equal(s.cx, 600);
  assert.equal(s.cy, 265);
  assert.deepEqual([s.lon, s.lat], [MERKEZ.lon, MERKEZ.lat]);
});

test('cizelge: başlangıç, bitiş, tekdüze yakınlaşma', () => {
  const bas = { R: 300, cx: 700, cy: 450 };
  const son = { R: 4000, cx: 650, cy: 420, lon: MERKEZ.lon, lat: MERKEZ.lat };
  const b = cizelge(0, bas, son);
  yakin(b.lon, son.lon - 150); assert.equal(b.R, 300); assert.equal(b.opaklik, 1);
  assert.deepEqual([b.cx, b.cy], [700, 450]);
  const e = cizelge(SURE, bas, son);
  yakin(e.lon, son.lon); yakin(e.lat, son.lat); yakin(e.R, 4000); yakin(e.cx, 650); yakin(e.cy, 420);
  assert.equal(e.opaklik, 0);
  assert.equal(cizelge(2000, bas, son).opaklik, 1);
  let onceki = 0;
  for (let t = 0; t <= SURE; t += 50) { const r = cizelge(t, bas, son).R; assert.ok(r >= onceki - 1e-9, `t=${t}`); onceki = r; }
  yakin(cizelge(SURE + 500, bas, son).R, 4000);
});

test('oynatilsinMi: yalnızca ana sayfa, hareket serbest ve WebGL varken', () => {
  assert.equal(oynatilsinMi({ hash: '', azHareket: false, webgl: true }), true);
  assert.equal(oynatilsinMi({ hash: '#', azHareket: false, webgl: true }), true);
  assert.equal(oynatilsinMi({ hash: '#marmara/34', azHareket: false, webgl: true }), false);
  assert.equal(oynatilsinMi({ hash: '', azHareket: true, webgl: true }), false);
  assert.equal(oynatilsinMi({ hash: '', azHareket: false, webgl: false }), false);
});
