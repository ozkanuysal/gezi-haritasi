// Haritanın saf mantığı: DOM'a dokunmaz, Node'da test edilir.
// Durum: { bolge: bölge id'si ya da null (Türkiye görünümü), plaka: seçili il ya da null }.
const GEZI = (function () {
  const liste = typeof module === 'object' ? require('./bolgeler.js') : BOLGELER;
  const geziler = typeof module === 'object' ? require('./geziler.js') : GEZILER;
  const BOS = { bolge: null, plaka: null };

  function ilGezileri(plaka) {
    return geziler.filter(g => g.plaka === plaka);
  }

  function ilEkraniMi(durum) {
    return durum.plaka !== null && ilGezileri(durum.plaka).length > 0;
  }

  // '#marmara/34' → il ekranı; il o bölgede değilse ya da gezisi yoksa yalnızca bölge açılır.
  function hashtenDurum(hash) {
    const [b, p] = hash.replace(/^#/, '').split('/');
    const bolge = hashtenBolge('#' + (b || ''));
    if (!bolge) return { ...BOS };
    const plaka = Number(p);
    const ilAcilir = /^\d+$/.test(p || '') && bolgeBul(plaka) === bolge && ilGezileri(plaka).length > 0;
    return { bolge, plaka: ilAcilir ? plaka : null };
  }

  function durumdanHash(durum) {
    if (!durum.bolge) return '';
    return ilEkraniMi(durum) ? `#${durum.bolge}/${durum.plaka}` : `#${durum.bolge}`;
  }

  // İl ölçeğinde eşdikdörtgen projeksiyon; iller/<plaka>.js aynı formülle üretilir.
  function projeksiyon(enlem, boylam, p) {
    return { x: (boylam - p.lon0) * p.kos * p.olcek, y: (p.lat0 - enlem) * p.olcek };
  }

  function bolgeBul(plaka) {
    const bolge = liste.find(b => b.plakalar.includes(plaka));
    return bolge ? bolge.id : null;
  }

  function ilAdiSade(ad) {
    return ad.replace(/\s*\(.*\)$/, '');
  }

  function hashtenBolge(hash) {
    const id = hash.replace(/^#/, '');
    return liste.some(b => b.id === id) ? id : null;
  }

  function sonrakiDurum(durum, olay) {
    if (olay.tur === 'geri') return { ...BOS };
    if (olay.tur === 'hash') return hashtenDurum(olay.hash);
    if (olay.tur === 'il-ac') return { bolge: bolgeBul(olay.plaka), plaka: olay.plaka };
    if (olay.tur === 'bolgeye-don') return { bolge: durum.bolge, plaka: null };
    if (olay.tur === 'tik') {
      const bolge = bolgeBul(olay.plaka);
      if (!bolge) return { ...durum };
      if (durum.bolge === bolge) return { bolge, plaka: olay.plaka };
      return { bolge, plaka: null };
    }
    return { ...durum };
  }

  function kutuBirlestir(kutular, bosluk) {
    const x1 = Math.min(...kutular.map(k => k.x)) - bosluk;
    const y1 = Math.min(...kutular.map(k => k.y)) - bosluk;
    const x2 = Math.max(...kutular.map(k => k.x + k.width)) + bosluk;
    const y2 = Math.max(...kutular.map(k => k.y + k.height)) + bosluk;
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  }

  return {
    bolgeBul, ilAdiSade, hashtenBolge, sonrakiDurum, kutuBirlestir,
    ilGezileri, ilEkraniMi, hashtenDurum, durumdanHash, projeksiyon,
  };
})();

if (typeof module === 'object') module.exports = GEZI;
