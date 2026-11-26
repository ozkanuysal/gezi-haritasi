# Gezi Haritası v1 Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Türkiye'yi 7 coğrafi bölgeye ayıran, bölgeye tıklayınca yakınlaşan, ile tıklayınca adını gösteren tek sayfalık gezi haritasını GitHub Pages'te yayınlamak.

**Architecture:** Kütüphanenin SVG haritası `index.html` içine olduğu gibi gömülür. Bölge verisi (`bolgeler.js`), saf mantık (`cekirdek.js`) ve DOM bağlama (`harita.js`) ayrı dosyalardır. Saf mantık bir durum makinesidir: `{bolge, plaka}` durumu olaylarla değişir, `harita.js` durumu ekrana çizer. Sonraki katmanlar bu durumun üstüne eklenir.

**Tech Stack:** Düz HTML, CSS, JavaScript (kütüphane yok, build yok). Testler Node 22 `node:test`. Görsel kontrol headless Edge. Yayın `gh` + GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-26-gezi-haritasi-design.md`

## Global Constraints

- Build adımı, npm bağımlılığı, sunucu, API anahtarı, Google servisi yok. Sayfa `file://` ile de açılır.
- SVG kaynağı: `dnomak/svg-turkiye-haritasi` (MIT, © 2015 Doğukan Güven Nomak); lisans metni repoda `lisanslar/svg-turkiye-haritasi-LICENSE` olarak birebir durur.
- Orijinal `viewBox`: `0 0 1007.478 527.323`.
- Bölge kimlikleri ve adları: `marmara` "Marmara Bölgesi", `ege` "Ege Bölgesi", `akdeniz` "Akdeniz Bölgesi", `ic-anadolu` "İç Anadolu Bölgesi", `karadeniz` "Karadeniz Bölgesi", `dogu-anadolu` "Doğu Anadolu Bölgesi", `guneydogu-anadolu` "Güneydoğu Anadolu Bölgesi".
- Sayfa başlığı "Gezi Haritası". Repo `ozkanuysal/gezi-haritasi`, adres `https://ozkanuysal.github.io/gezi-haritasi/`.
- Repo herkese açık: kişisel yol, e-posta ya da gizli bilgi girmez. Commit yazarı `ozkanuysal <61411331+ozkanuysal@users.noreply.github.com>`; commit'lerde Co-Authored-By ya da "Generated with Claude Code" satırı yok.
- Sayfa metinleri Türkçe ve tam Türkçe karakterli.

## Review Focus

1. **İstanbul'un iki parçası** (Asya, Avrupa; ikisi de plaka 34): ikisi tek il gibi davranır, kartta "İstanbul" yazar. Test: Task 2 `ilAdiSade`, Task 3 `svg.test.js`.
2. **Kıbrıs** (`kuzey-kibris` plaka 00, `guney-kibris` plakasız): gri, etiketsiz, tıklanınca hiçbir şey olmaz. Test: Task 2 `sonrakiDurum` plaka 0, Task 3 `svg.test.js`.
3. **Bozuk adres** (`#xyz`, `#`, boş): hata vermez, Türkiye görünümü açılır. Test: Task 2 `hashtenBolge`, `sonrakiDurum` hash olayı.
4. **Bölge açıkken başka bölgenin soluk iline tıklama:** o bölgeye geçer, il seçmez. Test: Task 2 `sonrakiDurum`.
5. **Telefon ekranı (390×844), fare yok:** harita genişliğe sığar, bölge adları taşmaz, yakınlaşma yalnızca dokunmayla çalışır. Test: Task 3 ekran görüntüsü `390x844`.

---

### Task 1: Repo ve bölge verisi

**Files:**
- Create: `bolgeler.js`, `tests/bolgeler.test.js`, `lisanslar/svg-turkiye-haritasi-LICENSE`, `.gitignore`
- Mevcut: `docs/superpowers/specs/…`, `docs/superpowers/plans/…` (bu plan)

**Interfaces:**
- Produces: global `BOLGELER` (Node'da `module.exports`):
  `Array<{ id: string, ad: string, renk: string, plakalar: number[] }>` — sıra Global Constraints'teki gibi.

- [ ] **Step 1: Repo'yu başlat**

```bash
cd ~/projeler/gezi-haritasi && git init -b main
git config user.name ozkanuysal
git config user.email 61411331+ozkanuysal@users.noreply.github.com
```

- [ ] **Step 2: Lisansı koy** — `https://raw.githubusercontent.com/dnomak/svg-turkiye-haritasi/master/LICENSE` dosyasını birebir `lisanslar/svg-turkiye-haritasi-LICENSE` olarak kaydet.

- [ ] **Step 3: Başarısız testi yaz** — `tests/bolgeler.test.js`

```js
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
```

- [ ] **Step 4: Çalıştır, başarısız olduğunu gör**
Run: `node --test tests/` — Expected: FAIL, `Cannot find module '../bolgeler.js'`.

- [ ] **Step 5: `bolgeler.js`'i yaz** — üstte kaynak yorumu (tr.wikipedia.org "Türkiye'nin illeri", Bölge sütunu, 2026-11-26). Plakalar:
  - marmara `[10, 11, 16, 17, 22, 34, 39, 41, 54, 59, 77]`
  - ege `[3, 9, 20, 35, 43, 45, 48, 64]`
  - akdeniz `[1, 7, 15, 31, 32, 33, 46, 80]`
  - ic-anadolu `[6, 18, 26, 38, 40, 42, 50, 51, 58, 66, 68, 70, 71]`
  - karadeniz `[5, 8, 14, 19, 28, 29, 37, 52, 53, 55, 57, 60, 61, 67, 69, 74, 78, 81]`
  - dogu-anadolu `[4, 12, 13, 23, 24, 25, 30, 36, 44, 49, 62, 65, 75, 76]`
  - guneydogu-anadolu `[2, 21, 27, 47, 56, 63, 72, 73, 79]`
  Renkler yapıcının seçimi: 7 ayrı, açık zeminde ayırt edilir, üstünde koyu yazı okunur. Dosya sonunda `if (typeof module === 'object') module.exports = BOLGELER;`.

- [ ] **Step 6: Testi çalıştır** — Run: `node --test tests/` — Expected: 3 test PASS.

- [ ] **Step 7: Commit**

```bash
git add . && git commit -m "Bölge verisi ve SVG lisansı eklendi"
```

### Task 2: Saf mantık (`cekirdek.js`)

**Files:**
- Create: `cekirdek.js`, `tests/cekirdek.test.js`

**Interfaces:**
- Consumes: `BOLGELER` (tarayıcıda global, Node'da `require('./bolgeler.js')`).
- Produces (global `GEZI`, Node'da `module.exports`):
  - `bolgeBul(plaka: number) -> string | null`
  - `ilAdiSade(ad: string) -> string` — sondaki " (…)" kısmını atar.
  - `hashtenBolge(hash: string) -> string | null` — `'#ege'` → `'ege'`; bilinmeyen ya da boş → `null`.
  - `sonrakiDurum(durum: {bolge: string|null, plaka: number|null}, olay) -> durum` — olay `{tur: 'tik', plaka}`, `{tur: 'geri'}` ya da `{tur: 'hash', hash}`. Girdiyi değiştirmez, yeni nesne döner.
  - `kutuBirlestir(kutular: Array<{x, y, width, height}>, bosluk: number) -> {x, y, width, height}`

- [ ] **Step 1: Başarısız testi yaz** — `tests/cekirdek.test.js`

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { bolgeBul, ilAdiSade, hashtenBolge, sonrakiDurum, kutuBirlestir } = require('../cekirdek.js');
const BOS = { bolge: null, plaka: null };

test('bolgeBul', () => {
  assert.equal(bolgeBul(35), 'ege');
  assert.equal(bolgeBul(34), 'marmara');
  assert.equal(bolgeBul(0), null);
  assert.equal(bolgeBul(82), null);
});

test('ilAdiSade', () => {
  assert.equal(ilAdiSade('İstanbul (Asya)'), 'İstanbul');
  assert.equal(ilAdiSade('İstanbul (Avrupa)'), 'İstanbul');
  assert.equal(ilAdiSade('Ağrı'), 'Ağrı');
});

test('hashtenBolge', () => {
  assert.equal(hashtenBolge('#ege'), 'ege');
  assert.equal(hashtenBolge('#guneydogu-anadolu'), 'guneydogu-anadolu');
  for (const h of ['', '#', '#xyz', '#EGE']) assert.equal(hashtenBolge(h), null);
});

test('sonrakiDurum: tıklamalar', () => {
  assert.deepEqual(sonrakiDurum(BOS, { tur: 'tik', plaka: 35 }), { bolge: 'ege', plaka: null });
  const ege = { bolge: 'ege', plaka: null };
  assert.deepEqual(sonrakiDurum(ege, { tur: 'tik', plaka: 35 }), { bolge: 'ege', plaka: 35 });
  assert.deepEqual(sonrakiDurum(ege, { tur: 'tik', plaka: 7 }), { bolge: 'akdeniz', plaka: null });
  assert.deepEqual(sonrakiDurum(ege, { tur: 'tik', plaka: 0 }), ege);
  assert.deepEqual(sonrakiDurum(BOS, { tur: 'tik', plaka: 0 }), BOS);
});

test('sonrakiDurum: geri ve adres', () => {
  assert.deepEqual(sonrakiDurum({ bolge: 'ege', plaka: 35 }, { tur: 'geri' }), BOS);
  assert.deepEqual(sonrakiDurum(BOS, { tur: 'hash', hash: '#karadeniz' }), { bolge: 'karadeniz', plaka: null });
  assert.deepEqual(sonrakiDurum({ bolge: 'ege', plaka: 35 }, { tur: 'hash', hash: '#xyz' }), BOS);
});

test('sonrakiDurum girdiyi değiştirmez', () => {
  const d = { bolge: 'ege', plaka: null };
  sonrakiDurum(d, { tur: 'tik', plaka: 35 });
  assert.deepEqual(d, { bolge: 'ege', plaka: null });
});

test('kutuBirlestir', () => {
  assert.deepEqual(
    kutuBirlestir([{ x: 10, y: 20, width: 30, height: 40 }, { x: 50, y: 5, width: 10, height: 10 }], 5),
    { x: 5, y: 0, width: 60, height: 65 });
});
```

- [ ] **Step 2: Çalıştır, başarısız olduğunu gör** — Run: `node --test tests/` — Expected: FAIL, `Cannot find module '../cekirdek.js'`.

- [ ] **Step 3: `cekirdek.js`'i yaz** — Interfaces'teki imzalarla. `BOLGELER`'i `typeof require === 'function' ? require('./bolgeler.js') : window.BOLGELER` ile al; sonda `const GEZI = {…}; if (typeof module === 'object') module.exports = GEZI;`.

- [ ] **Step 4: Testleri çalıştır** — Run: `node --test tests/` — Expected: tüm testler PASS.

- [ ] **Step 5: Commit**

```bash
git add cekirdek.js tests/cekirdek.test.js && git commit -m "Harita durum mantığı ve testleri"
```

### Task 3: Sayfa (`index.html`, `harita.css`, `harita.js`)

**Files:**
- Create: `index.html`, `harita.css`, `harita.js`, `tests/svg.test.js`, `tests/ekran.sh`

**Interfaces:**
- Consumes: `BOLGELER` (Task 1), `GEZI` (Task 2).
- Produces: `index.html` script sırası `bolgeler.js`, `cekirdek.js`, `harita.js`. Sonraki katmanlar `harita.js` içindeki `ciz(durum)` fonksiyonuna bağlanır.

- [ ] **Step 1: Başarısız testi yaz** — `tests/svg.test.js`

```js
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
```

- [ ] **Step 2: Çalıştır, başarısız olduğunu gör** — Run: `node --test tests/` — Expected: FAIL, `ENOENT … index.html`.

- [ ] **Step 3: `index.html`'i yaz** — `<html lang="tr">`, başlık "Gezi Haritası", üst şerit (başlık + "Türkiye" geri düğmesi, Türkiye görünümünde gizli), harita kabı, il kartı, fare etiketi, üç `<script src>`. Kütüphanenin `index.html`'indeki `<svg id="svg-turkiye-haritasi" …>…</svg>` bloğunu değiştirmeden araya kopyala (tek seferlik betik scratchpad'de durur, repoya girmez). Sayfa altında küçük not: harita kaynağı ve MIT lisansı.

- [ ] **Step 4: `harita.css` ve `harita.js`'i yaz** — davranış:
  - Açılışta her il grubuna `data-bolge` ve bölge rengi verilir (JS, `BOLGELER`'den); Kıbrıs grupları gri, `pointer-events: none`.
  - Türkiye görünümü: bölge adları SVG `<text>` olarak bölgenin ortasında; fare bir ilin üstüne gelince bütün bölge koyulaşır, etikette bölge adı.
  - Bölge açık: `viewBox` bölgenin `kutuBirlestir(…, 20)` kutusuna ~500 ms `requestAnimationFrame` geçişle gider; diğer bölgeler soluk; bölge adları gizli; fare etiketinde `ilAdiSade(data-iladi)`.
  - İl seçili: il koyu kenarlı vurgulanır (İstanbul'da iki parça birlikte), kartta il adı ve bölge adı.
  - Olaylar `sonrakiDurum`'dan geçer; bölge değişince `location.hash` güncellenir (`#ege`, Türkiye için boş); `hashchange` ve açılıştaki hash `{tur: 'hash'}` olayıdır. Tüm çizim tek `ciz(durum)` fonksiyonunda.
  - Hover'a bağlı hiçbir zorunlu işlem yok; dokunma `click` ile çalışır.

- [ ] **Step 5: Testleri çalıştır** — Run: `node --test tests/` — Expected: tüm testler PASS.

- [ ] **Step 6: `tests/ekran.sh`'i yaz** — `ekran.sh <hash> <GxY> <cikti.png>`: site dosyalarını `${ONIZLEME_DIZIN:-/mnt/c/Users/$USER/AppData/Local/Temp/gezi-onizleme}` altına kopyalar, `msedge.exe --headless=new --disable-gpu --hide-scrollbars --window-size=<G,Y> --virtual-time-budget=4000 --user-data-dir=<o dizinde profil> --screenshot=<win yolu> file:///…/index.html#<hash>` çalıştırır, PNG'yi `<cikti.png>`'ye taşır. PNG yoksa `C:\VTRoot\HarddiskVolume3\…` altında aynı adı arar ve bulursa onu kullanır (COMODO). `ADRES` ortam değişkeni verilirse dosya kopyalamaz, `ADRES#<hash>`'i çeker. Kişisel yol yazmaz.

- [ ] **Step 7: Görsel kontrol** — üç görüntü al ve oku:
  - `tests/ekran.sh "" 1440x900 turkiye.png` — 7 renk, 7 bölge adı her biri kendi bölgesinin üstünde, Kıbrıs gri.
  - `tests/ekran.sh ege 1440x900 ege.png` — Ege büyük, diğerleri soluk, "Türkiye" düğmesi görünür.
  - `tests/ekran.sh karadeniz 390x844 telefon.png` — harita genişliğe sığar, yazı taşmaz.
  Expected: üçü de tarif edildiği gibi. Bölge adı başka bölgeye düşüyorsa `bolgeler.js`'e o bölge için `etiket: {x, y}` ekle, `ciz`'de varsa onu kullan, görüntüyü yeniden al.

- [ ] **Step 8: Commit**

```bash
git add . && git commit -m "Bölge haritası sayfası: yakınlaşma, il kartı, adres bağlantısı"
```

### Task 4: README ve yayın

**Files:**
- Create: `README.md`

- [ ] **Step 1: `README.md`** — ne olduğu (1–2 cümle), canlı adres, yerelde açma (`index.html` çift tık), test (`node --test tests/`), harita kaynağı ve MIT lisans notu.

- [ ] **Step 2: Commit** — `git add README.md && git commit -m "README"`

- [ ] **Step 3: Kullanıcı onayı** — "`ozkanuysal/gezi-haritasi` herkese açık repo olarak açılacak ve Pages'te yayınlanacak" de; onay gelmeden sonraki adıma geçme.

- [ ] **Step 4: Yayınla**

```bash
gh repo create ozkanuysal/gezi-haritasi --public --source . --push --description "Türkiye 7 bölge gezi haritası"
gh api -X POST repos/ozkanuysal/gezi-haritasi/pages -f 'source[branch]=main' -f 'source[path]=/'
```

- [ ] **Step 5: Canlı doğrulama** — `curl -s -o /dev/null -w '%{http_code}' https://ozkanuysal.github.io/gezi-haritasi/` kısa aralıklarla (her biri ≤30 sn) `200` görene kadar; sonra `ADRES=https://ozkanuysal.github.io/gezi-haritasi/ tests/ekran.sh ege 1440x900 canli.png` ile görüntü al ve oku. Expected: `200` ve Ege yakınlaşmış görünüm.
