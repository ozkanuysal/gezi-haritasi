// Türkiye'nin 7 coğrafi bölgesi ve illeri (plaka koduyla).
// Kaynak: tr.wikipedia.org "Türkiye'nin illeri" tablosu, Bölge sütunu (2026-11-26).
// Resmî bölge sınırları il sınırlarını keser; burada her il tek bölgeye atanmıştır.
const BOLGELER = [
  { id: 'marmara', ad: 'Marmara Bölgesi', renk: '#7fb3d5',
    plakalar: [10, 11, 16, 17, 22, 34, 39, 41, 54, 59, 77] },
  { id: 'ege', ad: 'Ege Bölgesi', renk: '#6cc5c0',
    plakalar: [3, 9, 20, 35, 43, 45, 48, 64] },
  { id: 'akdeniz', ad: 'Akdeniz Bölgesi', renk: '#f6a86b',
    plakalar: [1, 7, 15, 31, 32, 33, 46, 80],
    etiket: { x: 266, y: 388 } }, // kutunun ortası İç Anadolu'ya düşüyor; Antalya üstüne alındı
  { id: 'ic-anadolu', ad: 'İç Anadolu Bölgesi', renk: '#f2d16b',
    plakalar: [6, 18, 26, 38, 40, 42, 50, 51, 58, 66, 68, 70, 71] },
  { id: 'karadeniz', ad: 'Karadeniz Bölgesi', renk: '#6fb07a',
    plakalar: [5, 8, 14, 19, 28, 29, 37, 52, 53, 55, 57, 60, 61, 67, 69, 74, 78, 81] },
  { id: 'dogu-anadolu', ad: 'Doğu Anadolu Bölgesi', renk: '#b39ddb',
    plakalar: [4, 12, 13, 23, 24, 25, 30, 36, 44, 49, 62, 65, 75, 76] },
  { id: 'guneydogu-anadolu', ad: 'Güneydoğu Anadolu Bölgesi', renk: '#e8877c',
    plakalar: [2, 21, 27, 47, 56, 63, 72, 73, 79] },
];

if (typeof module === 'object') module.exports = BOLGELER;
