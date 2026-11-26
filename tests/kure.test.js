const test = require('node:test');
const assert = require('node:assert/strict');
const { TURKIYE, SURE, ortografik, turkiyeyeOturt, cizelge, oynatilsinMi } = require('../kure.js');

const MERKEZ = { lon: (TURKIYE.bati + TURKIYE.dogu) / 2, lat: (TURKIYE.guney + TURKIYE.kuzey) / 2 };
const yakin = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

test('Türkiye sınırları ve süre', () => {
  assert.deepEqual(TURKIYE, { bati: 25.67, dogu: 44.82, guney: 35.82, kuzey: 42.10 });
  assert.equal(SURE, 4600); // 2026-11-26: kullanıcı 2 sn daha uzun ve daha yavaş dönüş istedi
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
  assert.equal(cizelge(4100, bas, son).opaklik, 1);
  // Dönüş yavaş: ilk 1800 ms'de 150°'nin %70'inden azı dönülür (eskiden tamamı dönülüyordu).
  assert.ok(cizelge(1800, bas, son).lon - b.lon < 105);
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

// Etkileşimli küre (dünya simgesi, 2026-11-26): döner, Türkiye'de durur, sürüklenir, yakınlaşır
const { TURKIYE_MERKEZI, ACILIS_MS, acilisGorunumu, surukle, yakinlastir } = require('../kure.js');

test('acilisGorunumu: başta 150° batıda, sonda Türkiye ortada; yarıçap sabit', () => {
  assert.deepEqual(TURKIYE_MERKEZI, MERKEZ);
  const b = acilisGorunumu(0, 300);
  yakin(b.lon, MERKEZ.lon - 150); yakin(b.lat, 15); assert.equal(b.R, 300);
  const s = acilisGorunumu(ACILIS_MS + 100, 300);
  yakin(s.lon, MERKEZ.lon); yakin(s.lat, MERKEZ.lat); assert.equal(s.R, 300);
});

test('surukle: sağa sürükleyince batıya, aşağı sürükleyince kuzeye bakar; enlem ±85, boylam sarılır', () => {
  const on = 100 * Math.PI / 18; // R=100'de 10°
  const g = surukle({ lon: 30, lat: 40, R: 100 }, on, on);
  yakin(g.lon, 20); yakin(g.lat, 50); assert.equal(g.R, 100);
  assert.equal(surukle({ lon: 0, lat: 80, R: 100 }, 0, 1000).lat, 85);
  assert.equal(surukle({ lon: 0, lat: -80, R: 100 }, 0, -1000).lat, -85);
  yakin(surukle({ lon: 175, lat: 0, R: 100 }, -on, 0).lon, -175);
});

test('yakinlastir: çarpanla büyür/küçülür, sınırlar içinde kalır', () => {
  assert.equal(yakinlastir({ lon: 1, lat: 2, R: 100 }, 2, 50, 400).R, 200);
  assert.equal(yakinlastir({ lon: 1, lat: 2, R: 100 }, 10, 50, 400).R, 400);
  assert.equal(yakinlastir({ lon: 1, lat: 2, R: 100 }, 0.1, 50, 400).R, 50);
  assert.deepEqual([yakinlastir({ lon: 1, lat: 2, R: 100 }, 2, 50, 400).lon, yakinlastir({ lon: 1, lat: 2, R: 100 }, 2, 50, 400).lat], [1, 2]);
});

// Kürede Türkiye adı ve adım adım yakınlaşma (2026-11-26)
const { ADIM_SAYISI, ADIM_CARPANI, ACILIS_BITIS, ILK_ARA_MS, ADIM_MS, ARA_MS, etiketKonumu, etiketOlcegi } = require('../kure.js');

test('açılış: dönüşten sonra 5 adımda, eskisinden hızlı yakınlaşır; adımlar arasında durur', () => {
  assert.equal(ADIM_SAYISI, 5); // 2026-11-26: 3 → 5 ("2 kere daha")
  assert.equal(ADIM_CARPANI, 1.7);
  assert.ok(ADIM_MS < 480 && ARA_MS < 220, 'yakınlaşma hızlandı (2026-11-26: ikinci kez)');
  assert.equal(ACILIS_BITIS, ACILIS_MS + ILK_ARA_MS + ADIM_SAYISI * (ADIM_MS + ARA_MS));
  yakin(acilisGorunumu(ACILIS_MS, 300).R, 300);
  yakin(acilisGorunumu(ACILIS_BITIS, 300).R, 300 * 1.7 ** 5);
  yakin(acilisGorunumu(ACILIS_BITIS + 1000, 300).R, 300 * 1.7 ** 5);
  const ara = ACILIS_MS + ILK_ARA_MS + ADIM_MS;
  for (const t of [ara + 20, ara + ARA_MS - 20]) yakin(acilisGorunumu(t, 300).R, 300 * 1.7);
  let onceki = 0;
  for (let t = 0; t <= ACILIS_BITIS; t += 25) { const r = acilisGorunumu(t, 300).R; assert.ok(r >= onceki - 1e-9, `t=${t}`); onceki = r; }
});

test('etiketOlcegi: küre küçükken yazı küçük, büyüdükçe normal boy', () => {
  assert.equal(etiketOlcegi(100, 900), 0.55);
  assert.equal(etiketOlcegi(5000, 900), 1);
  const orta = etiketOlcegi(700, 900);
  assert.ok(orta > 0.55 && orta < 1, String(orta));
  assert.ok(etiketOlcegi(800, 900) > orta, 'tekdüze');
});

test('etiketKonumu: Türkiye ortadayken ekranın ortasında, arka yüzdeyken görünmez', () => {
  const m = etiketKonumu({ lon: TURKIYE_MERKEZI.lon, lat: TURKIYE_MERKEZI.lat, R: 300 }, 700, 450);
  yakin(m.x, 700); yakin(m.y, 450); assert.equal(m.gorunur, true);
  assert.equal(etiketKonumu({ lon: TURKIYE_MERKEZI.lon + 180, lat: -TURKIYE_MERKEZI.lat, R: 300 }, 700, 450).gorunur, false);
  const dogu = etiketKonumu({ lon: TURKIYE_MERKEZI.lon - 20, lat: TURKIYE_MERKEZI.lat, R: 300 }, 700, 450);
  assert.ok(dogu.x > 700, 'bakış batıdayken Türkiye sağda');
});

// Kürede Türkiye'ye dokununca harita açılır (2026-11-26)
const { ekrandanKonum, turkiyeIcindeMi } = require('../kure.js');

test('turkiyeIcindeMi: Türkiye içi ve dışı noktalar', () => {
  for (const [ad, lon, lat] of [['Ankara', 32.86, 39.93], ['İstanbul Fatih', 28.95, 41.01], ['Kadıköy', 29.03, 40.99],
    ['Gökçeada', 25.85, 40.18], ['Van', 43.38, 38.5], ['Hatay', 36.2, 36.2]]) assert.ok(turkiyeIcindeMi(lon, lat), ad);
  for (const [ad, lon, lat] of [['Atina', 23.73, 37.98], ['Karadeniz ortası', 34.0, 43.0], ['Lefkoşa', 33.36, 35.17],
    ['Şam', 36.29, 33.51], ['Tiflis', 44.79, 41.72], ['Sofya', 23.32, 42.7]]) assert.ok(!turkiyeIcindeMi(lon, lat), ad);
});

test('ekrandanKonum: ekran noktası → enlem/boylam; küre dışı null; ortografikle gidiş-dönüş', () => {
  const g = { lon: TURKIYE_MERKEZI.lon, lat: TURKIYE_MERKEZI.lat, R: 300 };
  const m = ekrandanKonum(700, 450, g, 700, 450);
  yakin(m.lon, g.lon); yakin(m.lat, g.lat);
  assert.equal(ekrandanKonum(700 + 301, 450, g, 700, 450), null);
  const o = ortografik(32.86, 39.93, g);
  const k = ekrandanKonum(700 + 300 * o.x, 450 - 300 * o.y, g, 700, 450);
  yakin(k.lon, 32.86, 1e-6); yakin(k.lat, 39.93, 1e-6);
});
