#!/usr/bin/env bash
# Görsel kontrol: sayfanın ekran görüntüsünü headless Edge ile alır (WSL).
# Kullanım: tests/ekran.sh <hash> <GxY> <cikti.png>
#   örn.   tests/ekran.sh ege 1440x900 ege.png      (hash boş: "")
# ADRES verilirse dosya kopyalanmaz, o adres çekilir:
#   ADRES=https://ozkanuysal.github.io/gezi-haritasi/ tests/ekran.sh ege 1440x900 canli.png
set -euo pipefail

hash="$1"; boyut="$2"; cikti="$3"
kok="$(cd "$(dirname "$0")/.." && pwd)"
dizin="${ONIZLEME_DIZIN:-/mnt/c/Users/$USER/AppData/Local/Temp/gezi-onizleme}"
edge="/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"

mkdir -p "$dizin"
if [ -n "${ADRES:-}" ]; then
  url="$ADRES"
else
  cp "$kok"/index.html "$kok"/*.js "$kok"/*.css "$dizin"/
  url="file:///$(wslpath -m "$dizin/index.html")"
fi
[ -n "$hash" ] && url="$url#$hash"

# Headless pencere ~500 pikselden dara inmiyor: dar ekranlar için sayfa o genişlikte bir iframe'e konur.
gen="${boyut%x*}"; yuk="${boyut#*x}"; pencere="$gen,$yuk"
if [ "$gen" -lt 500 ]; then
  printf '<!doctype html><body style="margin:0"><iframe src="%s" width="%s" height="%s" style="border:0;display:block"></iframe>' \
    "$url" "$gen" "$yuk" > "$dizin/cerceve.html"
  url="file:///$(wslpath -m "$dizin/cerceve.html")"
  pencere="500,$yuk"
fi

png="$dizin/goruntu-$$.png"
"$edge" --headless=new --disable-gpu --hide-scrollbars \
  --window-size="$pencere" --virtual-time-budget=4000 \
  --user-data-dir="$(wslpath -w "$dizin/profil")" \
  --screenshot="$(wslpath -w "$png")" "$url" >/dev/null 2>&1 || true

if [ ! -f "$png" ]; then
  # COMODO korumalı alanı yazıları C:\VTRoot altına yönlendirebilir.
  sanal="/mnt/c/VTRoot/HarddiskVolume3${png#/mnt/c}"
  [ -f "$sanal" ] && png="$sanal"
fi
[ -f "$png" ] || { echo "ekran görüntüsü alınamadı: $url" >&2; exit 1; }
mv "$png" "$cikti"
echo "$cikti ($url)"
