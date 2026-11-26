# Küre Açılışı — Tasarım (kısa)

Tarih: 2026-11-26 · Durum: onaylandı (kullanıcı: "Evet aynen o şekilde olsun")

## Amaç
Açı Schools açılış ekranından sonra 2–3 sn'lik bir açılış: gerçekçi (uydu görüntülü) Dünya küresi
döner, Türkiye'ye yakınlaşır ve kendiliğinden bizim renkli Türkiye haritasına geçer.
Esin: Gelişim Dünyam'ın açılış küresi (o küre noktalardan yapılmış; burada gerçek görüntü istendi).

## Kararlar (kullanıcı onayladı)
- Görüntü: NASA Blue Marble Next Generation (topografya + batimetri, Haziran 2004). NASA görüntüsü,
  kamu malı. Küresel doku + Türkiye çevresi için yüksek çözünürlüklü ikinci doku (yakınlaşmada
  bulanık görünmesin).
- Çizim: kütüphanesiz küçük WebGL kodu (dış servis yok).
- Arka plan: koyu uzay ve yıldızlar.
- Geçiş: yakınlaşma sonunda küredeki Türkiye, sayfadaki Türkiye haritasının yeri ve boyuyla hizalanır,
  sonra küre yumuşakça kaybolur, harita kalır.
- Dokununca atlanır. "Hareketi azalt" açık cihazlarda, WebGL ya da doku yoksa küre oynamaz.
- Yalnızca ana sayfa açılışında (adreste `#…` yokken); doğrudan bağlantılarda Açı ekranından sonra
  doğrudan hedef.
- Süre: Açı ekranı ~2,2 sn, küre ~4,6 sn (2026-11-26: kullanıcı 2 sn uzatıp dönüşü yavaşlattı).

## Kapsam dışı
- Küreyle etkileşim (sürükleme, tıklayıp il seçme), gece/gündüz, bulutlar.

## Claude'un kararları
- Küre `kure.js` dosyasında; saf hesaplar (Türkiye'ye oturtma, zaman çizelgesi) Node'da test edilir.
- Projeksiyon: ortografik (gerçek küre görünümü), basit güneş ışığı ve ince atmosfer halesi.
- Türkiye sınırları (hizalama için): 25,67°D–44,82°D, 35,82°K–42,10°K.
- Doku dosyaları `gorseller/dunya.jpg` (4096×2048) ve `gorseller/turkiye-uydu.jpg` (20°D–50°D,
  30°K–45°K kırpıntısı).
- `file://` ile açılan sayfada tarayıcı WebGL'e yerel resmi vermeyebilir; o zaman küre atlanır.

## Doğrulama
- `node --test`: oturtma (Türkiye genişliği hedef kutuya eşit), zaman çizelgesi (başlangıç, bitiş,
  yakınlaşma tekdüze), oynatma koşulu (hash, hareketi azalt).
- Ekran görüntüleri (yerel http sunucusuyla): küre dönerken, yakınlaşırken, geçişten sonra harita.
