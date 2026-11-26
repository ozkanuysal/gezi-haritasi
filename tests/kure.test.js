const test = require('node:test');
const assert = require('node:assert/strict');
const { TURKIYE, SURE, ortografik, turkiyeyeOturt, cizelge, oynatilsinMi } = require('../kure.js');

const MERKEZ = { lon: (TURKIYE.bati + TURKIYE.dogu) / 2, lat: (TURKIYE.guney + TURKIYE.kuzey) / 2 };
const yakin = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);

test('Türkiye sınırları ve süre', () => {
  assert.deepEqual(TURKIYE, { bati: 25.67, dogu: 44.82, guney: 35.82, kuzey: 42.10 });
  assert.equal(SURE, 3800); // 2026-11-26: tek akıcı uçuş (dönüş 0–2200, yakınlaşma 1300–3500, kayboluş 3350–3800)
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
  assert.equal(cizelge(3300, bas, son).opaklik, 1);
  // Dönüş ortak sürenin (DONUS_MS) sonunda tamamlanır; hız isteğe göre değişti (yavaşlat → hızlandır).
  yakin(cizelge(require('../kure.js').DONUS_MS, bas, son).lon, son.lon);
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

test('acilisGorunumu: başta 150° batıda, sonda Türkiye ortada', () => {
  assert.deepEqual(TURKIYE_MERKEZI, MERKEZ);
  const b = acilisGorunumu(0, 300);
  yakin(b.lon, MERKEZ.lon - 150); yakin(b.lat, 15); assert.equal(b.R, 300);
  const s = acilisGorunumu(ACILIS_MS + 100, 300);
  yakin(s.lon, MERKEZ.lon); yakin(s.lat, MERKEZ.lat);
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
const { YAKINLASMA_KATI, YAKIN_BAS, ACILIS_BITIS, etiketKonumu, etiketOlcegi } = require('../kure.js');

test('simgeyle açılan küre: dönüş bitmeden başlayan tek akıcı yakınlaşma, duraklama yok', () => {
  const { DONUS_MS } = require('../kure.js');
  yakin(YAKINLASMA_KATI, 1.7 ** 5); // son yakınlık eskisiyle aynı
  assert.ok(YAKIN_BAS < DONUS_MS, 'yakınlaşma dönüş bitmeden başlar');
  yakin(acilisGorunumu(YAKIN_BAS, 300).R, 300);
  yakin(acilisGorunumu(ACILIS_BITIS, 300).R, 300 * 1.7 ** 5);
  yakin(acilisGorunumu(ACILIS_BITIS + 1000, 300).R, 300 * 1.7 ** 5);
  // Yakınlaşma boyunca hiç durmaz: her 40 ms'de yarıçap büyür.
  for (let t = YAKIN_BAS + 40; t < ACILIS_BITIS; t += 40) {
    assert.ok(acilisGorunumu(t, 300).R > acilisGorunumu(t - 40, 300).R + 1e-9, `t=${t}`);
  }
});

test('iki küre aynı uçuşu kullanır: yakınlaşma oranı her anda aynı', () => {
  const son = { R: 300 * 1.7 ** 5, cx: 700, cy: 450, lon: TURKIYE_MERKEZI.lon, lat: TURKIYE_MERKEZI.lat };
  const bas = { R: 300, cx: 700, cy: 450 };
  for (const t of [0, 1000, 1500, 2200, 2800, 3400]) yakin(cizelge(t, bas, son).R, acilisGorunumu(t, 300).R, 1e-6);
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

// 2026-11-26: Ctrl+F5 açılışındaki dönüş hızı ile dünya simgesiyle açılan kürenin dönüş hızı aynı
const { DONUS_MS } = require('../kure.js');

test('açılış küresi ve simgeyle açılan küre aynı hızda döner', () => {
  assert.equal(ACILIS_MS, DONUS_MS);
  assert.ok(DONUS_MS < 3400, 'dönüş hızlandı (2026-11-26)');
  const son = { R: 4000, cx: 650, cy: 420, lon: TURKIYE_MERKEZI.lon, lat: TURKIYE_MERKEZI.lat };
  const bas = { R: 300, cx: 700, cy: 450 };
  for (const t of [0, 500, 1200, 2000, 2800, DONUS_MS]) {
    const a = cizelge(t, bas, son), b = acilisGorunumu(t, 300);
    yakin(a.lon, b.lon); yakin(a.lat, b.lat);
  }
});

// Yurt dışı geziler (2026-11-26): ülke işaretleri ve karta tıklayınca o tarafa dönüş
const { noktaKonumu, gezininMerkezi, gecisGorunumu } = require('../kure.js');

test('noktaKonumu: bakış merkezindeki nokta ekran ortasında, arka yüz görünmez', () => {
  const g = { lon: 10, lat: 51, R: 300 };
  const m = noktaKonumu(10, 51, g, 700, 450);
  yakin(m.x, 700); yakin(m.y, 450); assert.equal(m.gorunur, true);
  assert.equal(noktaKonumu(-170, -51, g, 700, 450).gorunur, false);
  assert.ok(noktaKonumu(15, 51, g, 700, 450).x > 700);
  const t = etiketKonumu({ lon: 35, lat: 39, R: 300 }, 700, 450), n = noktaKonumu(TURKIYE_MERKEZI.lon, TURKIYE_MERKEZI.lat, { lon: 35, lat: 39, R: 300 }, 700, 450);
  yakin(t.x, n.x); yakin(t.y, n.y);
});

test('gezininMerkezi: ülkelerin ortalaması', () => {
  const m = gezininMerkezi([{ konum: { enlem: 50, boylam: 10 } }, { konum: { enlem: 52, boylam: 6 } }]);
  yakin(m.lat, 51); yakin(m.lon, 8);
});

test('gecisGorunumu: başta g0, sonda g1; boylam kısa yoldan, yarıçap logaritmik', () => {
  const g0 = { lon: 35, lat: 39, R: 300 }, g1 = { lon: 8, lat: 51.7, R: 1200 };
  assert.deepEqual(gecisGorunumu(g0, g1, 0, 900), g0);
  const s = gecisGorunumu(g0, g1, 900, 900); yakin(s.lon, 8); yakin(s.lat, 51.7); yakin(s.R, 1200);
  yakin(gecisGorunumu(g0, g1, 450, 900).R, 600); // ortada geometrik ortalama
  const k = gecisGorunumu({ lon: 170, lat: 0, R: 100 }, { lon: -170, lat: 0, R: 100 }, 450, 900);
  assert.ok(Math.abs(Math.abs(k.lon) - 180) < 1e-9, `kısa yol 180'den geçer: ${k.lon}`);
});

test('ulkeyeYakinlas: ülkenin ortasına, kısa kenarın 6 katı yarıçapla', () => {
  const { ulkeyeYakinlas } = require('../kure.js');
  assert.deepEqual(ulkeyeYakinlas({ konum: { enlem: 51.2, boylam: 10.4 } }, 900), { lon: 10.4, lat: 51.2, R: 5400 });
});
