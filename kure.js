// Açılış küresi: NASA görüntülü Dünya döner, Türkiye'ye yakınlaşır, haritaya hizalı geçer.
// KURE_HESAP saf hesaptır (Node'da test edilir); KURE tarayıcıda çizer ve oynatır.
const KURE_HESAP = (function () {
  const TURKIYE = { bati: 25.67, dogu: 44.82, guney: 35.82, kuzey: 42.10 };
  const SURE = 2600; // ms
  const R2D = Math.PI / 180;
  const sinir = x => Math.min(1, Math.max(0, x));
  const yumusak = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // Ortografik izdüşüm, birim küre: x doğuya, y kuzeye.
  function ortografik(lon, lat, merkez) {
    const f = lat * R2D, l = (lon - merkez.lon) * R2D, f0 = merkez.lat * R2D;
    return {
      x: Math.cos(f) * Math.sin(l),
      y: Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(l),
      gorunur: Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(l) >= 0,
    };
  }

  // Son kare: küredeki Türkiye, sayfadaki Türkiye haritasının kutusuyla aynı yer ve genişlikte.
  function turkiyeyeOturt(kutu) {
    const merkez = { lon: (TURKIYE.bati + TURKIYE.dogu) / 2, lat: (TURKIYE.guney + TURKIYE.kuzey) / 2 };
    const genislik = ortografik(TURKIYE.dogu, merkez.lat, merkez).x - ortografik(TURKIYE.bati, merkez.lat, merkez).x;
    return {
      R: kutu.width / genislik,
      cx: kutu.left + kutu.width / 2,
      cy: kutu.top + kutu.height / 2,
      lon: merkez.lon,
      lat: merkez.lat,
    };
  }

  // t (ms) anındaki görünüm: dönüş 0–1800 ms, yakınlaşma 900–2300 ms, kayboluş 2150–2600 ms.
  function cizelge(t, bas, son) {
    const pd = yumusak(sinir(t / 1800));
    const py = yumusak(sinir((t - 900) / 1400));
    return {
      lon: son.lon - 150 * (1 - pd),
      lat: 15 + (son.lat - 15) * pd,
      R: bas.R * Math.pow(son.R / bas.R, py),
      cx: bas.cx + (son.cx - bas.cx) * py,
      cy: bas.cy + (son.cy - bas.cy) * py,
      opaklik: 1 - sinir((t - 2150) / 450),
    };
  }

  function oynatilsinMi({ hash, azHareket, webgl }) {
    return (hash === '' || hash === '#') && !azHareket && webgl;
  }

  return { TURKIYE, SURE, ortografik, turkiyeyeOturt, cizelge, oynatilsinMi };
})();

if (typeof module === 'object') module.exports = KURE_HESAP;
