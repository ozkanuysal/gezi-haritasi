// Açılış küresi: NASA görüntülü Dünya döner, Türkiye'ye yakınlaşır, haritaya hizalı geçer.
// KURE_HESAP saf hesaptır (Node'da test edilir); KURE tarayıcıda çizer ve oynatır.
const KURE_HESAP = (function () {
  const TURKIYE = { bati: 25.67, dogu: 44.82, guney: 35.82, kuzey: 42.10 };
  // Tek akıcı uçuş (2026-11-26): iki küre de kullanır. Dönüş 0–DONUS_MS; yakınlaşma dönüş bitmeden
  // YAKIN_BAS'ta başlar, YAKIN_BITIS'te biter. Açılış küresi sonunda haritaya geçer, simgeyle açılan durur.
  const DONUS_MS = 2200; // 3400 → 2200: kullanıcı "hızı daha da yükselt" dedi
  const YAKIN_BAS = 1300, YAKIN_MS = 2200, YAKIN_BITIS = YAKIN_BAS + YAKIN_MS;
  const SURE = YAKIN_BITIS + 300; // açılış küresi: kayboluş YAKIN_BITIS − 150 … SURE
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

  // Uçuşun t (ms) anındaki ilerlemesi: pd dönüş, py yakınlaşma (0–1, yumuşak).
  function ucus(t) {
    return { pd: yumusak(sinir(t / DONUS_MS)), py: yumusak(sinir((t - YAKIN_BAS) / YAKIN_MS)) };
  }

  // Açılış küresi: uçuş + sonunda haritaya hizalı kayboluş.
  function cizelge(t, bas, son) {
    const { pd, py } = ucus(t);
    return {
      lon: son.lon - 150 * (1 - pd),
      lat: 15 + (son.lat - 15) * pd,
      R: bas.R * Math.pow(son.R / bas.R, py),
      cx: bas.cx + (son.cx - bas.cx) * py,
      cy: bas.cy + (son.cy - bas.cy) * py,
      opaklik: 1 - sinir((t - (YAKIN_BITIS - 150)) / 450),
    };
  }

  function oynatilsinMi({ hash, azHareket, webgl }) {
    return (hash === '' || hash === '#') && !azHareket && webgl;
  }

  // Etkileşimli küre (dünya simgesi): döner, Türkiye ortada durur; sürüklenir, yakınlaşır.
  const TURKIYE_MERKEZI = { lon: (TURKIYE.bati + TURKIYE.dogu) / 2, lat: (TURKIYE.guney + TURKIYE.kuzey) / 2 };
  const ACILIS_MS = DONUS_MS;
  // Simgeyle açılan küre aynı uçuşla 1,7⁵ kat yaklaşıp durur (önceki 5 adımlı yakınlaşmanın sonu).
  const YAKINLASMA_KATI = 1.7 ** 5;
  const ACILIS_BITIS = YAKIN_BITIS;

  function acilisGorunumu(t, R) {
    const { pd, py } = ucus(t);
    return {
      lon: TURKIYE_MERKEZI.lon - 150 * (1 - pd),
      lat: 15 + (TURKIYE_MERKEZI.lat - 15) * pd,
      R: R * Math.pow(YAKINLASMA_KATI, py),
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

  // Kürede bir noktanın (boylam, enlem) ekrandaki yeri; arka yüzdeyse görünmez.
  function noktaKonumu(lon, lat, g, cx, cy) {
    const o = ortografik(lon, lat, { lon: g.lon, lat: g.lat });
    return { x: cx + g.R * o.x, y: cy - g.R * o.y, gorunur: o.gorunur };
  }

  // Kürede "Türkiye" yazısının ekrandaki yeri.
  function etiketKonumu(g, cx, cy) {
    return noktaKonumu(TURKIYE_MERKEZI.lon, TURKIYE_MERKEZI.lat, g, cx, cy);
  }

  // Yurt dışı gezisinin kürede bakılacak yeri: ülkelerin ortalaması.
  function gezininMerkezi(ulkeler) {
    const ort = a => a.reduce((s, x) => s + x, 0) / a.length;
    return { lon: ort(ulkeler.map(u => u.konum.boylam)), lat: ort(ulkeler.map(u => u.konum.enlem)) };
  }

  // Ülke işaretine tıklayınca bakılacak yer: ülkenin ortası, ülke ekranı dolduracak kadar yakın.
  function ulkeyeYakinlas(ulke, kisaKenar) {
    return { lon: ulke.konum.boylam, lat: ulke.konum.enlem, R: kisaKenar * 6 };
  }

  // Karta tıklayınca: g0'dan g1'e yumuşak geçiş (boylam kısa yoldan, yarıçap logaritmik).
  function gecisGorunumu(g0, g1, t, sure) {
    const e = yumusak(sinir(t / sure));
    const fark = ((g1.lon - g0.lon + 540) % 360) - 180;
    const lon = g0.lon + fark * e;
    return {
      lon: ((lon + 180) % 360 + 360) % 360 - 180,
      lat: g0.lat + (g1.lat - g0.lat) * e,
      R: g0.R * Math.pow(g1.R / g0.R, e),
    };
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
    YAKIN_BAS, YAKIN_MS, YAKINLASMA_KATI, ACILIS_BITIS, etiketKonumu, etiketOlcegi,
    ekrandanKonum, turkiyeIcindeMi, noktaKonumu, gezininMerkezi, gecisGorunumu, ulkeyeYakinlas,
  };
})();

if (typeof module === 'object') module.exports = KURE_HESAP;

// Tarayıcı katmanı: WebGL ile küreyi çizer. Ana sayfa açılışında Açı ekranından sonra oynar;
// Türkiye görünümündeki dünya simgesiyle yeniden oynatılabilir. Bitince katman gizlenir (silinmez).
const KURE = (function () {
  if (typeof document === 'undefined') return null;
  const { SURE, cizelge, turkiyeyeOturt, oynatilsinMi, ACILIS_BITIS, acilisGorunumu, surukle, yakinlastir, etiketKonumu, etiketOlcegi,
    ekrandanKonum, turkiyeIcindeMi, noktaKonumu, gezininMerkezi, gecisGorunumu, ulkeyeYakinlas } = KURE_HESAP;
  const katman = document.getElementById('kure');
  const tuval = document.getElementById('kure-tuval');
  const yildizTuval = document.getElementById('kure-yildiz');
  const cik = document.getElementById('kureden-cik');
  const turkiyeEtiketi = document.getElementById('kure-turkiye');
  const menu = document.getElementById('kure-menu');
  const menuListe = document.getElementById('kure-menu-liste');
  const menuDugme = document.getElementById('kure-menu-dugme');
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
  let ucusHedefi = null; // karta tıklayınca: { g0, g1, t0 }
  const UCUS_MS = 900;

  // Soldaki menü (yurt dışı geziler, yurtdisi.js) ve kürede ülke işaretleri.
  const yurtdisi = typeof YURTDISI_GEZILER !== 'undefined' ? YURTDISI_GEZILER : [];
  const isaretler = [];
  const acikUlkeler = new Set(); // şehir noktaları açık ülkeler
  function el(ad, sinif, metin) {
    const e = document.createElement(ad);
    if (sinif) e.className = sinif;
    if (metin !== undefined) e.textContent = metin;
    return e;
  }
  function baglanti(metin, url) {
    const a = el('a', null, metin);
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    return a;
  }
  for (const g of yurtdisi) {
    // Kapalıyken yalnızca ad ve ülkeler; tıklayınca ayrıntı açılır ve küre geziye döner.
    const kart = el('article', 'kure-kart');
    kart.tabIndex = 0;
    kart.setAttribute('role', 'button');
    kart.setAttribute('aria-expanded', 'false');
    kart.setAttribute('aria-label', `${g.ad}: ayrıntıyı aç, kürede göster`);
    kart.append(el('h3', null, g.ad), el('p', 'kure-ulkeler', g.ulkeler.map(u => u.ad).join(' · ')));
    const ayrinti = el('div', 'kure-ayrinti');
    ayrinti.hidden = true;
    if (g.fotograf) {
      const kutu = el('div', 'gezi-foto');
      const img = el('img');
      img.src = g.fotograf.dosya; img.alt = g.ad; img.loading = 'lazy';
      kutu.appendChild(img);
      const kaynak = el('p', 'foto-kaynak');
      kaynak.append('Fotoğraf: ', baglanti(g.fotograf.yazar, g.fotograf.kaynakUrl), ' · ',
        baglanti(g.fotograf.lisans, g.fotograf.lisansUrl));
      ayrinti.append(kutu, kaynak);
    }
    ayrinti.append(el('p', 'gezi-bilgi', `${g.tur} · ${g.hafta}. hafta`),
      el('p', 'gezi-bilgi', `${g.sinif}. sınıf · ${g.ders}`));
    const amac = el('p', 'kure-amac');
    amac.append(el('strong', null, 'Amaç: '), g.amac);
    const anahtarlar = el('ul', 'anahtarlar');
    for (const a of g.anahtarKelimeler) anahtarlar.appendChild(el('li', null, a));
    ayrinti.append(amac, anahtarlar);
    kart.appendChild(ayrinti);
    const goster = () => {
      if (!gorunum) return;
      const m = gezininMerkezi(g.ulkeler);
      kullanici = true; hiz = { x: 0, y: 0 };
      ucusHedefi = { g0: gorunum, g1: { lon: m.lon, lat: m.lat, R: Math.min(gen(), yuk()) * 2.6 }, t0: performance.now() };
    };
    const cevir = () => {
      const acik = !kart.classList.contains('acik');
      kart.classList.toggle('acik', acik);
      ayrinti.hidden = !acik;
      kart.setAttribute('aria-expanded', String(acik));
      if (acik) goster();
    };
    kart.addEventListener('click', e => { if (!e.target.closest('a')) cevir(); });
    kart.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cevir(); } });
    menuListe.appendChild(kart);
    for (const u of g.ulkeler) {
      if (isaretler.some(i => i.ad === u.ad)) continue;
      const isaret = el('div', `kure-isaret kure-isaret--ulke kure-isaret--${u.yon}`);
      isaret.hidden = true;
      isaret.append(el('span', 'kure-isaret-nokta'), el('span', 'kure-isaret-ad', u.ad));
      // Ülkeye tıklayınca: şehir noktaları açılır ve küre ülkeye yaklaşır; yeniden tıklayınca kapanır.
      isaret.addEventListener('click', e => {
        e.stopPropagation();
        if (acikUlkeler.has(u.ad)) { acikUlkeler.delete(u.ad); return; }
        acikUlkeler.add(u.ad);
        if (!gorunum) return;
        kullanici = true; hiz = { x: 0, y: 0 };
        ucusHedefi = { g0: gorunum, g1: ulkeyeYakinlas(u, Math.min(gen(), yuk())), t0: performance.now() };
      });
      katman.appendChild(isaret);
      isaretler.push({ ad: u.ad, lon: u.konum.boylam, lat: u.konum.enlem, el: isaret });
      for (const s of u.sehirler || []) {
        const si = el('div', `kure-isaret kure-isaret--sehir kure-isaret--${s.yon || 'sag'}`);
        si.hidden = true;
        si.append(el('span', 'kure-isaret-nokta'), el('span', 'kure-isaret-ad', s.ad));
        katman.appendChild(si);
        isaretler.push({ ad: s.ad, ulke: u.ad, lon: s.konum.boylam, lat: s.konum.enlem, el: si });
      }
    }
  }
  menuDugme.addEventListener('click', () => {
    const kapali = menu.classList.toggle('kapali');
    menuDugme.setAttribute('aria-expanded', String(!kapali));
  });

  // Küre, açık menünün kapatmadığı alanın ortasında durur (masaüstünde sağ taraf, telefonda üst taraf).
  function bakisMerkezi() {
    let cx = gen() / 2, cy = yuk() / 2;
    if (!menu.hidden && !menu.classList.contains('kapali')) {
      const m = menu.getBoundingClientRect();
      if (gen() > 700) cx = (m.right + gen()) / 2; else cy = m.top / 2;
    }
    return { cx, cy };
  }

  function ac() {
    if (!gl || !bitti) return;
    kur();
    katman.hidden = false;
    katman.style.transition = '';
    katman.style.opacity = 1;
    katman.classList.add('etkilesimli');
    cik.hidden = false;
    menu.hidden = !yurtdisi.length;
    bitti = false; etkilesimli = true; kullanici = false; gorunum = null; hiz = { x: 0, y: 0 }; ucusHedefi = null;
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
          if (ucusHedefi) {
            // Karttan seçilen geziye dönüş.
            const u = simdi - ucusHedefi.t0;
            gorunum = gecisGorunumu(ucusHedefi.g0, ucusHedefi.g1, u, UCUS_MS);
            if (u >= UCUS_MS) ucusHedefi = null;
          } else if (!kullanici && (gorunum === null || t <= ACILIS_BITIS + 50)) {
            // Açılış uçuşu; kullanıcı dokununca o anda durur.
            gorunum = acilisGorunumu(t, Math.min(gen(), yuk()) * 0.4);
          } else if (!isaretciler.size && (Math.abs(hiz.x) > 0.05 || Math.abs(hiz.y) > 0.05)) {
            gorunum = surukle(gorunum, hiz.x, hiz.y); // bırakınca yavaşlayarak kayar
            hiz = { x: hiz.x * 0.92, y: hiz.y * 0.92 };
          }
          const { cx, cy } = bakisMerkezi();
          const olcek = etiketOlcegi(gorunum.R, Math.min(gen(), yuk()));
          ciz({ lon: gorunum.lon, lat: gorunum.lat, R: gorunum.R, cx, cy });
          const e = etiketKonumu(gorunum, cx, cy);
          turkiyeEtiketi.hidden = !e.gorunur;
          turkiyeEtiketi.style.transform = `translate(${e.x}px, ${e.y}px) translate(-50%, -50%) scale(${olcek})`;
          for (const i of isaretler) {
            const p = noktaKonumu(i.lon, i.lat, gorunum, cx, cy);
            i.el.hidden = !p.gorunur || (i.ulke && !acikUlkeler.has(i.ulke));
            i.el.style.transform = `translate(${p.x}px, ${p.y}px) scale(${olcek})`;
          }
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
    menu.hidden = true;
    for (const i of isaretler) i.el.hidden = true;
    acikUlkeler.clear();
    ucusHedefi = null;
    katman.classList.remove('etkilesimli');
    bitir(true);
  }

  cik.addEventListener('click', e => { e.stopPropagation(); kapat(); });
  document.addEventListener('keydown', e => { if (etkilesimli && e.key === 'Escape') kapat(); });
  katman.addEventListener('pointerdown', e => {
    if (!etkilesimli || cik.contains(e.target) || menu.contains(e.target) || e.target.closest('.kure-isaret--ulke')) return;
    ucusHedefi = null;
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
      const { cx, cy } = bakisMerkezi();
      const k = ekrandanKonum(e.clientX, e.clientY, gorunum, cx, cy);
      if (k && turkiyeIcindeMi(k.lon, k.lat)) kapat();
    }
    dokunus = null;
  };
  katman.addEventListener('pointerup', birak);
  katman.addEventListener('pointercancel', birak);
  katman.addEventListener('wheel', e => {
    if (!etkilesimli || !gorunum || menu.contains(e.target)) return;
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
