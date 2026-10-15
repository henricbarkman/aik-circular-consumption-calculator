#!/usr/bin/env bash
# Publish app/ to Cloudflare Pages with every local asset address stamped by a
# fingerprint of the files. The henricbarkman.se zone keeps .js and .css in
# browsers for four hours regardless of _headers, and HTML is always fresh, so
# without a new address a deploy runs new HTML against old cached scripts.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
env_file="${CCC_ENV:-$HOME/generalassistant/.env}"
out="$(mktemp -d)"
cp -r "$root/app/." "$out/"

v="$(cd "$root/app" && find . -type f -print0 | sort -z | xargs -0 sha256sum | sha256sum | cut -c1-10)"
grep -rlZ -- '?v=dev' "$out" | xargs -0 sed -i "s/?v=dev/?v=$v/g"

# Every local script, stylesheet and import must carry the stamp: any address
# ending in .js, .mjs or .css, quoted, in backticks or as a bare attribute, in
# the page or in any script or stylesheet outside vendor/, that does not carry
# this deploy's ?v=. External addresses (https://...) are left alone.
unstamped() {
  local files
  mapfile -t files < <(find "$out" -path "$out/vendor" -prune -o -type f \( -name '*.html' -o -name '*.js' -o -name '*.mjs' -o -name '*.css' \) -print)
  {
    grep -noE "[\"'\`][^\"'\` ]+\.(js|mjs|css)(\?[^\"'\` ]*)?[\"'\`]" "${files[@]}" | grep -v -- "?v=$v[\"'\`]"
    grep -noE "(src|href)=[^\"'\` >]+\.(js|mjs|css)[^\"'\` >]*" "${files[@]}" | grep -v -- "?v=$v"
    grep -noE "url\([^)\"'\` ]+\.(js|mjs|css)[^)]*\)" "${files[@]}" | grep -v -- "?v=$v"
  } | grep -vE "https?://" || true
}
if grep -rn -- '?v=dev' "$out" || [ -n "$(unstamped)" ]; then
  unstamped
  echo "deploy: an asset address is not stamped, see above" >&2
  exit 1
fi

cd /tmp # wrangler writes wrangler.jsonc into its working directory
set -a; . "$env_file"; set +a
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_PAGES_TOKEN" npx wrangler pages deploy "$out" --project-name ccc --branch main
echo "deploy: stamped v=$v"
