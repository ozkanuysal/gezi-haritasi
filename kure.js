// Açılış küresi: NASA görüntülü Dünya döner, Türkiye'ye yakınlaşır, haritaya hizalı geçer.
// KURE_HESAP saf hesaptır (Node'da test edilir); KURE tarayıcıda çizer ve oynatır.
const KURE_HESAP = (function () {
  const TURKIYE = { bati: 25.67, dogu: 44.82, guney: 35.82, kuzey: 42.10 };
  const SURE = 4600; // ms (2026-11-26: 2 sn uzatıldı, dönüş yavaşladı)
  // Dönüş süresi: açılış küresi ve dünya simgesiyle açılan küre aynı hızda döner (2026-11-26).
  const DONUS_MS = 2200; // 3400 → 2200: kullanıcı "hızı daha da yükselt" dedi
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

  // t (ms) anındaki görünüm: dönüş 0–3400 ms, yakınlaşma 2400–4300 ms, kayboluş 4150–4600 ms.
  function cizelge(t, bas, son) {
    const pd = yumusak(sinir(t / DONUS_MS));
    const py = yumusak(sinir((t - 2400) / 1900));
    return {
      lon: son.lon - 150 * (1 - pd),
      lat: 15 + (son.lat - 15) * pd,
      R: bas.R * Math.pow(son.R / bas.R, py),
      cx: bas.cx + (son.cx - bas.cx) * py,
      cy: bas.cy + (son.cy - bas.cy) * py,
      opaklik: 1 - sinir((t - 4150) / 450),
    };
  }

  function oynatilsinMi({ hash, azHareket, webgl }) {
    return (hash === '' || hash === '#') && !azHareket && webgl;
  }

  // Etkileşimli küre (dünya simgesi): döner, Türkiye ortada durur; sürüklenir, yakınlaşır.
  const TURKIYE_MERKEZI = { lon: (TURKIYE.bati + TURKIYE.dogu) / 2, lat: (TURKIYE.guney + TURKIYE.kuzey) / 2 };
  const ACILIS_MS = DONUS_MS;
  // Dönüşten sonra kısa aralarla adım adım yakınlaşma (2026-11-26: "birkaç kere yakınlaşsın";
  // sonra "2 kere daha" ve "biraz daha hızlı": 3 → 5 adım, 700/350 → 480/220 → 300/140 ms).
  const ADIM_SAYISI = 5, ADIM_CARPANI = 1.7, ILK_ARA_MS = 300, ADIM_MS = 300, ARA_MS = 140;
  const ACILIS_BITIS = ACILIS_MS + ILK_ARA_MS + ADIM_SAYISI * (ADIM_MS + ARA_MS);

  function acilisGorunumu(t, R) {
    const e = yumusak(sinir(t / ACILIS_MS));
    let adim = 0;
    for (let i = 0; i < ADIM_SAYISI; i++) {
      adim += yumusak(sinir((t - ACILIS_MS - ILK_ARA_MS - i * (ADIM_MS + ARA_MS)) / ADIM_MS));
    }
    return {
      lon: TURKIYE_MERKEZI.lon - 150 * (1 - e),
      lat: 15 + (TURKIYE_MERKEZI.lat - 15) * e,
      R: R * Math.pow(ADIM_CARPANI, adim),
    };
  }

  // "Türkiye" yazısının boyu: küre küçükken (yarıçap kısa kenarın yarısı ve altı) 0,55, iki katı ve üstü 1.
  function etiketOlcegi(R, kisaKenar) {
    return 0.55 + 0.45 * sinir((R / kisaKenar - 0.5) / 1.5);
  }

  // Ekrandaki nokta kürenin neresine denk geliyor (küre dışındaysa null). Gölgelendiricideki dönüşümle aynı.
  function ekrandanKonum(x, y, g, cx, cy) {
    const px = (x - cx) / g.R, py = -(y - cy) / g.R, r2 = px * px + py * py;
    if (r2 > 1) return null;
    const z = Math.sqrt(1 - r2), l0 = g.lon * R2D, f0 = g.lat * R2D;
    const wx = -px * Math.sin(l0) - py * Math.sin(f0) * Math.cos(l0) + z * Math.cos(f0) * Math.cos(l0);
    const wy = px * Math.cos(l0) - py * Math.sin(f0) * Math.sin(l0) + z * Math.cos(f0) * Math.sin(l0);
    const wz = py * Math.cos(f0) + z * Math.sin(f0);
    return { lon: Math.atan2(wy, wx) / R2D, lat: Math.asin(Math.max(-1, Math.min(1, wz))) / R2D };
  }

  // Türkiye sınırı (turkiye-sinir.js, OSM) içinde mi: ışın atma, tüm halkalar.
  const SINIR_HALKALARI = typeof module === 'object' ? require('./turkiye-sinir.js') : TURKIYE_SINIRI;
  function turkiyeIcindeMi(lon, lat) {
    let ic = false;
    for (const h of SINIR_HALKALARI) {
      for (let i = 0, j = h.length - 1; i < h.length; j = i++) {
        const [xi, yi] = h[i], [xj, yj] = h[j];
        if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) ic = !ic;
      }
    }
    return ic;
  }

  // Kürede "Türkiye" yazısının ekrandaki yeri; Türkiye arka yüzdeyse görünmez.
  function etiketKonumu(g, cx, cy) {
    const o = ortografik(TURKIYE_MERKEZI.lon, TURKIYE_MERKEZI.lat, { lon: g.lon, lat: g.lat });
    return { x: cx + g.R * o.x, y: cy - g.R * o.y, gorunur: o.gorunur };
  }

  // Parmağın altındaki yer parmakla birlikte gider: sağa sürükleyince bakış batıya, aşağı sürükleyince kuzeye.
  function surukle(g, dx, dy) {
    const lon = g.lon - dx / g.R / R2D;
    return {
      lon: ((lon + 180) % 360 + 360) % 360 - 180,
      lat: Math.max(-85, Math.min(85, g.lat + dy / g.R / R2D)),
      R: g.R,
    };
  }

  function yakinlastir(g, carpan, enKucuk, enBuyuk) {
    return { lon: g.lon, lat: g.lat, R: Math.max(enKucuk, Math.min(enBuyuk, g.R * carpan)) };
  }

  return {
    TURKIYE, SURE, DONUS_MS, ortografik, turkiyeyeOturt, cizelge, oynatilsinMi,
    TURKIYE_MERKEZI, ACILIS_MS, acilisGorunumu, surukle, yakinlastir,
    ADIM_SAYISI, ADIM_CARPANI, ACILIS_BITIS, ILK_ARA_MS, ADIM_MS, ARA_MS, etiketKonumu, etiketOlcegi,
    ekrandanKonum, turkiyeIcindeMi,
  };
})();

if (typeof module === 'object') module.exports = KURE_HESAP;

// Tarayıcı katmanı: WebGL ile küreyi çizer. Ana sayfa açılışında Açı ekranından sonra oynar;
// Türkiye görünümündeki dünya simgesiyle yeniden oynatılabilir. Bitince katman gizlenir (silinmez).
const KURE = (function () {
  if (typeof document === 'undefined') return null;
  const { SURE, cizelge, turkiyeyeOturt, oynatilsinMi, ACILIS_BITIS, acilisGorunumu, surukle, yakinlastir, etiketKonumu, etiketOlcegi,
    ekrandanKonum, turkiyeIcindeMi } = KURE_HESAP;
  const katman = document.getElementById('kure');
  const tuval = document.getElementById('kure-tuval');
  const yildizTuval = document.getElementById('kure-yildiz');
  const cik = document.getElementById('kureden-cik');
  const turkiyeEtiketi = document.getElementById('kure-turkiye');
  const gizle = () => { katman.hidden = true; katman.style.transition = ''; katman.style.opacity = ''; };

  let gl = null;
  try { gl = tuval.getContext('webgl', { antialias: false, premultipliedAlpha: false }); } catch (e) { gl = null; }
  if (gl && gl.getParameter(gl.MAX_TEXTURE_SIZE) < 4096) gl = null;
  const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ilkAcilis = oynatilsinMi({ hash: location.hash, azHareket, webgl: !!gl });

  const VS = 'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }';
  const FS = `precision highp float;
uniform sampler2D dunya, bolge;
uniform vec2 merkez;   // ekran (cihaz pikseli, alttan)
uniform float R;       // küre yarıçapı (cihaz pikseli)
uniform vec2 bakis;    // ekranın ortasındaki boylam, enlem (derece)
void main() {
  vec2 p = (gl_FragCoord.xy - merkez) / R;
  float r = length(p);
  if (r > 1.06) { gl_FragColor = vec4(0.0); return; }
  if (r > 1.0) { gl_FragColor = vec4(0.35, 0.6, 1.0, pow(1.0 - (r - 1.0) / 0.06, 2.0) * 0.55); return; }
  float z = sqrt(1.0 - r * r);
  float l0 = radians(bakis.x), f0 = radians(bakis.y);
  vec3 ileri = vec3(cos(f0) * cos(l0), cos(f0) * sin(l0), sin(f0));
  vec3 dogu = vec3(-sin(l0), cos(l0), 0.0);
  vec3 kuzey = vec3(-sin(f0) * cos(l0), -sin(f0) * sin(l0), cos(f0));
  vec3 w = p.x * dogu + p.y * kuzey + z * ileri;
  float lat = degrees(asin(clamp(w.z, -1.0, 1.0)));
  // Boylam bakış boylamına göre: dikiş (±180) hep arka yüzde kalır, doku REPEAT ile sarılır.
  float fark = degrees(atan(dot(w, dogu), dot(w, vec3(cos(l0), sin(l0), 0.0))));
  float lon = bakis.x + fark;
  // fark ±180 süreksizliği bakış enlemi > 0 iken kutbun ötesinde görünür; orada mip seçimi sapmasın.
  float sapma = abs(fark) > 175.0 ? -16.0 : 0.0;
  vec3 renk = texture2D(dunya, vec2((lon + 180.0) / 360.0, (90.0 - lat) / 180.0), sapma).rgb;
  vec2 b = vec2((lon - 20.0) / 30.0, (45.0 - lat) / 15.0);  // Türkiye çevresi: 20–50°D, 30–45°K
  float k = smoothstep(0.0, 0.08, b.x) * smoothstep(0.0, 0.08, 1.0 - b.x)
          * smoothstep(0.0, 0.16, b.y) * smoothstep(0.0, 0.16, 1.0 - b.y);
  if (k > 0.0) renk = mix(renk, texture2D(bolge, clamp(b, 0.0, 1.0)).rgb, k);
  renk *= 0.62 + 0.38 * max(dot(vec3(p, z), normalize(vec3(-0.4, 0.35, 0.85))), 0.0);
  renk = mix(renk, vec3(0.45, 0.65, 1.0), pow(1.0 - z, 3.0) * 0.45);  // atmosfer kenarı
  gl_FragColor = vec4(renk, 1.0);
}`;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // Tuval kendi kutusunun ölçüsüyle (innerWidth/innerHeight bazı ortamlarda kutudan farklı: küre elips olur).
  const gen = () => katman.clientWidth, yuk = () => katman.clientHeight;
  // Kutu boyu değişirse (telefonda adres çubuğu, pencere) tuval ve yıldızlar yeniden ayarlanır.
  function boyutla() {
    const w = Math.round(gen() * dpr), h = Math.round(yuk() * dpr);
    if (tuval.width === w && tuval.height === h) return;
    for (const t of [tuval, yildizTuval]) { t.width = w; t.height = h; }
    gl.viewport(0, 0, w, h);
    yildizlariCiz();
  }
  function yildizlariCiz() {
    const c = yildizTuval.getContext('2d');
    c.clearRect(0, 0, yildizTuval.width, yildizTuval.height);
    for (let i = 0; i < 380; i++) {
      c.fillStyle = `rgba(232, 238, 255, ${0.25 + Math.random() * 0.75})`;
      const boy = (Math.random() < 0.1 ? 1.6 : 0.9) * dpr;
      c.fillRect(Math.random() * yildizTuval.width, Math.random() * yildizTuval.height, boy, boy);
    }
  }

  // GL programı ve dokular bir kez kurulur: açılışta ya da dünya simgesine ilk basışta.
  let kuruldu = false, hata = !gl, hazir = 0, uMerkez, uR, uBakis;
  function golgelendirici(tur, kaynak) {
    const g = gl.createShader(tur);
    gl.shaderSource(g, kaynak);
    gl.compileShader(g);
    if (!gl.getShaderParameter(g, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(g));
    return g;
  }
  function kur() {
    if (kuruldu || !gl) return;
    kuruldu = true;
    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, golgelendirici(gl.VERTEX_SHADER, VS));
      gl.attachShader(program, golgelendirici(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    } catch (e) { hata = true; return; }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const u = ad => gl.getUniformLocation(program, ad);
    uMerkez = u('merkez'); uR = u('R'); uBakis = u('bakis');

    // Yıldızlı uzay hemen hazır: dokular gecikse de boş koyu ekran görünmesin.
    boyutla();
    yildizlariCiz();

    // Dokular. file:// ile açılınca tarayıcı izin vermeyebilir → küre atlanır.
    [['gorseller/dunya.jpg', 0, gl.REPEAT, 'dunya'], ['gorseller/turkiye-uydu.jpg', 1, gl.CLAMP_TO_EDGE, 'bolge']]
      .forEach(([kaynak, birim, sarma, ad]) => {
        const resim = new Image();
        resim.onload = () => {
          try {
            gl.activeTexture(gl.TEXTURE0 + birim);
            gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, resim);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sarma);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.uniform1i(u(ad), birim);
            hazir++;
          } catch (e) { hata = true; }
        };
        resim.onerror = () => { hata = true; };
        resim.src = kaynak;
      });
  }

  function ciz(d) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uMerkez, d.cx * dpr, tuval.height - d.cy * dpr);
    gl.uniform1f(uR, d.R * dpr);
    gl.uniform2f(uBakis, d.lon, d.lat);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  let basladi = false, bitti = true;
  function bitir(hizli) {
    if (bitti) return;
    bitti = true;
    if (!hizli) return gizle();
    katman.style.transition = 'opacity .3s';
    katman.style.opacity = 0;
    setTimeout(() => { if (bitti) gizle(); }, 320); // arada yeniden açıldıysa gizleme
  }
  katman.addEventListener('click', () => { if (!etkilesimli) bitir(true); }); // açılış küresi dokununca atlanır

  function oynat(hedefKutu) {
    const t0 = performance.now();
    (function kare(simdi) {
      if (bitti) return;
      try {
        boyutla();
        const t = Math.max(0, simdi - t0);
        const son = turkiyeyeOturt(hedefKutu());
        const bas = { R: Math.min(gen(), yuk()) * 0.36, cx: gen() / 2, cy: yuk() / 2 };
        const d = cizelge(t, bas, son);
        ciz(d);
        katman.style.opacity = d.opaklik;
        if (t >= SURE) return bitir(false);
      } catch (e) { return bitir(true); }
      requestAnimationFrame(kare);
    })(t0);
  }

  // Katmanı açar, dokuları en çok bekleSiniri ms bekler (gelmezse yumuşakça atlar), sonra oynatır.
  function calistir(hedefKutu, bekleSiniri) {
    katman.hidden = false;
    katman.style.transition = '';
    katman.style.opacity = 1;
    bitti = false;
    boyutla();
    const bekleme = performance.now();
    (function bekle() {
      if (bitti) return;
      if (hata) return bitir(true);
      if (hazir < 2) return performance.now() - bekleme > bekleSiniri ? bitir(true) : setTimeout(bekle, 50);
      oynat(hedefKutu);
    })();
  }

  // Açı ekranı kapanırken çağrılır (yalnızca ana sayfa açılışında).
  const BEKLEME_MS = 800;
  function baslat(hedefKutu) {
    if (!ilkAcilis || basladi) return;
    basladi = true;
    calistir(hedefKutu, BEKLEME_MS);
  }

  // Etkileşimli küre (Türkiye görünümündeki dünya simgesi): döner, Türkiye ortada durur ve kalır.
  // Sürükleyerek döndürülür, tekerlek ya da iki parmakla yakınlaştırılır; harita simgesi ya da Esc kapatır.
  let etkilesimli = false, gorunum = null, kullanici = false, hiz = { x: 0, y: 0 };
  let dokunus = null; // kısa, kıpırdamadan dokunuş: Türkiye'nin üstündeyse harita açılır
  const isaretciler = new Map();
  const enKucukR = () => Math.min(gen(), yuk()) * 0.25;
  const enBuyukR = () => Math.min(gen(), yuk()) * 10;

  function ac() {
    if (!gl || !bitti) return;
    kur();
    katman.hidden = false;
    katman.style.transition = '';
    katman.style.opacity = 1;
    katman.classList.add('etkilesimli');
    cik.hidden = false;
    bitti = false; etkilesimli = true; kullanici = false; gorunum = null; hiz = { x: 0, y: 0 };
    boyutla();
    const bekleme = performance.now();
    (function bekle() {
      if (bitti) return;
      if (hata) return kapat();
      if (hazir < 2) return performance.now() - bekleme > 5000 ? kapat() : setTimeout(bekle, 50);
      const t0 = performance.now();
      (function kare(simdi) {
        if (bitti) return;
        try {
          boyutla();
          const t = simdi - t0;
          // Açılış dönüşü ve adım adım yakınlaşma; kullanıcı dokununca o anda durur.
          if (!kullanici && (gorunum === null || t <= ACILIS_BITIS + 50)) {
            gorunum = acilisGorunumu(t, Math.min(gen(), yuk()) * 0.4);
          } else if (!isaretciler.size && (Math.abs(hiz.x) > 0.05 || Math.abs(hiz.y) > 0.05)) {
            gorunum = surukle(gorunum, hiz.x, hiz.y); // bırakınca yavaşlayarak kayar
            hiz = { x: hiz.x * 0.92, y: hiz.y * 0.92 };
          }
          ciz({ lon: gorunum.lon, lat: gorunum.lat, R: gorunum.R, cx: gen() / 2, cy: yuk() / 2 });
          const e = etiketKonumu(gorunum, gen() / 2, yuk() / 2);
          turkiyeEtiketi.hidden = !e.gorunur;
          turkiyeEtiketi.style.transform =
            `translate(${e.x}px, ${e.y}px) translate(-50%, -50%) scale(${etiketOlcegi(gorunum.R, Math.min(gen(), yuk()))})`;
        } catch (e) { return kapat(); }
        requestAnimationFrame(kare);
      })(t0);
    })();
  }

  function kapat() {
    if (!etkilesimli) return;
    etkilesimli = false;
    isaretciler.clear();
    cik.hidden = true;
    turkiyeEtiketi.hidden = true;
    katman.classList.remove('etkilesimli');
    bitir(true);
  }

  cik.addEventListener('click', e => { e.stopPropagation(); kapat(); });
  document.addEventListener('keydown', e => { if (etkilesimli && e.key === 'Escape') kapat(); });
  katman.addEventListener('pointerdown', e => {
    if (!etkilesimli || cik.contains(e.target)) return;
    katman.setPointerCapture(e.pointerId);
    isaretciler.set(e.pointerId, { x: e.clientX, y: e.clientY });
    kullanici = true;
    hiz = { x: 0, y: 0 };
    dokunus = isaretciler.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
  });
  katman.addEventListener('pointermove', e => {
    if (dokunus && Math.hypot(e.clientX - dokunus.x, e.clientY - dokunus.y) > 6) dokunus = null;
    if (!etkilesimli || !gorunum || !isaretciler.has(e.pointerId)) return;
    const once = [...isaretciler.values()];
    const onceki = isaretciler.get(e.pointerId);
    isaretciler.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (isaretciler.size === 1) {
      const dx = e.clientX - onceki.x, dy = e.clientY - onceki.y;
      gorunum = surukle(gorunum, dx, dy);
      hiz = { x: dx, y: dy };
    } else if (isaretciler.size === 2) {
      const aralik = n => Math.hypot(n[0].x - n[1].x, n[0].y - n[1].y);
      const sonra = [...isaretciler.values()];
      if (aralik(once) > 0) gorunum = yakinlastir(gorunum, aralik(sonra) / aralik(once), enKucukR(), enBuyukR());
    }
  });
  const birak = e => {
    isaretciler.delete(e.pointerId);
    if (e.type === 'pointerup' && dokunus && etkilesimli && gorunum && performance.now() - dokunus.t < 500) {
      const k = ekrandanKonum(e.clientX, e.clientY, gorunum, gen() / 2, yuk() / 2);
      if (k && turkiyeIcindeMi(k.lon, k.lat)) kapat();
    }
    dokunus = null;
  };
  katman.addEventListener('pointerup', birak);
  katman.addEventListener('pointercancel', birak);
  katman.addEventListener('wheel', e => {
    if (!etkilesimli || !gorunum) return;
    e.preventDefault();
    kullanici = true;
    gorunum = yakinlastir(gorunum, Math.exp(-e.deltaY * 0.0015), enKucukR(), enBuyukR());
  }, { passive: false });

  function destekleniyor() { return !!gl && !hata; }

  if (ilkAcilis) {
    kur();
    bitti = false; // katman açık, Açı ekranının altında bekliyor
    // Bekçi: baslat hiç çağrılmazsa (ör. önbellekte eski harita.js) katman ekranda takılı kalmasın.
    setTimeout(() => { if (!basladi) bitir(true); }, 8000);
  } else {
    gizle();
  }

  return { baslat, ac, destekleniyor };
})();
