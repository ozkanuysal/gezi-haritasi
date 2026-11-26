// Yurt dışı geziler: kürede (dünya simgesiyle açılan) soldaki menüde kart, ülkelerin ortasında işaret.
// Ülke orta noktaları: Nominatim (OSM) ülke araması, 2026-11-26. Yeni gezi: aynı alanlar.
const YURTDISI_GEZILER = [
  {
    ad: 'Almanya-Hollanda Matematik, Sanat ve Kültür Gezisi',
    tur: 'Yurt dışı',
    hafta: 28, // okul yılının haftası
    sinif: '5-6',
    ders: 'Matematik & Sanat',
    amac: 'Mat-Fen-İng.-sanat akademik ve beceri gelişimi',
    anahtarKelimeler: ['Matematik ve sanat ilişkisi', 'kültürlerarası etkileşim', 'Avrupa kültürel mirası',
      'geometrik ve estetik düşünme', 'disiplinler arası öğrenme'],
    // yon: işaretin yazısı noktanın hangi yanında (iki ülke yakın; yazılar çakışmasın)
    ulkeler: [
      { ad: 'Almanya', konum: { enlem: 51.1638, boylam: 10.4478 }, yon: 'sag' },
      { ad: 'Hollanda', konum: { enlem: 52.2435, boylam: 5.6343 }, yon: 'sol' },
    ],
    fotograf: {
      dosya: 'gorseller/rijksmuseum.jpg', // Rijksmuseum, Amsterdam (yalnızca bina kalacak şekilde kırpıldı)
      yazar: 'Trougnouf (Benoit Brummer)',
      lisans: 'CC BY 4.0',
      lisansUrl: 'https://creativecommons.org/licenses/by/4.0/',
      kaynakUrl: 'https://commons.wikimedia.org/wiki/File:South_facade_of_the_Rijksmuseum_Amsterdam_(DSCF0528).jpg',
    },
  },
];

if (typeof module === 'object') module.exports = YURTDISI_GEZILER;
