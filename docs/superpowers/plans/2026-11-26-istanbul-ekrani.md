# İl Ekranı (İstanbul) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gezi içeriği olan ile (ilk: İstanbul) tıklanınca solda OSM ilçe haritası + iğne, sağda gezi kartı gösteren il ekranı; Türkiye haritasında içerikli il etiketi.

**Architecture:** Gezi verisi `geziler.js`, il haritası betikle üretilmiş `iller/<plaka>.js`. Saf mantık (`cekirdek.js`) durum `{bolge, plaka}`'ı genişletmeden il ekranını türetir: `plaka` seçili ve o ilde gezi varsa il ekranı. Adres `#bolge/plaka`. `harita.js` çizer.

**Tech Stack:** Düz HTML/CSS/JS, Node 22 `node:test`, Python 3 (yalnızca üretim betiği), headless Edge.

**Spec:** `docs/superpowers/specs/2026-11-26-istanbul-ekrani-design.md`

## Global Constraints

- Build yok, npm bağımlılığı yok, sayfa açılışta dış servise gitmez; `file://` ile açılır.
- Commit yazarı `ozkanuysal`, Claude satırı yok. Public repo: kişisel yol/e-posta yok.
- OSM atfı: il haritasının köşesinde "Harita verisi © OpenStreetMap katkıcıları" + `https://www.openstreetmap.org/copyright` bağlantısı; 5 sn sonra "ⓘ" düğmesine küçülür, basınca açılır.
- Fotoğraf: `gorseller/santral-istanbul.jpg` (Commons 1280px), altında küçük soluk "Fotoğraf: Kurmanbek · CC BY-SA 4.0" (Commons sayfası ve lisans bağlantılı).
- Metin: "Şehir içi · 18. hafta", "4. sınıf · Fen Bilimleri", geri düğmesi "← Marmara" (bölge adı `ad`'dan " Bölgesi" atılarak).
- Lacivert `#002d72`; il ekranında ilçe dolgusu İstanbul'un bölge rengi (`#e7a1c4`).

## Review Focus

1. Türkiye görünümünde İstanbul **şekline** tıklama yine Marmara'yı açar (il ekranını değil); yalnızca **etiket** doğrudan açar. Test: Task 1 `sonrakiDurum`.
2. Bozuk il adresi (`#marmara/99`, `#ege/34`, `#marmara/10` = içeriksiz il, `#marmara/abc`): hata yok; bölge varsa bölge açılır, il ekranı açılmaz. Test: Task 1 `hashtenDurum`.
3. Geri tuşu: il ekranı → bölge → Türkiye. Test: Task 1 `durumdanHash`; davranış kullanıcıda.
4. Telefon (390×844): harita üstte, kart altta, anahtar kelimeler satır kırar, yatay taşma yok. Test: Task 3 ekran görüntüsü.
5. Fotoğraf geç yüklenince/yüklenmezse yerleşim zıplamaz: fotoğraf kutusu sabit en-boy oranlı. Test: Task 3 `sayfa.test.js`.

---

### Task 1: Veri ve saf mantık

**Files:** Create `geziler.js`; Modify `cekirdek.js`, `tests/cekirdek.test.js`; Create `tests/geziler.test.js`

**Interfaces — Produces:**
- Global `GEZILER: Array<Gezi>`; `Gezi = { plaka: number, mekan: string, tur: string, hafta: number, sinif: number, ders: string, kazanimlar: Array<{kod, metin}>, anahtarKelimeler: string[], konum: {enlem, boylam}, fotograf: {dosya, yazar, lisans, lisansUrl, kaynakUrl} }`.
- `GEZI` ekleri: `ilGezileri(plaka) -> Gezi[]`, `ilEkraniMi(durum) -> boolean`, `hashtenDurum(hash) -> durum`, `durumdanHash(durum) -> string`, `projeksiyon(enlem, boylam, p: {lon0, lat0, kos, olcek}) -> {x, y}` (x = (boylam − lon0)·kos·olcek, y = (lat0 − enlem)·olcek).
- `sonrakiDurum` yeni olaylar: `{tur: 'il-ac', plaka}` → `{bolge: bolgeBul(plaka), plaka}`; `{tur: 'bolgeye-don'}` → `{bolge, plaka: null}`; `{tur: 'hash'}` artık `hashtenDurum` kullanır.

- [ ] **Step 1: Failing tests** — `tests/geziler.test.js`: tek kayıt; plaka 34; hafta 18; sinif 4; ders 'Fen Bilimleri'; `kazanimlar.map(k => k.kod)` = `['F.4.7.1.1.', 'F.4.7.1.2.', 'F.4.7.1.3.']`; `anahtarKelimeler` = `['pil', 'ampul', 'kablo ve anahtar', 'elektrik devresi']`; konum 41.06639 / 28.94611; fotoğraf dosyası `gorseller/santral-istanbul.jpg`, lisans 'CC BY-SA 4.0'. `tests/cekirdek.test.js` ekleri:
  - `ilGezileri(34).length === 1`, `ilGezileri(6)` = `[]`
  - `ilEkraniMi({bolge:'marmara', plaka:34})` true; `{bolge:'marmara', plaka:10}` false; BOS false
  - `sonrakiDurum(BOS, {tur:'tik', plaka:34})` = `{bolge:'marmara', plaka:null}` (Review Focus 1)
  - `sonrakiDurum(BOS, {tur:'il-ac', plaka:34})` = `{bolge:'marmara', plaka:34}`
  - `sonrakiDurum({bolge:'marmara', plaka:34}, {tur:'bolgeye-don'})` = `{bolge:'marmara', plaka:null}`
  - `hashtenDurum`: `'#marmara/34'` → `{marmara, 34}`; `'#ege'` → `{ege, null}`; `'#marmara/99'`, `'#marmara/10'`, `'#marmara/abc'` → `{marmara, null}`; `'#ege/34'` → `{ege, null}`; `'#xyz/34'`, `''` → BOS
  - `durumdanHash`: `{marmara,34}` → `'#marmara/34'`; `{marmara,10}` → `'#marmara'`; BOS → `''`
  - `projeksiyon(41, 29, {lon0: 28, lat0: 42, kos: 0.75, olcek: 100})` = `{x: 75, y: 100}`
- [ ] **Step 2:** `node --test` → FAIL (`Cannot find module '../geziler.js'`).
- [ ] **Step 3:** `geziler.js` (spec tablosundaki değerler, kazanım metinleri birebir) ve `cekirdek.js` eklerini yaz. `cekirdek.js` `GEZILER`'i `BOLGELER` gibi alır.
- [ ] **Step 4:** `node --test` → tümü PASS.
- [ ] **Step 5:** Commit "Gezi verisi ve il ekranı mantığı".

### Task 2: İl haritası üretimi (İstanbul)

**Files:** Create `araclar/il-haritasi.py`, `iller/34.js`, `tests/il.test.js`

**Interfaces — Produces:** `iller/34.js`: `var IL_HARITALARI = IL_HARITALARI || {}; IL_HARITALARI[34] = { genislik, yukseklik, projeksiyon: {lon0, lat0, kos, olcek}, ilceler: [{ad, d}] };` + Node export. `d` yalnızca `M`, `L`, `Z` komutları, mutlak koordinat, 1 ondalık.

- [ ] **Step 1: Failing test** `tests/il.test.js`: 39 ilçe; adlar arasında 'Eyüpsultan', 'Kadıköy', 'Adalar'; tüm noktalar `[0, genislik] × [0, yukseklik]` içinde; `projeksiyon(41.06639, 28.94611, p)` noktası Eyüpsultan yolunun içinde (ışın atma, `d`'den halkalar), Kadıköy'ün içinde değil; `genislik === 1000`.
- [ ] **Step 2:** `node --test` → FAIL (dosya yok).
- [ ] **Step 3:** `araclar/il-haritasi.py <plaka> <OSM il adı>`: Overpass (`overpass-api.de`, olmazsa `overpass.kumi.systems`) ile `admin_level=6` ilçe kimlikleri; Nominatim `lookup` (`polygon_geojson=1`, `polygon_threshold=0.001`, genel bir User-Agent, tek istek); lat0/lon0 = kutunun ortası, `kos = cos(lat0)`, `olcek` genişlik 1000 olacak şekilde, 10 birim kenar boşluğu; çıktı `iller/<plaka>.js`. Çalıştır: `python3 -I araclar/il-haritasi.py 34 İstanbul`.
- [ ] **Step 4:** `node --test` → PASS. **Step 5:** Commit "İstanbul ilçe haritası (OSM) ve üretim betiği".

### Task 3: İl ekranı, Türkiye il etiketi, fotoğraf

**Files:** Modify `index.html`, `harita.js`, `harita.css`, `tests/sayfa.test.js`, `tests/ekran.sh` (iller/ kopyası); Create `gorseller/santral-istanbul.jpg`

**Interfaces — Consumes:** Task 1 `GEZI` ekleri, `GEZILER`; Task 2 `IL_HARITALARI`.

- [ ] **Step 1: Failing tests** (`sayfa.test.js`): `index.html`'de `id="il-ekrani"`, `openstreetmap.org/copyright` bağlantısı ve "© OpenStreetMap katkıcıları"; betik sırası `bolgeler.js`, `geziler.js`, `iller/34.js`, `cekirdek.js`, `harita.js`; CSS'te `.gezi-foto` kuralında `aspect-ratio`; "görseller git'te" testi `geziler.js`'teki `dosya:` değerlerini de tarar.
- [ ] **Step 2:** `node --test` → FAIL.
- [ ] **Step 3:** Fotoğrafı indir (Commons 1280px küçük resmi) → `gorseller/santral-istanbul.jpg`.
- [ ] **Step 4:** `index.html` + `harita.css` + `harita.js`:
  - Türkiye görünümü: `GEZILER`'deki her plaka için il adı etiketi (beyaz zemin, lacivert yazı, küçük nokta) ilin kutusunun ortasında; tıklama `{tur:'il-ac'}`; bölge açıkken gizli.
  - `ciz`: `ilEkraniMi(durum)` ise Türkiye SVG'si ve kart gizlenir, `#il-ekrani` görünür: solda `IL_HARITALARI[plaka]` ilçeleri (tek renk, beyaz sınır, fareyle ilçe adı), her gezi için `projeksiyon` ile lacivert iğne; sağda gezi kartları. Geri düğmesi "← Marmara" → `{tur:'bolgeye-don'}`.
  - Adres: durum değişince `durumdanHash`; `hashchange` → `{tur:'hash'}`.
  - İğneye tıklayınca ilgili kart görünür alana kaydırılır ve kısa süre vurgulanır.
  - OSM atfı köşede, 5 sn sonra ⓘ'ye küçülür, ⓘ tıklanınca açılır.
  - Telefon (≤600 px): tek sütun, harita üstte.
- [ ] **Step 5:** `node --test` → PASS.
- [ ] **Step 6:** Ekran görüntüleri: `"" 1440x900` (İstanbul etiketi), `marmara/34 1440x900`, `marmara/34 390x844`. Expected: etiket İstanbul üstünde; il ekranında iğne Eyüpsultan'da, kart bilgileri tam; telefonda taşma yok.
- [ ] **Step 7:** Commit "İl ekranı: İstanbul haritası, gezi kartı, Türkiye il etiketi".

### Task 4: README ve yayın

- [ ] **Step 1:** README "Dosyalar" tablosuna `geziler.js`, `iller/`, `araclar/il-haritasi.py`; "Kaynaklar"a OSM (ODbL) ve fotoğraf. Commit.
- [ ] **Step 2:** Bağımsız gözden geçirme (Fable) → Critical/Important düzelt (test önce).
- [ ] **Step 3:** `git push`; Pages derlemesi `built <sha>` olana dek bekle; `ADRES=… tests/ekran.sh marmara/34 1440x900` ile canlıyı çek. Expected: il ekranı canlıda.
