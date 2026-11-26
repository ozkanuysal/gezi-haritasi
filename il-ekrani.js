// İl ekranı: solda ilçe haritası ve gezi iğneleri, sağda gezi kartları.
// harita.js, durum il ekranını gösterdiğinde goster(plaka, renk), göstermediğinde gizle() çağırır.
const IL_EKRANI = (function () {
  const { ilGezileri, projeksiyon } = GEZI;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ATIF_MS = 5000; // OSM atıf kuralı: kendiliğinden en erken 5 sn sonra küçülebilir

  const bolum = document.getElementById('il-ekrani');
  const harita = document.getElementById('il-haritasi');
  const kartlar = document.getElementById('gezi-kartlari');
  const atif = document.getElementById('osm-atif');
  const etiket = document.getElementById('etiket');
  let acikPlaka = null;
  let atifZamani = null;
  let etiketZamani = null;

  function atifiGoster() {
    atif.classList.remove('kucuk');
    clearTimeout(atifZamani);
    atifZamani = setTimeout(() => atif.classList.add('kucuk'), ATIF_MS);
  }
  document.getElementById('osm-ac').addEventListener('click', atifiGoster);

  function el(ad, sinif, metin) {
    const e = document.createElement(ad);
    if (sinif) e.className = sinif;
    if (metin !== undefined) e.textContent = metin;
    return e;
  }
  function svgEl(ad, oznitelikler) {
    const e = document.createElementNS(SVG_NS, ad);
    for (const [k, v] of Object.entries(oznitelikler)) e.setAttribute(k, v);
    return e;
  }
  function baglanti(metin, url) {
    const a = el('a', null, metin);
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  }

  function haritayiCiz(plaka, renk) {
    const il = IL_HARITALARI[plaka];
    harita.setAttribute('viewBox', `0 0 ${il.genislik} ${il.yukseklik}`);
    harita.style.setProperty('--renk', renk);
    harita.replaceChildren();
    for (const ilce of il.ilceler) {
      const yol = svgEl('path', { d: ilce.d, class: 'ilce' });
      yol.dataset.ad = ilce.ad;
      harita.appendChild(yol);
    }
    ilGezileri(plaka).forEach((g, i) => {
      const { x, y } = projeksiyon(g.konum.enlem, g.konum.boylam, il.projeksiyon);
      const igne = svgEl('g', { class: 'igne' });
      igne.dataset.x = x;
      igne.dataset.y = y;
      igne.dataset.i = i;
      igne.dataset.ad = g.mekan;
      igne.append(svgEl('circle', { r: 16, class: 'igne-halka' }), svgEl('circle', { r: 8, class: 'igne-nokta' }));
      harita.appendChild(igne);
    });
    igneleriOlcekle();
  }

  // İğne ekranda hep aynı piksel boyunda kalsın (telefonda küçülüp kaybolmasın).
  function igneleriOlcekle() {
    if (!harita.clientWidth) return; // gizliyken ölçülemez; görününce ResizeObserver yeniden çağırır
    // Piksel başına birim: harita en ya da boydan hangisiyle sığıyorsa o (preserveAspectRatio meet).
    const vb = harita.viewBox.baseVal;
    const s = Math.max(vb.width / harita.clientWidth, vb.height / (harita.clientHeight || 1));
    for (const igne of harita.querySelectorAll('.igne')) {
      igne.setAttribute('transform', `translate(${igne.dataset.x} ${igne.dataset.y}) scale(${s})`);
    }
  }
  new ResizeObserver(igneleriOlcekle).observe(harita);

  function kart(g, i) {
    const k = el('article', 'gezi-karti');
    k.id = `gezi-${i}`;
    if (g.fotograf) {
      const kutu = el('div', 'gezi-foto');
      const img = el('img');
      img.src = g.fotograf.dosya;
      img.alt = g.mekan;
      kutu.appendChild(img);
      const kaynak = el('p', 'foto-kaynak');
      kaynak.append('Fotoğraf: ', baglanti(g.fotograf.yazar, g.fotograf.kaynakUrl), ' · ',
        baglanti(g.fotograf.lisans, g.fotograf.lisansUrl));
      k.append(kutu, kaynak);
    }
    k.append(el('h3', null, g.mekan),
      el('p', 'gezi-bilgi', `${g.tur} · ${g.hafta}. hafta`),
      el('p', 'gezi-bilgi', `${g.sinif}. sınıf · ${g.ders}`),
      el('h4', null, 'Anahtar kelimeler'));
    const anahtarlar = el('ul', 'anahtarlar');
    for (const a of g.anahtarKelimeler) anahtarlar.appendChild(el('li', null, a));
    k.append(anahtarlar, el('h4', null, 'Kazanımlar'));
    const kazanimlar = el('ul', 'kazanimlar');
    for (const { kod, metin } of g.kazanimlar) {
      const li = el('li');
      if (kod) li.append(el('strong', null, kod), ' ');
      li.append(metin);
      kazanimlar.appendChild(li);
    }
    k.appendChild(kazanimlar);
    return k;
  }

  function goster(plaka, renk) {
    bolum.hidden = false;
    if (acikPlaka !== plaka) {
      haritayiCiz(plaka, renk);
      kartlar.replaceChildren(...ilGezileri(plaka).map(kart));
      acikPlaka = plaka;
    }
    atifiGoster();
  }

  function gizle() {
    bolum.hidden = true;
    clearTimeout(atifZamani);
  }

  // İğneye tıklayınca ilgili kart görünür alana gelir ve kısa süre vurgulanır.
  harita.addEventListener('click', e => {
    const igne = e.target.closest('.igne');
    if (igne) {
      const k = document.getElementById(`gezi-${igne.dataset.i}`);
      k.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      k.classList.add('vurgu');
      setTimeout(() => k.classList.remove('vurgu'), 1500);
      return;
    }
    // Dokunmatikte ilçe adı kısa süre görünür (farede pointerover gösterir).
    const ilce = e.target.closest('.ilce');
    if (!ilce || e.pointerType === 'mouse') return;
    etiketiGoster(ilce.dataset.ad, e.clientX, e.clientY);
    clearTimeout(etiketZamani);
    etiketZamani = setTimeout(() => { etiket.hidden = true; }, 1500);
  });

  function etiketiGoster(metin, x, y) {
    etiket.textContent = metin;
    etiket.style.left = `${x}px`;
    etiket.style.top = `${y + 22}px`;
    etiket.hidden = false;
  }
  harita.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const hedef = e.target.closest('.ilce, .igne');
    if (hedef) etiketiGoster(hedef.dataset.ad, e.clientX, e.clientY);
    else etiket.hidden = true;
  });
  harita.addEventListener('pointerleave', () => { etiket.hidden = true; });

  return { goster, gizle };
})();
