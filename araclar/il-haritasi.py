#!/usr/bin/env python3
"""Bir ilin ilçe haritasını OpenStreetMap'ten üretir: iller/<plaka>.js

Kullanım:  python3 -I araclar/il-haritasi.py 34 İstanbul

- Overpass: ilin (admin_level=4) içindeki ilçe (admin_level=6) ilişkileri.
- Nominatim lookup: sadeleştirilmiş sınırlar (polygon_threshold), tek istek.
- Projeksiyon: eşdikdörtgen, x = (boylam - lon0) * kos * olcek, y = (lat0 - enlem) * olcek
  (cekirdek.js projeksiyon() ile aynı). Genişlik 1000 birim, 10 birim kenar boşluğu.
Veri © OpenStreetMap katkıcıları, ODbL 1.0 — sayfada atıf zorunlu.
"""
import datetime
import json
import math
import pathlib
import sys
import urllib.parse
import urllib.request

UA = {'User-Agent': 'gezi-haritasi-il-haritasi/1.0'}
OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
GENISLIK, BOSLUK = 1000, 10


def istek(url, veri=None):
    govde = urllib.parse.urlencode(veri).encode() if veri else None
    with urllib.request.urlopen(urllib.request.Request(url, govde, UA), timeout=90) as y:
        return json.load(y)


def ilceler(il_adi):
    sorgu = (f'[out:json][timeout:60];area["name"="{il_adi}"]["admin_level"="4"]'
             '["boundary"="administrative"]->.a;'
             'rel(area.a)["boundary"="administrative"]["admin_level"="6"];out tags;')
    for url in OVERPASS:
        try:
            return {e['id']: e['tags']['name'] for e in istek(url, {'data': sorgu})['elements']}
        except Exception as hata:  # sunucu meşgulse sıradakini dene
            print(f'{url}: {hata}', file=sys.stderr)
    sys.exit('Overpass yanıt vermedi')


def sinirlar(adlar):
    q = urllib.parse.urlencode({
        'osm_ids': ','.join(f'R{i}' for i in adlar), 'format': 'geojson',
        'polygon_geojson': 1, 'polygon_threshold': 0.001})
    ozellikler = istek(f'https://nominatim.openstreetmap.org/lookup?{q}')['features']
    sonuc = []
    for f in ozellikler:
        g = f['geometry']
        cokgenler = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        sonuc.append((adlar[f['properties']['osm_id']], [halka for c in cokgenler for halka in c]))
    return sorted(sonuc, key=lambda s: s[0])


def main():
    plaka, il_adi = int(sys.argv[1]), sys.argv[2]
    adlar = ilceler(il_adi)
    veri = sinirlar(adlar)
    noktalar = [n for _, halkalar in veri for h in halkalar for n in h]
    lon_min, lon_max = min(n[0] for n in noktalar), max(n[0] for n in noktalar)
    lat_min, lat_max = min(n[1] for n in noktalar), max(n[1] for n in noktalar)
    kos = math.cos(math.radians((lat_min + lat_max) / 2))
    olcek = (GENISLIK - 2 * BOSLUK) / ((lon_max - lon_min) * kos)
    p = {'lon0': lon_min - BOSLUK / (kos * olcek), 'lat0': lat_max + BOSLUK / olcek, 'kos': kos, 'olcek': olcek}

    def nokta(lon, lat):
        return f"{round((lon - p['lon0']) * kos * olcek, 1)},{round((p['lat0'] - lat) * olcek, 1)}"

    il = {
        'genislik': GENISLIK,
        'yukseklik': round((lat_max - lat_min) * olcek + 2 * BOSLUK, 1),
        'projeksiyon': p,
        'ilceler': [],
    }
    for ad, halkalar in veri:
        parcalar = []
        for h in halkalar:
            ns = []
            for lon, lat in h:
                n = nokta(lon, lat)
                if not ns or ns[-1] != n:
                    ns.append(n)
            parcalar.append('M' + ' L'.join(ns) + ' Z')
        il['ilceler'].append({'ad': ad, 'd': ' '.join(parcalar)})

    hedef = pathlib.Path(__file__).resolve().parent.parent / 'iller' / f'{plaka}.js'
    hedef.parent.mkdir(exist_ok=True)
    hedef.write_text(
        f'// {il_adi} ilçe haritası — araclar/il-haritasi.py ile üretildi ({datetime.date.today()}).\n'
        '// Veri © OpenStreetMap katkıcıları, ODbL 1.0 (https://www.openstreetmap.org/copyright).\n'
        'var IL_HARITALARI = IL_HARITALARI || {};\n'
        f'IL_HARITALARI[{plaka}] = {json.dumps(il, ensure_ascii=False)};\n'
        "if (typeof module === 'object') module.exports = IL_HARITALARI;\n",
        encoding='utf-8')
    print(f'{hedef}: {len(il["ilceler"])} ilçe, {len(noktalar)} nokta')


if __name__ == '__main__':
    main()
