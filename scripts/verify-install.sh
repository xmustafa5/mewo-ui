#!/usr/bin/env bash
# Installs every catalog item into a fresh consumer app from a local server, then typechecks it.
# This is what the shadcn registry directory's health checker measures — run it before deploying.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-3999}"
WORK="${VERIFY_DIR:-$(mktemp -d)}"
SERVER_PID=""

# `npx next start &` backgrounds the npm-exec wrapper, not next-server itself:
# next-server is a CHILD of that wrapper, so killing $! alone leaves it bound
# to $PORT. Resolve the real listening pid from the port instead, and verify
# the port is actually released before declaring cleanup done.
port_pid() {
  ss -ltnp "( sport = :$PORT )" 2>/dev/null | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -n1
}

port_free() {
  if ss -ltn "( sport = :$PORT )" 2>/dev/null | grep -q ":$PORT"; then
    return 1
  fi
  return 0
}

cleanup() {
  local status=$?
  if [[ -n "$SERVER_PID" ]]; then
    local real_pid
    real_pid="$(port_pid)"
    [[ -n "$real_pid" ]] && kill "$real_pid" 2>/dev/null || true
    kill "$SERVER_PID" 2>/dev/null || true
    for _ in $(seq 1 15); do
      port_free && break
      sleep 1
    done
    if ! port_free; then
      real_pid="$(port_pid)"
      [[ -n "$real_pid" ]] && kill -9 "$real_pid" 2>/dev/null || true
      sleep 1
    fi
    if ! port_free; then
      echo "✘ port $PORT still bound after cleanup" >&2
      exit 1
    fi
  fi
  exit "$status"
}
trap cleanup EXIT

echo "▶ building registry and site"
cd "$ROOT"
npm run build

echo "▶ serving on :$PORT"
npx next start -p "$PORT" >"$WORK/server.log" 2>&1 &
SERVER_PID=$!
for _ in $(seq 1 30); do
  curl -sf "http://localhost:$PORT/r/registry.json" >/dev/null && break
  sleep 1
done
curl -sf "http://localhost:$PORT/r/registry.json" >/dev/null || { echo "server did not start"; cat "$WORK/server.log"; exit 1; }

echo "▶ scaffolding consumer app in $WORK/consumer"
cd "$WORK"
npx --yes create-next-app@latest consumer --ts --tailwind --eslint --app --import-alias "@/*" --use-npm --yes --disable-git
cd consumer
npx --yes shadcn@latest init -d
node -e '
  const fs = require("fs");
  const config = JSON.parse(fs.readFileSync("components.json", "utf8"));
  config.registries = { "@mewo": process.argv[1] };
  fs.writeFileSync("components.json", JSON.stringify(config, null, 2));
' "http://localhost:$PORT/r/{name}.json"

ITEMS="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).items.map((i) => i.name).join(" "))' "$ROOT/registry.json")"
for item in $ITEMS; do
  echo "▶ npx shadcn add @mewo/$item"
  npx --yes shadcn@latest add "@mewo/$item" -y -o
done

echo "▶ typechecking consumer"
npx tsc --noEmit
echo "✔ $(echo "$ITEMS" | wc -w | tr -d ' ') items installed and typechecked"
