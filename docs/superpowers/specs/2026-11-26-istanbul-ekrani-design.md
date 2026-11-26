# İl Ekranı (İstanbul) — Tasarım (kısa)

Tarih: 2026-11-26 · Durum: onaylandı (kullanıcı, 2026-11-26) · Önceki: `2026-11-26-gezi-haritasi-design.md` (v1–v4 yayında)

## Amaç
Gezi içeriği olan bir ile tıklanınca o ilin ekranı açılır: solda ilin ilçe haritası ve gezi
mekânının yeri işaretli; sağda gezinin bilgileri. İlk il İstanbul, ilk gezi Santral İstanbul.
İleride başka iller (ör. Konya) ve aynı ile başka geziler eklenecek.

## Kullanıcının kararları
- Sol: İstanbul haritası, Santral İstanbul'un yeri işaretli. Sağ: anahtar kelimeler, sınıf, zaman
  ve diğer bilgiler. Mekânla ilgili bir fotoğraf varsa o da ekranda.
- Türkiye haritasında içerik eklenmiş illerin adı yazar (şimdi İstanbul; ileride Konya vb.).
- Zaman = okul yılının haftası (veri satırındaki "18" → "18. hafta").
- Veri şimdilik bu tek satır; sonrakileri kullanıcı söyler, Claude ekler (Excel aktarımı yok).
- Harita yolu A: OpenStreetMap ilçe sınırlarından düz, renkli ilçe haritası (sokak haritası değil).

## Veri (ilk satır)
| Alan | Değer |
|------|-------|
| Tür | Şehir içi |
| Hafta | 18 |
| Mekân | Santral İstanbul |
| Sınıf | 4 |
| Ders | Fen Bilimleri |
| Kazanımlar | F.4.7.1.1. Basit elektrik devresini oluşturan devre elemanlarını işlevleri ile tanır. · F.4.7.1.2. Çalışan bir elektrik devresi kurar. · F.4.7.1.3. Evde ve okuldaki elektrik düğmelerinin ve kabloların birer devre elemanı olduğunu bilir. |
| Anahtar kelimeler | pil, ampul, kablo ve anahtar, elektrik devresi |
| Konum | 41,06639 K · 28,94611 D (Vikipedi "Santralistanbul") |
| Fotoğraf | Wikimedia Commons "Istanbul Bilgi University Santralistanbul Campus in March 2023", Kurmanbek, CC BY-SA 4.0 |

## Hedefler
- Türkiye görünümünde içerikli illerin adı küçük bir etiketle yazar; etikete tıklamak doğrudan
  il ekranını açar.
- Bölge görünümünde içerikli ile tıklamak il ekranını açar (içeriksiz illerde eskisi gibi kart).
- İl ekranı: üstte "← Marmara" (bölgeye döner) ve il adı. Solda ilçe haritası (Türkiye haritasıyla
  aynı düz tarz, ilçe adları fareyle/dokunmayla), gezi mekânında iğne. Sağda gezi kartı: fotoğraf,
  mekân adı, "Şehir içi · 18. hafta", "4. sınıf · Fen Bilimleri", anahtar kelimeler (etiket
  biçiminde), kazanımlar (kod + metin).
- Bir ilde birden çok gezi olunca: her biri için iğne ve kart; iğneye tıklamak kartını öne çıkarır.
- Adres: il ekranı `#marmara/34` gibi; bağlantı doğrudan açar, tarayıcı geri tuşu bölgeye döner.
- Telefonda: harita üstte, bilgiler altta.

## Hedef dışı
- Sokak haritası, harita karoları, Google servisleri, Excel aktarımı, il dışındaki iller için
  hazır ilçe haritası (her il eklendiğinde betikle üretilir).

## Kısıtlar
- İlçe sınırları: OpenStreetMap (Overpass ile ilçe listesi, Nominatim ile sadeleştirilmiş
  sınırlar; 39 ilçe, ~3300 nokta, ~100 KB). ODbL atfı, OSMF Attribution Guidelines'a göre
  (kullanıcı kararı, seçenek B): il haritasının köşesinde "Harita verisi © OpenStreetMap
  katkıcıları" (lisans bağlantılı) 5 sn görünür, sonra köşede küçük bir "ⓘ" düğmesine küçülür;
  ⓘ'ye basınca yeniden açılır. Açılış ekranı 2,2 sn kalır.
- Fotoğraf CC BY-SA 4.0: fotoğrafın hemen altında küçük, soluk yazar ve lisans satırı.
- İl haritası bir kez betikle üretilip repoya konur; sayfa açılışta dış servise gitmez.
- Projeksiyon: il ölçeğinde eşdikdörtgen (boylam × cos(orta enlem)); iğne aynı formülle konur.

## Yaklaşımlar
- **A. Düz ilçe haritası, OSM verisi (seçildi).** Tutarlı görünüm, dış servis yok, kesin konum.
- B. Leaflet + OSM karoları: kesin ve kolay genişler ama görünüm farklı, açılışta dış servis.
- C. Mevcut İstanbul şeklini büyütmek: ilçe yok, konum yaklaşık; isteğe uymuyor.

## Claude'un kararları (düzeltilebilir)
- Veri `geziler.js` dosyasında (plaka koduyla); il haritaları `iller/<plaka>.js`; üretim betiği
  `araclar/il-haritasi.py` (repoda, yeni il eklerken çalıştırılır).
- Türkiye görünümündeki il adı etiketi bölge etiketlerinden ayrılsın diye beyaz zemin, lacivert
  yazı ve küçük bir nokta.
- Fotoğraf 1280 px genişlikte indirilip `gorseller/` altına konur.
- İlçe haritası tek renk (İstanbul'un bölge rengi, pembe tonları), iğne lacivert.

## Doğrulama
- `node --test`: veri şeması, projeksiyon (bilinen bir noktanın doğru ilçede düşmesi:
  Santral İstanbul → Eyüpsultan), adres çözümü (`#marmara/34`), durum geçişleri.
- Görseller git'te izleniyor testi yeni dosyaları da kapsar.
- Ekran görüntüleri: Türkiye (İstanbul etiketi), `#marmara/34` masaüstü ve telefon; yayından sonra
  canlı adres.
