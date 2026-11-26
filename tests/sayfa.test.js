// Sayfa düzeni ve dokunma davranışı için statik kontroller (tarayıcı olmadan).
// Gerçek davranış ekran görüntüsü ve cihazda kontrol edilir.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const oku = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const css = oku('harita.css');
const js = oku('harita.js');
const html = oku('index.html').replace(/<svg[\s\S]*<\/svg>/, '');

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

test('bölge adları beyaz kenarsız, koyu ve kalın', () => {
  const kural = css.match(/\.bolge-adi \{[^}]*\}/)[0];
  assert.ok(!/stroke: rgba\(255, 255, 255/.test(kural), 'beyaz kenar duruyor');
  assert.match(kural, /font-weight: 800/);
  assert.match(kural, /fill: #002d72/);
});
