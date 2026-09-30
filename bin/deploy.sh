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

# Every local script, stylesheet and import must carry the stamp.
if grep -rn -- '?v=dev' "$out" \
  || grep -nE "from '\./[^'?]+'" "$out"/*.js \
  || grep -nE '(src|href)="[a-z]+\.(js|css)"' "$out/index.html"; then
  echo "deploy: an asset address is not stamped, see above" >&2
  exit 1
fi

cd /tmp # wrangler writes wrangler.jsonc into its working directory
set -a; . "$env_file"; set +a
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_PAGES_TOKEN" npx wrangler pages deploy "$out" --project-name ccc --branch main
echo "deploy: stamped v=$v"
