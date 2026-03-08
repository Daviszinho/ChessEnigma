#!/usr/bin/env bash
TOKEN="${1:-$GITHUB_TOKEN}"
REPO="Daviszinho/ChessEnigma"
DAYS="${2:-30}"

page=1
while true; do
  data=$(curl -s -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$REPO/actions/artifacts?per_page=100&page=$page")
  ids=$(echo "$data" | jq -r '.artifacts[]?.id')
  if [ -z "$ids" ]; then
    break
  fi
  for id in $ids; do
    created=$(echo "$data" | jq -r ".artifacts[] | select(.id == $id) | .created_at")
    # fecha actual en segundos
    now=$(date +%s)
    # parsea created_at (RFC3339) a segundos
    created_sec=$(date -d "$created" +%s)
    age_days=$(( (now - created_sec) / 86400 ))
    if [ "$age_days" -ge "$DAYS" ]; then
      curl -s -X DELETE -H "Authorization: token $TOKEN" \
        -H "Accept: application/vnd.github+json" \
        "https://api.github.com/repos/$REPO/actions/artifacts/$id" \
        && echo "Deleted artifact $id (age ${age_days}d)"
    fi
  done
  page=$((page + 1))
done
