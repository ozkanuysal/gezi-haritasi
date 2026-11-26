// Gezi içerikleri. Her kayıt bir ildeki bir gezi mekânı (plaka koduyla).
// Yeni gezi eklerken: aynı alanlar; yeni bir ilse önce araclar/il-haritasi.py ile iller/<plaka>.js üret.
const GEZILER = [
  {
    plaka: 34,
    mekan: 'Santral İstanbul',
    tur: 'Şehir içi',
    hafta: 18, // okul yılının haftası
    sinif: 4,
    ders: 'Fen Bilimleri',
    kazanimlar: [
      { kod: 'F.4.7.1.1.', metin: 'Basit elektrik devresini oluşturan devre elemanlarını işlevleri ile tanır.' },
      { kod: 'F.4.7.1.2.', metin: 'Çalışan bir elektrik devresi kurar.' },
      { kod: 'F.4.7.1.3.', metin: 'Evde ve okuldaki elektrik düğmelerinin ve kabloların birer devre elemanı olduğunu bilir.' },
    ],
    anahtarKelimeler: ['pil', 'ampul', 'kablo ve anahtar', 'elektrik devresi'],
    konum: { enlem: 41.06639, boylam: 28.94611 }, // tr.wikipedia "Santralistanbul"
    fotograf: {
      dosya: 'gorseller/santral-istanbul.jpg',
      yazar: 'Kurmanbek',
      lisans: 'CC BY-SA 4.0',
      lisansUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      kaynakUrl: 'https://commons.wikimedia.org/wiki/File:Istanbul_Bilgi_University_Santralistanbul_Campus_in_March_2023.jpg',
    },
  },
  {
    plaka: 42,
    mekan: 'Mevlânâ Müzesi', // tabloda "Konya Gezisi"; kullanıcı mekân adını istedi
    tur: 'Şehir dışı',
    hafta: 30, // tabloda "W30"
    sinif: 6,
    ders: 'Sosyal Bilgiler',
    kazanimlar: [ // tabloda kod yok
      { kod: null, metin: "Anadolu'nun Türk yurdu hâline gelmesinde siyasi ve askerî gelişmelerin etkisini açıklar." },
      { kod: null, metin: 'Anadolu Selçuklu Devleti’nin Türk-İslam medeniyetine katkılarını değerlendirir.' },
      { kod: null, metin: 'Türk-İslam medeniyetine ait tarihî, kültürel ve mimari eserleri tanır.' },
      { kod: null, metin: 'Kültürel mirasın korunmasının ve gelecek nesillere aktarılmasının önemini kavrar.' },
      { kod: null, metin: 'Doğal ve beşerî coğrafya özelliklerinin ekonomik faaliyetler üzerindeki etkisini açıklar.' },
    ],
    anahtarKelimeler: [
      'Anadolu Selçuklu Devleti', 'Türk-İslam medeniyeti', 'kültürel miras', 'Mevlânâ', 'hoşgörü',
      'tasavvuf', 'tarihî eser', 'mimari', 'medrese', 'kervansaray', 'başkent', 'ticaret yolları',
      'doğal ve kültürel zenginlikler', 'kültürel kimlik', 'ortak miras', 'kültürel mirasın korunması',
      'okul dışı öğrenme',
    ],
    konum: { enlem: 37.87056, boylam: 32.50472 }, // Mevlânâ Müzesi, tr.wikipedia
    fotograf: {
      dosya: 'gorseller/mevlana-muzesi.jpg',
      yazar: 'Niels Elgaard Larsen',
      lisans: 'CC BY-SA 3.0',
      lisansUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      kaynakUrl: 'https://commons.wikimedia.org/wiki/File:MevlanaMuseum.jpg',
    },
  },
];

if (typeof module === 'object') module.exports = GEZILER;
