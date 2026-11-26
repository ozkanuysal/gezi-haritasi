const test = require('node:test');
const assert = require('node:assert/strict');
const IL_HARITALARI = require('../iller/34.js');
const { projeksiyon } = require('../cekirdek.js');
const GEZILER = require('../geziler.js');
const il = IL_HARITALARI[34];

// 'M x,y L x,y ... Z' → halkalar
const halkalar = d => d.split('M').filter(Boolean).map(h =>
  h.replace(/Z/g, '').trim().split(/\s*L\s*/).map(n => n.split(',').map(Number)));

const icinde = ([x, y], d) => {
  let ic = false;
  for (const halka of halkalar(d)) {
    for (let i = 0, j = halka.length - 1; i < halka.length; j = i++) {
      const [xi, yi] = halka[i], [xj, yj] = halka[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ic = !ic;
    }
  }
  return ic;
};

test('İstanbul: 39 ilçe, genişlik 1000, tüm noktalar kutuda', () => {
  assert.equal(il.ilceler.length, 39);
  assert.equal(il.genislik, 1000);
  const adlar = il.ilceler.map(i => i.ad);
  for (const a of ['Eyüpsultan', 'Kadıköy', 'Adalar']) assert.ok(adlar.includes(a), a);
  for (const { d } of il.ilceler) for (const h of halkalar(d)) for (const [x, y] of h) {
    assert.ok(x >= 0 && x <= il.genislik && y >= 0 && y <= il.yukseklik, `${x},${y}`);
  }
});

test('Santral İstanbul iğnesi Eyüpsultan içinde, Kadıköy dışında', () => {
  const { enlem, boylam } = GEZILER[0].konum;
  const n = projeksiyon(enlem, boylam, il.projeksiyon);
  const d = ad => il.ilceler.find(i => i.ad === ad).d;
  assert.ok(icinde([n.x, n.y], d('Eyüpsultan')));
  assert.ok(!icinde([n.x, n.y], d('Kadıköy')));
});

test('Konya: ilçeler, iğne Karatay içinde', () => {
  const konya = require('../iller/42.js')[42];
  const adlar = konya.ilceler.map(i => i.ad);
  assert.equal(konya.ilceler.length, 31);
  for (const a of ['Karatay', 'Meram', 'Selçuklu']) assert.ok(adlar.includes(a), a);
  const g = GEZILER.find(x => x.plaka === 42);
  const n = projeksiyon(g.konum.enlem, g.konum.boylam, konya.projeksiyon);
  assert.ok(icinde([n.x, n.y], konya.ilceler.find(i => i.ad === 'Karatay').d));
});
