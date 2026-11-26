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
