// Yurt dışı geziler: kürede (dünya simgesiyle açılan) soldaki menüde kart, gidilen şehirlerde işaret.
// Şehir koordinatları: tr.wikipedia (2026-11-26). Yeni gezi: aynı alanlar; şehir yoksa ülkenin ortası.
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
      { ad: 'Almanya', sehir: 'Frankfurt', konum: { enlem: 50.1106, boylam: 8.6822 }, yon: 'sag' },
      { ad: 'Hollanda', sehir: 'Amsterdam', konum: { enlem: 52.37, boylam: 4.88 }, yon: 'sol' },
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
