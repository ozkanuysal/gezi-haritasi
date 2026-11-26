# Gezi Haritası — Tasarım (kısa)

Tarih: 2026-11-26 · Durum: onaylandı (kullanıcı, 2026-11-26)

Bu tasarım **sürüm 1**. Kullanıcı üstüne geliştirme ve eklemeler yapılacağını söyledi; kod
sonraki katmanların (il sayfası, mekânlar vb.) eklenebileceği biçimde sade ve parçalı tutulur.

## Amaç ve neden
Gezi amaçlı, Türkiye'yi 7 coğrafi bölgeye ayıran tıklanabilir bir harita. Esin kaynağı:
okuldisiogrenme.eba.gov.tr ana sayfasındaki kırmızı il haritası. Proje katman katman
büyüyecek. Bu ilk katmanda yalnızca bölge haritası ve bölgeye yakınlaşma var.

## Hedefler
- Türkiye haritası, 7 bölge farklı renkte; fare üstüne gelince bölge koyulaşır, adı görünür.
- Bölgeye tıklayınca harita o bölgeye yakınlaşır, diğer bölgeler soluklaşır, iller tek tek
  seçilebilir olur (fare üstüne gelince il adı).
- İle tıklayınca il vurgulanır ve adı bir kartta görünür (sonraki katmanın giriş noktası).
- "Türkiye" geri düğmesi tam görünüme döner.
- GitHub Pages'te yayın: `ozkanuysal.github.io/gezi-haritasi`.

## Hedef dışı (bu katmanda yok)
- Sokak haritası, Leaflet, iğneler, koordinatlar.
- Sunucu, veritabanı, API anahtarı, Google servisleri.
- İl sayfaları, mekân verisi.

## Olmaması gerekenler (anti-hedef)
- Kurulum ya da build adımı gerektiren bir yapı.
- Bir ilin iki bölgede görünmesi ya da bölgesiz kalması.

## Kısıtlar
- Resmî bölge sınırları il sınırlarıyla örtüşmez; SVG il sınırlarıyla çizildiği için her il
  tek bölgeye atanır.
- İl–bölge listesi kaynağı: tr.wikipedia.org "Türkiye'nin illeri" tablosunun Bölge sütunu
  (2026-11-26 çekildi). Sayılar: Marmara 11, Ege 8, Akdeniz 8, İç Anadolu 13,
  Karadeniz 18, Doğu Anadolu 14, Güneydoğu Anadolu 9 = 81.
- SVG harita: `dnomak/svg-turkiye-haritasi`, MIT lisansı; lisans notu repoda tutulur.
- Site herkese açık olur. GitHub token adımı kullanıcıda.

## Yaklaşımlar
- **A. Düz SVG + CSS + az JS (seçildi).** Tek sayfa, bağımlılık yok, sitede çalıştığı
  görülmüş düzen. Eksi: SVG gerçek koordinat taşımaz; ileride Türkiye haritasına iğne
  gerekirse B'ye geçilir (il kimliği plaka olduğu için geçiş kolay).
- **B. D3 + GeoJSON.** Gerçek koordinatlı, iğneye hazır. Bu katman için fazla: kütüphane
  ve lisanslı sınır dosyası gerekir.
- **C. Leaflet + sokak altlığı.** Kullanıcı sokak kısmını istemedi; düz görünümü bozar.

Kullanıcı A'yı (SVG) ve "bölgeye tıklayınca yakınlaş" davranışını seçti.

## Kullanıcının kararları
- 7 bölgeye ayrım.
- Bölgeye tıklayınca yakınlaşma, içinde iller.
- GitHub Pages, adında gezi olduğu belli olsun.

## Claude'un kararları (düzeltilebilir)
- Repo adı `gezi-haritasi`, sayfa başlığı "Gezi Haritası".
- Her bölgenin kendi rengi; hover'da koyulaşma.
- Bölge adları Türkiye görünümünde haritanın üstünde yazılı.
- Yakınlaşma: SVG `viewBox` bölgenin sınır kutusuna yumuşak geçişle taşınır.
- İl–bölge eşlemesi plaka koduyla ayrı bir JS dosyasında durur (file:// ile de açılsın diye
  JSON yerine JS).
- Dokunmatik ekranda dokunma tıklama gibi çalışır.
- Açık bölge adres çubuğunda `#ege` gibi görünür; bağlantı doğrudan o bölgeyi açar, tarayıcının
  geri tuşu Türkiye'ye döner. (Ekran görüntüsüyle yakınlaşmayı test etmeyi de sağlar.)
- Kütüphanenin SVG'sinde İstanbul iki parça (Asya/Avrupa, ikisi de plaka 34) ve Kıbrıs
  (`kuzey-kibris` plaka 00, `guney-kibris`) var: İstanbul iki parçası tek il gibi davranır,
  kartta "İstanbul" yazar; Kıbrıs gri, tıklanmaz, bölgesizdir.

## Doğrulama
- Kontrol betiği: 81 ilin her biri tam bir bölgede; bölge sayıları yukarıdakiyle aynı.
- Headless Edge ile ekran görüntüsü: Türkiye görünümü ve en az bir bölge yakınlaşması.

## Yapıcıya kalanlar
- Renk paleti, yazı tipi, geçiş süresi, kart tasarımı.
