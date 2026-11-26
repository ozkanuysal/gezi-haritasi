# Gezi Haritası

Türkiye'yi 7 coğrafi bölgede gösteren gezi haritası. Bir bölgeye tıklayınca harita o bölgeye
yakınlaşır; bir ile tıklayınca ilin adı görünür. Bu ilk sürüm; üstüne yeni katmanlar eklenecek.

**Canlı:** https://ozkanuysal.github.io/gezi-haritasi/ — bir bölgeye doğrudan bağlantı: `…/gezi-haritasi/#ege`

## Yerelde açma

`index.html` dosyasını tarayıcıda açmak yeterli. Kurulum, build ya da sunucu gerekmez.

## Dosyalar

| Dosya | Görevi |
|-------|--------|
| `bolgeler.js` | 7 bölge: ad, renk, il plakaları |
| `cekirdek.js` | Saf mantık: durum `{bolge, plaka}` ve olaylar (DOM'a dokunmaz) |
| `harita.js` | Sayfaya bağlama, `ciz(durum)` |
| `harita.css` | Görünüm |

## Test

```bash
node --test                               # veri ve mantık testleri
tests/ekran.sh ege 1440x900 ege.png       # ekran görüntüsü (WSL + Edge)
```

## Kaynaklar

- Harita: [svg-turkiye-haritasi](https://github.com/dnomak/svg-turkiye-haritasi), © 2015 Doğukan Güven Nomak,
  MIT lisansı (`lisanslar/svg-turkiye-haritasi-LICENSE`).
- İl–bölge listesi: Vikipedi "Türkiye'nin illeri" tablosu, Bölge sütunu. Resmî bölge sınırları il
  sınırlarını keser; burada her il tek bölgeye atanmıştır.
