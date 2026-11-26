# Gezi Haritası

Türkiye'yi 7 coğrafi bölgede gösteren gezi haritası. Bir bölgeye tıklayınca harita o bölgeye
yakınlaşır. Gezisi olan bir ile (şimdilik İstanbul) tıklayınca il ekranı açılır: solda ilçe haritası
ve gezi mekânının yeri, sağda fotoğraf, hafta, sınıf, ders, anahtar kelimeler ve kazanımlar.

**Canlı:** https://ozkanuysal.github.io/gezi-haritasi/ — doğrudan bağlantılar: `…/#ege` (bölge), `…/#marmara/34` (il ekranı)

## Yerelde açma

`index.html` dosyasını tarayıcıda açmak yeterli. Kurulum, build ya da sunucu gerekmez.

## Dosyalar

| Dosya | Görevi |
|-------|--------|
| `bolgeler.js` | 7 bölge: ad, renk, il plakaları |
| `geziler.js` | Gezi içerikleri (il plakasıyla): mekân, hafta, sınıf, ders, kazanımlar, anahtar kelimeler, konum, fotoğraf |
| `iller/<plaka>.js` | İlin ilçe haritası (OSM'den üretilir) |
| `cekirdek.js` | Saf mantık: durum `{bolge, plaka}`, olaylar, adres, projeksiyon (DOM'a dokunmaz) |
| `harita.js` | Türkiye haritası; durumu `ciz()` ile çizer, il ekranını açar/kapatır |
| `il-ekrani.js` | İl ekranı: ilçe haritası, iğneler, gezi kartları |
| `harita.css` | Görünüm |
| `araclar/il-haritasi.py` | Yeni il için ilçe haritası üretir |

## Yeni gezi eklemek

1. `geziler.js`'e kayıt ekle (aynı alanlar). Fotoğraf varsa `gorseller/`'e koy, yazar ve lisansı yaz.
2. İl yeniyse: `python3 -I araclar/il-haritasi.py <plaka> <OSM il adı>` → `iller/<plaka>.js`,
   ve `index.html`'de `<script src="iller/<plaka>.js">` satırını `cekirdek.js`'ten önce ekle.

## Test

```bash
node --test                               # veri ve mantık testleri
tests/ekran.sh ege 1440x900 ege.png       # ekran görüntüsü (WSL + Edge)
```

## Kaynaklar

- Harita: [svg-turkiye-haritasi](https://github.com/dnomak/svg-turkiye-haritasi), © 2015 Doğukan Güven Nomak,
  MIT lisansı (`lisanslar/svg-turkiye-haritasi-LICENSE`).
- İlçe sınırları: © OpenStreetMap katkıcıları, ODbL 1.0 (atıf il haritasının köşesinde).
- Santral İstanbul fotoğrafı: Kurmanbek, CC BY-SA 4.0, Wikimedia Commons.
- İl–bölge listesi: Vikipedi "Türkiye'nin illeri" tablosu, Bölge sütunu. Resmî bölge sınırları il
  sınırlarını keser; burada her il tek bölgeye atanmıştır.
