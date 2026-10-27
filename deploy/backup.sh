#!/usr/bin/env bash
# Sauvegarde la base SQLite et les photos. À lancer chaque jour avec cron, par exemple :
#   0 3 * * * /home/ubuntu/dakar-accueil-2026/deploy/backup.sh >> /home/ubuntu/backup.log 2>&1
# Nécessite : sudo apt install sqlite3
set -euo pipefail
cd "$(dirname "$0")/../backend"
DEST="${1:-$HOME/backups}"
STAMP="$(date +%F-%H%M)"
mkdir -p "$DEST"
sqlite3 data/dakar-accueil.db ".backup '$DEST/db-$STAMP.sqlite'"
tar -czf "$DEST/uploads-$STAMP.tgz" -C data uploads
find "$DEST" -type f -mtime +14 -delete   # garde 14 jours
echo "Sauvegarde $STAMP ok"
