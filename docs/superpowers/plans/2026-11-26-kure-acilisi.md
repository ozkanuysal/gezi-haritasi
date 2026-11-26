# Küre Açılışı Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Açı ekranından sonra NASA görüntülü Dünya küresinin dönüp Türkiye'ye yakınlaşması ve haritaya hizalı geçiş (yalnızca ana sayfa açılışında).

**Architecture:** `kure.js` iki katman: saf hesap (`KURE_HESAP`, Node'da test) ve tarayıcı katmanı (`KURE`: WebGL çizimi, oynatma). `harita.js` Açı ekranı kapanırken `KURE.baslat(hedefKutu)` çağırır.

**Tech Stack:** Düz JS + WebGL1 (kütüphanesiz), ffmpeg (doku hazırlama, bir kez), Node `node:test`, headless Edge.

**Spec:** `docs/superpowers/specs/2026-11-26-kure-acilisi-design.md`

## Global Constraints
- Dış servis yok; dokular repoda (`gorseller/dunya.jpg` 4096×2048, `gorseller/turkiye-uydu.jpg` 2048×1024 = 20°D–50°D, 30°K–45°K).
- Türkiye sınırları: batı 25.67, doğu 44.82, güney 35.82, kuzey 42.10.
- Küre süresi 2600 ms; görünürlük 2150 ms'den sonra 0'a iner.
- Commit'lerde Claude satırı yok.

## Review Focus
1. Adreste `#…` varken küre oynamaz, sayfa doğrudan hedefe gider. Test: `oynatilsinMi`.
2. "Hareketi azalt" / WebGL yok / doku yüklenemedi: küre katmanı kaldırılır, harita görünür, hata yok. Test: `oynatilsinMi`; doku hatası kod incelemesi.
3. Dokununca hemen biter (yarım kalan animasyon katmanı ekranda kalmaz).
4. Telefon (dikey ekran): küre ekrana sığar, son karede Türkiye haritayla hizalı.
5. Dönen kürede doku dikişi (180° boylam) ve Türkiye kırpıntısının kenarında belirgin çizgi yok. Test: ekran görüntüsü.

---

### Task 1: Saf hesap ve dokular
**Files:** Create `kure.js` (yalnızca `KURE_HESAP` kısmı), `tests/kure.test.js`, `gorseller/dunya.jpg`, `gorseller/turkiye-uydu.jpg`
**Produces:** `KURE_HESAP = { TURKIYE, SURE, ortografik(lon, lat, merkez) -> {x, y, gorunur}, turkiyeyeOturt(kutu) -> {R, cx, cy}, cizelge(t, bas, son) -> {lon, lat, R, cx, cy, opaklik}, oynatilsinMi({hash, azHareket, webgl}) -> boolean }`
- [ ] Testler: `ortografik(35.245, 38.96, merkez)` = `{x: 0, y: 0, gorunur: true}`; ters yarıküredeki nokta `gorunur: false`; `turkiyeyeOturt({left: 100, top: 50, width: 1000, height: 430})` için `R * (x(doğu) − x(batı)) = 1000`, `cx = 600`, `cy = 265`; `cizelge(0)` başlangıç (`lon = son.lon − 150`, `R = bas.R`, `opaklik = 1`), `cizelge(SURE)` = son değerler ve `opaklik = 0`; `R` tekdüze artar; `oynatilsinMi`: `''`/`'#'` + hareket var + webgl → true; `'#marmara/34'`, `azHareket`, `webgl: false` → false.
- [ ] `node --test` → FAIL; uygula; PASS.
- [ ] ffmpeg: `dunya-5400.jpg` → 4096×2048 (`-q:v 4`); C1 karosundan 20–50°D, 30–45°K kırp → 2048×1024. Boyutları `ffprobe` ile doğrula.
- [ ] Commit.

### Task 2: Çizim ve akış
**Files:** Modify `kure.js` (tarayıcı katmanı), `index.html` (`#kure` katmanı, `kure.js` script), `harita.css`, `harita.js` (Açı ekranı kapanınca `KURE.baslat`), `tests/sayfa.test.js`
- [ ] Testler (statik): `#kure` katmanı ve iki tuval sayfada; `kure.js` `cekirdek.js`'ten sonra, `harita.js`'ten önce; `harita.js` `KURE.baslat(` çağırıyor; görseller git'te testi `kure.js`'teki doku yollarını da tarar.
- [ ] WebGL: tam ekran dörtgen, parça gölgelendiricisi: piksel → birim küre (ortografik) → dünya vektörü (doğu/kuzey/ileri tabanı) → enlem/boylam → doku; Türkiye kırpıntısı içinde kenara doğru yumuşak geçişle yüksek çözünürlüklü doku; basit ışık; kenarda atmosfer halesi; kenar yumuşatma.
- [ ] Yıldızlar ayrı 2D tuvalde bir kez çizilir. Dokunma → 300 ms'de kaybolur. Bitişte katman DOM'dan kaldırılır.
- [ ] Ekran görüntüleri yerel http sunucusuyla (`BEKLE` 3000 / 4300 / 5600): dönen küre, yakınlaşma, harita.
- [ ] Commit, README (Kaynaklar: NASA Blue Marble), gözden geçirme, yayın, canlı kontrol.
