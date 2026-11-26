// Sayfa düzeni ve dokunma davranışı için statik kontroller (tarayıcı olmadan).
// Gerçek davranış ekran görüntüsü ve cihazda kontrol edilir.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const oku = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const css = oku('harita.css');
const js = oku('harita.js');
const html = oku('index.html').replace(/<svg[^>]*id="svg-turkiye-haritasi"[\s\S]*?<\/svg>/, '');

test('dokunmada yapışan hover yok: :hover kuralı yalnızca (hover: hover) içinde', () => {
  const disarida = css.replace(/@media \(hover: hover\) \{[\s\S]*?\n\}/g, '');
  assert.ok(!/:hover/.test(disarida.replace(/#geri:hover[^}]*\}/, '')), 'harita :hover kuralı medya sorgusu dışında');
  assert.match(css, /@media \(hover: hover\) \{[\s\S]*g\[data-bolge\]:hover/);
});

test('fare yazısı yalnızca fareyle: pointer olayları, mouse dışı tür yok sayılır', () => {
  assert.ok(!/'mouse(over|move|out|leave)'/.test(js), 'mouse* olayı kaldı');
  assert.match(js, /'pointerover'/);
  assert.match(js, /pointerType !== 'mouse'/);
});

test('il kartı haritanın üstündeki araç çubuğunda, harita ekran yüksekliğiyle sınırlı', () => {
  assert.match(html, /<div class="arac-cubugu">[\s\S]*id="kart"[\s\S]*?<\/div>\s*<div class="harita">/);
  assert.match(css, /\.harita svg \{[^}]*max-height:/);
});

// v2 (2026-11-26): kullanıcı istekleri
test('açılışta Açı Schools ekranı: logo ve yazı', () => {
  assert.match(html, /<div id="acilis"[^>]*>[\s\S]*src="gorseller\/aci-logo\.png"[\s\S]*Açı Schools[\s\S]*?<\/div>/);
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'gorseller', 'aci-logo.png')));
  assert.match(js, /acilis/);
});

test('kaldırılan yazılar: alt başlık, sol "Türkiye", harita kaynağı satırı', () => {
  assert.ok(!html.includes('Bir bölge seç'), 'alt başlık duruyor');
  assert.ok(!/id="bolge-basligi">Türkiye</.test(html), 'sol Türkiye yazısı duruyor');
  assert.ok(!/baslik\.textContent = [^;]*'Türkiye'/.test(js), 'Türkiye görünümünde başlık yazılıyor');
  assert.ok(!html.includes('<footer'), 'harita kaynağı satırı duruyor');
});

test('bölge adları lacivert zemin üstünde (v3: lacivert yazı da net değildi)', () => {
  assert.match(css, /\.bolge-zemin \{[^}]*fill: #002d72/);
  assert.match(css, /\.bolge-adi \{[^}]*fill: #fff/);
  assert.match(js, /createElementNS\(SVG_NS, 'rect'\)/);
});

test('sayfanın kullandığı görseller git\'te izleniyor (yayına gidiyor)', () => {
  const { execFileSync } = require('node:child_process');
  const izlenen = execFileSync('git', ['ls-files'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).split('\n');
  const kaynaklar = [
    ...oku('index.html').matchAll(/src="([^"]+\.(?:png|jpe?g|svg|webp))"/g),
    ...oku('geziler.js').matchAll(/dosya: '([^']+)'/g),
  ];
  for (const [, src] of kaynaklar) {
    assert.ok(izlenen.includes(src), `${src} git'te yok`);
  }
});

// İl ekranı (2026-11-26)
test('il ekranı ve OSM atfı sayfada', () => {
  assert.match(html, /id="il-ekrani"/);
  assert.match(html, /href="https:\/\/www\.openstreetmap\.org\/copyright"/);
  assert.match(html, /© OpenStreetMap katkıcıları/);
});

test('betik sırası: bolgeler, geziler, iller/34, cekirdek, harita', () => {
  const sira = ['bolgeler.js', 'geziler.js', 'iller/34.js', 'cekirdek.js', 'harita.js'].map(f => html.indexOf(`src="${f}"`));
  assert.ok(sira.every(i => i > 0), sira.join());
  assert.ok(sira.every((i, k) => k === 0 || sira[k - 1] < i), sira.join());
});

test('fotoğraf kutusu sabit oranlı (yüklenmezse yerleşim zıplamaz)', () => {
  assert.match(css, /\.gezi-foto \{[^}]*aspect-ratio:/);
});

test('ciz: harita görünür yapılmadan etiket zeminleri ölçülmez (il ekranından Türkiye\'ye dönüş)', () => {
  const govde = js.slice(js.indexOf('function ciz('), js.indexOf('function uygula('));
  const gorunur = govde.indexOf('haritaKutusu.hidden');
  const olcum = govde.indexOf('zeminleriBoyutla()');
  assert.ok(gorunur > 0 && olcum > 0 && gorunur < olcum, `görünürlük ${gorunur}, ölçüm ${olcum}`);
});

test('başlık: Açı Schools 2026-2027 Gezi Haritası', () => {
  assert.match(html, /<h1>Açı Schools 2026-2027 Gezi Haritası<\/h1>/);
  assert.match(html, /<title>Açı Schools 2026-2027 Gezi Haritası<\/title>/);
});

// 2026-11-26: bölge görünümünde il etiketi; il ekranında büyük harita
test('il etiketi bölge görünümünde de görünür (yalnızca o bölgenin illeri), boyu sabit', () => {
  assert.ok(!/\.bolge-acik \.il-etiketleri \{ display: none/.test(css), 'bölge açıkken etiketler gizleniyor');
  assert.match(js, /classList\.toggle\('gizli'/);
  assert.match(css, /\.il-etiketi\.gizli \{ display: none/);
  assert.match(js, /scale\(\$\{/); // yakınlaşmada ters ölçek
});

test('il ekranında harita sol tarafı kaplar: geniş sol sütun, kartın boyunca uzayan kutu', () => {
  assert.match(css, /\.il-ekrani \{[^}]*grid-template-columns: minmax\(0, 2fr\) minmax\(320px, 1fr\)/);
  // Kart uzun olsa da harita ekranda bütün görünsün: kutu ekran yüksekliğinde ve yerinde sabit (Konya, 2026-11-26).
  assert.match(css, /\.il-harita-kutusu \{[^}]*position: sticky/);
  assert.match(css, /\.il-harita-kutusu \{[^}]*height: calc\(100vh/);
  assert.match(css, /body\.il-modu main \{[^}]*max-width:/);
  assert.match(js, /classList\.toggle\('il-modu'/);
});

test('her gezili il için ilçe haritası dosyası ve script satırı var', () => {
  for (const plaka of new Set(require('../geziler.js').map(g => g.plaka))) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'iller', `${plaka}.js`)), `iller/${plaka}.js yok`);
    const i = html.indexOf(`src="iller/${plaka}.js"`);
    assert.ok(i > 0 && i < html.indexOf('src="cekirdek.js"'), `iller/${plaka}.js script satırı yok ya da cekirdek.js'ten sonra`);
  }
});
