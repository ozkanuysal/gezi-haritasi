// Açılış küresi: NASA görüntülü Dünya döner, Türkiye'ye yakınlaşır, haritaya hizalı geçer.
// KURE_HESAP saf hesaptır (Node'da test edilir); KURE tarayıcıda çizer ve oynatır.
const KURE_HESAP = (function () {
  const TURKIYE = { bati: 25.67, dogu: 44.82, guney: 35.82, kuzey: 42.10 };
  const SURE = 4600; // ms (2026-11-26: 2 sn uzatıldı, dönüş yavaşladı)
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
    const pd = yumusak(sinir(t / 3400));
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

  return { TURKIYE, SURE, ortografik, turkiyeyeOturt, cizelge, oynatilsinMi };
})();

if (typeof module === 'object') module.exports = KURE_HESAP;

// Tarayıcı katmanı: WebGL ile küreyi çizer. Ana sayfa açılışında Açı ekranından sonra oynar;
// Türkiye görünümündeki dünya simgesiyle yeniden oynatılabilir. Bitince katman gizlenir (silinmez).
const KURE = (function () {
  if (typeof document === 'undefined') return null;
  const { SURE, cizelge, turkiyeyeOturt, oynatilsinMi } = KURE_HESAP;
  const katman = document.getElementById('kure');
  const tuval = document.getElementById('kure-tuval');
  const yildizTuval = document.getElementById('kure-yildiz');
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
  katman.addEventListener('click', () => bitir(true));

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

  // Türkiye görünümündeki dünya simgesi: küreyi yeniden oynatır (gerekirse önce kurar).
  function tekrar(hedefKutu) {
    if (!gl || !bitti) return;
    kur();
    calistir(hedefKutu, 5000);
  }

  function destekleniyor() { return !!gl && !hata; }

  if (ilkAcilis) {
    kur();
    bitti = false; // katman açık, Açı ekranının altında bekliyor
    // Bekçi: baslat hiç çağrılmazsa (ör. önbellekte eski harita.js) katman ekranda takılı kalmasın.
    setTimeout(() => { if (!basladi) bitir(true); }, 8000);
  } else {
    gizle();
  }

  return { baslat, tekrar, destekleniyor };
})();
