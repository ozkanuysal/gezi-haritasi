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
test('açılışta Açı Okulları ekranı: logo ve yazı', () => {
  assert.match(html, /<div id="acilis"[^>]*>[\s\S]*src="gorseller\/aci-logo\.png"[\s\S]*Açı Okulları[\s\S]*?<\/div>/);
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
    ...oku('kure.js').matchAll(/'(gorseller\/[^']+)'/g),
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

test('başlık: Açı Okulları 2026-2027 Gezi Haritası', () => {
  assert.match(html, /<h1>Açı Okulları 2026-2027 Gezi Haritası<\/h1>/);
  assert.match(html, /<title>Açı Okulları 2026-2027 Gezi Haritası<\/title>/);
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

// Küre açılışı (2026-11-26)
test('küre katmanı, iki tuval ve betik sırası', () => {
  for (const id of ['kure', 'kure-yildiz', 'kure-tuval']) assert.match(html, new RegExp(`id="${id}"`), id);
  const i = f => html.indexOf(`src="${f}"`);
  assert.ok(i('cekirdek.js') > 0 && i('cekirdek.js') < i('kure.js') && i('kure.js') < i('harita.js'));
  assert.match(js, /KURE\.baslat\(/);
  assert.match(oku('kure.js'), /'gorseller\/dunya\.jpg'/);
});

// Küre sağlamlaştırma (gözden geçirme, 2026-11-26)
test('küre: yavaş/başarısız dokuda yumuşak çıkış, kısa bekleme, atlanınca doku yüklenmez', () => {
  const k = oku('kure.js');
  assert.match(k, /if \(hata\) return bitir\(true\)/);
  assert.match(k, /> bekleSiniri \? bitir\(true\)/);
  assert.match(k, /const BEKLEME_MS = 800;/);
  assert.match(k, /yildizlariCiz\(\);\s*\n\s*\/\/ Dokular/);
});

test('küre: bekçi — baslat hiç çağrılmazsa ya da kare hata verirse katman kalkar', () => {
  const k = oku('kure.js');
  assert.match(k, /setTimeout\(\(\) => \{ if \(!basladi\) bitir\(true\); \}, 8000\)/);
  assert.match(k, /catch \(e\) \{ return bitir\(true\); \}/);
});

test('küre: kutup arkasındaki dikişte mip sapması bastırılır', () => {
  assert.match(oku('kure.js'), /abs\(fark\) > 175\.0 \? -16\.0 : 0\.0/);
});

// İl ekranında sağ üstte Türkiye haritasına dönüş simgesi (2026-11-26)
test('il ekranında harita simgesi: Türkiye görünümüne döner', () => {
  assert.match(html, /<button id="turkiyeye-don"[^>]*aria-label="Türkiye haritasına dön"[^>]*hidden[^>]*>\s*<svg/);
  assert.match(js, /turkiyeyeDon\.hidden = !ilde;/);
  assert.match(js, /turkiyeyeDon\.addEventListener\('click', \(\) => uygula\(\{ tur: 'geri' \}\)\)/);
  assert.match(css, /#turkiyeye-don, #kureyi-ac \{[^}]*margin-left: auto/);
});

// Türkiye görünümünde dünya simgesi: küreyi yeniden oynatır (2026-11-26)
test('Türkiye görünümünde dünya simgesi küreyi yeniden açar', () => {
  assert.match(html, /<button id="kureyi-ac"[^>]*aria-label="Dünya küresini aç"[^>]*hidden[^>]*>\s*<svg/);
  assert.match(js, /kureyiAc\.hidden = !!bolge \|\| !KURE\.destekleniyor\(\);/);
  assert.match(js, /kureyiAc\.addEventListener\('click', \(\) => KURE\.ac\(\)\)/);
});

test('küre katmanı bitince silinmez, gizlenir; tekrar oynatılabilir', () => {
  const k = oku('kure.js');
  assert.ok(!/katman\.remove\(\)/.test(k), 'katman siliniyor');
  assert.match(k, /katman\.hidden = true/);
  assert.match(k, /function ac\(\)/);
  assert.match(k, /return \{ baslat, ac, destekleniyor \}/);
});

test('etkileşimli küre: çıkış simgesi katmanın içinde; Esc, tekerlek ve sürükleme dinleniyor', () => {
  assert.match(html, /<div id="kure"[^>]*>[\s\S]*<button id="kureden-cik"[^>]*aria-label="Türkiye haritasına dön"[^>]*hidden[\s\S]*?<\/div>/);
  const k = oku('kure.js');
  assert.match(k, /e\.key === 'Escape'/);
  assert.match(k, /addEventListener\('wheel'/);
  assert.match(k, /addEventListener\('pointerdown'/);
  assert.match(css, /\.kure\.etkilesimli \{[^}]*touch-action: none/);
});

test('etkileşimli kürede Türkiye adı: katmanın içinde, her karede konumlanır', () => {
  assert.match(html, /<div id="kure"[^>]*>[\s\S]*<div id="kure-turkiye" class="kure-turkiye" hidden>Türkiye<\/div>/);
  assert.match(oku('kure.js'), /etiketKonumu\(gorunum, gen\(\) \/ 2, yuk\(\) \/ 2\)/);
  assert.match(oku('kure.js'), /scale\(\$\{etiketOlcegi\(gorunum\.R, Math\.min\(gen\(\), yuk\(\)\)\)\}\)/);
  assert.match(oku('kure.js'), /const enBuyukR = \(\) => Math\.min\(gen\(\), yuk\(\)\) \* 10;/);
  assert.match(css, /\.kure-turkiye \{[^}]*pointer-events: none/);
});

test('kürede Türkiye\'ye dokunuş haritayı açar: sınır verisi yüklü, dokunuş denetleniyor', () => {
  const i = f => html.indexOf(`src="${f}"`);
  assert.ok(i('turkiye-sinir.js') > 0 && i('turkiye-sinir.js') < i('kure.js'));
  assert.match(oku('kure.js'), /turkiyeIcindeMi\(k\.lon, k\.lat\)\) kapat\(\)/);
});

test('sayfada artık "Açı Schools" yok, "Açı Okulları" var (2026-11-26)', () => {
  const tam = oku('index.html');
  assert.ok(!tam.includes('Açı Schools'));
  assert.match(tam, /aria-label="Açı Okulları"/);
  assert.match(tam, /<p class="acilis-yazi">Açı Okulları<\/p>/);
});
