// Haritayı sayfaya bağlar: olayları cekirdek.js'e verir, çıkan durumu ciz() ile çizer.
(function () {
  const { bolgeBul, ilAdiSade, sonrakiDurum, kutuBirlestir, ilEkraniMi, hashtenDurum, durumdanHash } = GEZI;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const GECIS_MS = 500;

  const svg = document.getElementById('svg-turkiye-haritasi');
  const geri = document.getElementById('geri');
  const baslik = document.getElementById('bolge-basligi');
  const kart = document.getElementById('kart');
  const kartIl = document.getElementById('kart-il');
  const kartBolge = document.getElementById('kart-bolge');
  const etiket = document.getElementById('etiket');
  const haritaKutusu = document.querySelector('.harita');

  const bolgeById = Object.fromEntries(BOLGELER.map(b => [b.id, b]));
  const ilGruplari = [...svg.querySelectorAll('g[data-plakakodu]')];

  // Hazırlık: her ile bölgesini ve rengini ver.
  for (const g of ilGruplari) {
    const bolge = bolgeBul(Number(g.dataset.plakakodu));
    g.dataset.bolge = bolge;
    g.style.setProperty('--renk', bolgeById[bolge].renk);
  }

  // Tam görünüm: Türkiye'nin kendi sınır kutusu; kutunun en-boy oranı CSS'e verilir.
  const TAM = kutuBirlestir([svg.querySelector('#turkiye').getBBox()], 10);
  svg.style.setProperty('--oran', `${TAM.width} / ${TAM.height}`);

  const gruplar = id => ilGruplari.filter(g => g.dataset.bolge === id);
  const bolgeKutusu = Object.fromEntries(BOLGELER.map(b =>
    [b.id, kutuBirlestir(gruplar(b.id).map(g => g.getBBox()), 20)]));

  // Bölge adları: kutunun ortasına (ya da bolgeler.js'teki etiket konumuna), çok kelimeliyse iki satır.
  const adlar = document.createElementNS(SVG_NS, 'g');
  adlar.setAttribute('class', 'bolge-adlari');
  for (const b of BOLGELER) {
    const k = bolgeKutusu[b.id];
    const konum = b.etiket || { x: k.x + k.width / 2, y: k.y + k.height / 2 };
    const satirlar = b.ad.replace(/ Bölgesi$/, '').split(' ');
    const yazi = document.createElementNS(SVG_NS, 'text');
    yazi.setAttribute('class', 'bolge-adi');
    satirlar.forEach((s, i) => {
      const t = document.createElementNS(SVG_NS, 'tspan');
      t.setAttribute('x', konum.x);
      t.setAttribute('dy', i === 0 ? `${0.35 - (satirlar.length - 1) * 0.55}em` : '1.1em');
      t.textContent = s;
      yazi.appendChild(t);
    });
    yazi.setAttribute('y', konum.y);
    const zemin = document.createElementNS(SVG_NS, 'rect');
    zemin.setAttribute('class', 'bolge-zemin');
    const grup = document.createElementNS(SVG_NS, 'g');
    grup.append(zemin, yazi);
    adlar.appendChild(grup);
  }
  svg.appendChild(adlar);

  // Gezisi olan iller (geziler.js): Türkiye görünümünde adı yazar, tıklayınca il ekranı açılır.
  const ilEtiketleri = document.createElementNS(SVG_NS, 'g');
  ilEtiketleri.setAttribute('class', 'il-etiketleri');
  for (const plaka of new Set(GEZILER.map(g => g.plaka))) {
    const parcalar = ilGruplari.filter(g => Number(g.dataset.plakakodu) === plaka);
    const k = kutuBirlestir(parcalar.map(g => g.getBBox()), 0);
    const x = k.x + k.width / 2, y = k.y + k.height / 2;
    const grup = document.createElementNS(SVG_NS, 'g');
    grup.setAttribute('class', 'il-etiketi');
    grup.dataset.plaka = plaka;
    grup.dataset.x = x;
    grup.dataset.y = y;
    const nokta = document.createElementNS(SVG_NS, 'circle');
    nokta.setAttribute('class', 'il-noktasi');
    nokta.setAttribute('cx', x);
    nokta.setAttribute('cy', y);
    nokta.setAttribute('r', 3.5);
    const zemin = document.createElementNS(SVG_NS, 'rect');
    zemin.setAttribute('class', 'il-zemin');
    const yazi = document.createElementNS(SVG_NS, 'text');
    yazi.setAttribute('class', 'il-adi');
    yazi.setAttribute('x', x);
    yazi.setAttribute('y', y - 9);
    yazi.textContent = ilAdiSade(parcalar[0].dataset.iladi);
    grup.append(nokta, zemin, yazi);
    ilEtiketleri.appendChild(grup);
  }
  svg.appendChild(ilEtiketleri);
  ilEtiketleri.addEventListener('click', e => {
    const g = e.target.closest('.il-etiketi');
    if (!g) return;
    e.stopPropagation();
    uygula({ tur: 'il-ac', plaka: Number(g.dataset.plaka) });
  });

  // Etiket zeminleri yazının ölçüsüne göre; yazı boyu ekran genişliğiyle değiştiği için
  // etiketler her göründüğünde yeniden ölçülür.
  function zeminleriBoyutla() {
    for (const grup of [...adlar.children, ...ilEtiketleri.children]) {
      const zemin = grup.querySelector('rect');
      const yazi = grup.querySelector('text');
      const k = yazi.getBBox();
      if (!k.width) continue; // gizli etiket ölçülemez; görününce yeniden ölçülür
      const fs = parseFloat(getComputedStyle(yazi).fontSize);
      zemin.setAttribute('x', k.x - fs * .5);
      zemin.setAttribute('y', k.y - fs * .2);
      zemin.setAttribute('width', k.width + fs);
      zemin.setAttribute('height', k.height + fs * .4);
      zemin.setAttribute('rx', fs * .45);
    }
  }
  matchMedia('(max-width: 600px)').addEventListener('change', () => zeminleriBoyutla());

  let durum = { bolge: null, plaka: null };
  let kutu = { ...TAM };
  let hedef = TAM;
  let kare = null;

  // İl etiketleri yakınlaşınca büyümesin: noktaları çevresinde ters ölçeklenir.
  function viewBoxYaz(k) {
    svg.setAttribute('viewBox', `${k.x} ${k.y} ${k.width} ${k.height}`);
    // Piksel başına birim: kutu en ya da boydan hangisiyle sığıyorsa o (preserveAspectRatio meet).
    const cw = svg.clientWidth || 1, ch = svg.clientHeight || 1;
    const s = Math.max(k.width / cw, k.height / ch) / Math.max(TAM.width / cw, TAM.height / ch);
    for (const g of ilEtiketleri.children) {
      const { x, y } = g.dataset;
      g.setAttribute('transform', `translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`);
    }
  }

  function yakinlas(yeniHedef, aninda) {
    if (yeniHedef === hedef && !aninda) return;
    hedef = yeniHedef;
    cancelAnimationFrame(kare);
    if (aninda) { kutu = { ...hedef }; viewBoxYaz(kutu); return; }
    const bas = { ...kutu };
    const t0 = performance.now();
    const adim = simdi => {
      const t = Math.min(1, (simdi - t0) / GECIS_MS);
      const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      for (const a of ['x', 'y', 'width', 'height']) kutu[a] = bas[a] + (hedef[a] - bas[a]) * e;
      viewBoxYaz(kutu);
      if (t < 1) kare = requestAnimationFrame(adim);
    };
    kare = requestAnimationFrame(adim);
  }

  function ciz(aninda) {
    const { bolge, plaka } = durum;
    const ilde = ilEkraniMi(durum);
    haritaKutusu.hidden = ilde; // önce görünür olmalı: gizli SVG'de getBBox() sıfır döner
    svg.classList.toggle('bolge-acik', !!bolge);
    document.body.classList.toggle('il-modu', ilde);
    if (bolge) { bolgeVurgula(uzerindeki, false); uzerindeki = null; }
    // Bölge açıkken yalnızca o bölgedeki gezili illerin etiketi görünür.
    for (const g of ilEtiketleri.children) {
      g.classList.toggle('gizli', !!bolge && bolgeBul(Number(g.dataset.plaka)) !== bolge);
    }
    zeminleriBoyutla();
    for (const g of ilGruplari) {
      g.classList.toggle('soluk', !!bolge && g.dataset.bolge !== bolge);
      g.classList.toggle('secili', plaka !== null && Number(g.dataset.plakakodu) === plaka);
    }
    const ilAdi = plaka === null ? '' :
      ilAdiSade(ilGruplari.find(x => Number(x.dataset.plakakodu) === plaka).dataset.iladi);
    geri.hidden = !bolge;
    geri.textContent = ilde ? `← ${bolgeById[bolge].ad.replace(/ Bölgesi$/, '')}` : '← Türkiye';
    baslik.textContent = ilde ? ilAdi : bolge ? bolgeById[bolge].ad : '';
    kart.hidden = plaka === null || ilde;
    if (plaka !== null && !ilde) {
      kartIl.textContent = ilAdi;
      kartBolge.textContent = bolgeById[bolge].ad;
    }
    if (ilde) IL_EKRANI.goster(plaka, bolgeById[bolge].renk);
    else IL_EKRANI.gizle();
    yakinlas(bolge ? bolgeKutusu[bolge] : TAM, aninda);
  }

  function uygula(olay) {
    const eskiAdres = durumdanHash(durum);
    durum = sonrakiDurum(durum, olay);
    const yeniAdres = durumdanHash(durum);
    if (yeniAdres !== eskiAdres && olay.tur !== 'hash') location.hash = yeniAdres;
    ciz(false);
  }

  // Olaylar
  svg.addEventListener('click', e => {
    const g = e.target.closest('g[data-bolge]');
    if (g) uygula({ tur: 'tik', plaka: Number(g.dataset.plakakodu) });
  });
  geri.addEventListener('click', () => uygula(ilEkraniMi(durum) ? { tur: 'bolgeye-don' } : { tur: 'geri' }));
  window.addEventListener('hashchange', () => {
    if (durumdanHash(hashtenDurum(location.hash)) !== durumdanHash(durum)) uygula({ tur: 'hash', hash: location.hash });
  });

  // Fare yazısı ve bölge vurgusu yalnızca fareyle: dokunmada ekranda takılı kalmasın.
  let uzerindeki = null;
  svg.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const g = e.target.closest('g[data-bolge]');
    if (!g) return;
    const id = g.dataset.bolge;
    const turkiyede = !durum.bolge;
    etiket.textContent = turkiyede || id !== durum.bolge ? bolgeById[id].ad : ilAdiSade(g.dataset.iladi);
    etiket.hidden = false;
    if (turkiyede && uzerindeki !== id) {
      bolgeVurgula(uzerindeki, false);
      bolgeVurgula(id, true);
      uzerindeki = id;
    }
  });
  svg.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    etiket.style.left = `${e.clientX}px`;
    etiket.style.top = `${e.clientY + 22}px`;
  });
  svg.addEventListener('pointerleave', () => {
    etiket.hidden = true;
    bolgeVurgula(uzerindeki, false);
    uzerindeki = null;
  });
  svg.addEventListener('pointerout', e => {
    if (e.pointerType !== 'mouse') return;
    if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('g[data-bolge]')) etiket.hidden = true;
  });

  function bolgeVurgula(id, acik) {
    if (id) for (const g of gruplar(id)) g.classList.toggle('uzerinde', acik);
  }

  // Açılış: adresteki bölgeyi aç.
  durum = sonrakiDurum(durum, { tur: 'hash', hash: location.hash });
  ciz(true);

  // Açı Schools açılış ekranı: ~2 sn sonra ya da dokununca kaybolur.
  const acilis = document.getElementById('acilis');
  const acilisiKapat = () => {
    if (acilis.classList.contains('bitti')) return;
    acilis.classList.add('bitti');
    // Ana sayfa açılışında Açı ekranından sonra küre oynar (kure.js); değilse no-op.
    KURE.baslat(() => svg.querySelector('#turkiye').getBoundingClientRect());
    setTimeout(() => acilis.remove(), 700);
  };
  acilis.addEventListener('click', acilisiKapat);
  setTimeout(acilisiKapat, 2200);
})();
