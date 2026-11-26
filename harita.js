// Haritayı sayfaya bağlar: olayları cekirdek.js'e verir, çıkan durumu ciz() ile çizer.
(function () {
  const { bolgeBul, ilAdiSade, hashtenBolge, sonrakiDurum, kutuBirlestir } = GEZI;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const TAM = { x: 0, y: 0, width: 1007.478, height: 527.323 };
  const GECIS_MS = 500;

  const svg = document.getElementById('svg-turkiye-haritasi');
  const geri = document.getElementById('geri');
  const baslik = document.getElementById('bolge-basligi');
  const kart = document.getElementById('kart');
  const kartIl = document.getElementById('kart-il');
  const kartBolge = document.getElementById('kart-bolge');
  const etiket = document.getElementById('etiket');

  const bolgeById = Object.fromEntries(BOLGELER.map(b => [b.id, b]));
  const ilGruplari = [...svg.querySelectorAll('g[data-plakakodu]')];

  // Hazırlık: her ile bölgesini ve rengini ver; bölgesizler (Kıbrıs) gri kalır.
  for (const g of ilGruplari) {
    const bolge = bolgeBul(Number(g.dataset.plakakodu));
    if (bolge) {
      g.dataset.bolge = bolge;
      g.style.setProperty('--renk', bolgeById[bolge].renk);
    } else {
      g.classList.add('bolgesiz');
    }
  }
  svg.querySelector('#guney-kibris').classList.add('bolgesiz');

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
    adlar.appendChild(yazi);
  }
  svg.appendChild(adlar);

  let durum = { bolge: null, plaka: null };
  let kutu = { ...TAM };
  let hedef = TAM;
  let kare = null;

  const viewBoxYaz = k => svg.setAttribute('viewBox', `${k.x} ${k.y} ${k.width} ${k.height}`);

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
    svg.classList.toggle('bolge-acik', !!bolge);
    if (bolge) { bolgeVurgula(uzerindeki, false); uzerindeki = null; }
    for (const g of ilGruplari) {
      g.classList.toggle('soluk', !!bolge && g.dataset.bolge !== bolge);
      g.classList.toggle('secili', plaka !== null && Number(g.dataset.plakakodu) === plaka);
    }
    geri.hidden = !bolge;
    baslik.textContent = bolge ? bolgeById[bolge].ad : 'Türkiye';
    kart.hidden = plaka === null;
    if (plaka !== null) {
      const g = ilGruplari.find(x => Number(x.dataset.plakakodu) === plaka);
      kartIl.textContent = ilAdiSade(g.dataset.iladi);
      kartBolge.textContent = bolgeById[bolge].ad;
    }
    yakinlas(bolge ? bolgeKutusu[bolge] : TAM, aninda);
  }

  function uygula(olay) {
    const eski = durum;
    durum = sonrakiDurum(durum, olay);
    if (durum.bolge !== eski.bolge && olay.tur !== 'hash') location.hash = durum.bolge || '';
    ciz(false);
  }

  // Olaylar
  svg.addEventListener('click', e => {
    const g = e.target.closest('g[data-bolge]');
    if (g) uygula({ tur: 'tik', plaka: Number(g.dataset.plakakodu) });
  });
  geri.addEventListener('click', () => uygula({ tur: 'geri' }));
  window.addEventListener('hashchange', () => {
    if (hashtenBolge(location.hash) !== durum.bolge) uygula({ tur: 'hash', hash: location.hash });
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
})();
