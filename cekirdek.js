// Haritanın saf mantığı: DOM'a dokunmaz, Node'da test edilir.
// Durum: { bolge: bölge id'si ya da null (Türkiye görünümü), plaka: seçili il ya da null }.
const GEZI = (function () {
  const liste = typeof module === 'object' ? require('./bolgeler.js') : BOLGELER;
  const BOS = { bolge: null, plaka: null };

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
    if (olay.tur === 'hash') return { bolge: hashtenBolge(olay.hash), plaka: null };
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

  return { bolgeBul, ilAdiSade, hashtenBolge, sonrakiDurum, kutuBirlestir };
})();

if (typeof module === 'object') module.exports = GEZI;
