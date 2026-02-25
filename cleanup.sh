#!/usr/bin/env bash
set -euo pipefail

REPO="Daviszinho/ChessEnigma"  # repo objetivo
PER_PAGE=100
DAYS="${1:-30}"               # días de retención; valor por defecto 30
TOKEN="${GITHUB_TOKEN:-}"      # token de acceso en variable de entorno

if [[ -z "$TOKEN" ]]; then
  echo "ERROR: GITHUB_TOKEN env var no está seteado." >&2
  exit 1
fi

page=1
deleted_any=0

while : ; do
  resp=$(curl -sS -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$REPO/actions/artifacts?per_page=$PER_PAGE&page=$page")
  artifacts=$(echo "$resp" | jq -r '.artifacts[] | "\(.id)\t\(.created_at)"')
  if [[ -z "$artifacts" ]]; then
    break
  fi

  while IFS=$'\t' read -r id created; do
    if [[ -z "$id" || -z "$created" ]]; then continue; fi
    created_sec=$(date -d "$created" +%s)
    age=$(( ( $(date +%s) - created_sec ) / 86400 ))
    if (( age >= DAYS )); then
      del_code=$(curl -sS -o /dev/null -w "%{http_code}" -X DELETE \
        -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github+json" \
        "https://api.github.com/repos/$REPO/actions/artifacts/$id")
      if [[ "$del_code" == "204" ]]; then
        echo "Deleted artifact $id (age ${age}d)"
        deleted_any=$((deleted_any+1))
      else
        echo "No se pudo eliminar artifact $id (HTTP $del_code)" >&2
      fi
    fi
  done <<< "$artifacts"

  page=$((page+1))
done

echo "Done. Artefactos eliminados: $deleted_any"
