#!/usr/bin/env bash
# Imports the old system's database (phpMyAdmin export) into the live VPS database.
# Run on the VPS:   bash run-import.sh /path/to/ecgbc_db.sql
#
# Steps: back up live DB -> load dump into ecgbc_staging -> stop API -> import-old-system.sql
#        -> verify -> start API. The live DB is only changed in one transaction (step 4).
set -euo pipefail

DUMP="${1:?Usage: bash run-import.sh /path/to/ecgbc_db.sql}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# apps/backend: two levels up when run from the repo, otherwise the default deploy location
if [ -z "${BACKEND_DIR:-}" ]; then
  if [ -f "$SCRIPT_DIR/../../docker-compose.yml" ]; then
    BACKEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
  else
    BACKEND_DIR="$HOME/ecgbc-registration/apps/backend"
  fi
fi
[ -f "$BACKEND_DIR/docker-compose.yml" ] || { echo "docker-compose.yml not found in $BACKEND_DIR (set BACKEND_DIR)"; exit 1; }
BACKUP_DIR="$HOME/db-backups"
DB_CONTAINER="ecgbc-db"

# mysql as root inside the DB container (password never leaves the container)
db() {
  docker exec -i "$DB_CONTAINER" sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot --default-character-set=utf8mb4 "$@"' sh "$@"
}

step() { echo; echo "==> $*"; }

[ -f "$DUMP" ] || { echo "Dump not found: $DUMP"; exit 1; }
grep -q "CREATE TABLE \`member\`" "$DUMP" || { echo "This does not look like the ecgbc dump (no member table)."; exit 1; }

# ---------------------------------------------------------------------------
step "1/6 Backing up the live database"
mkdir -p "$BACKUP_DIR"
BACKUP="$BACKUP_DIR/ecgbc_db-before-import-$(date +%Y%m%d-%H%M%S).sql.gz"
docker exec "$DB_CONTAINER" sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction --routines --triggers --default-character-set=utf8mb4 "$MYSQL_DATABASE"' | gzip > "$BACKUP"
[ "$(stat -c %s "$BACKUP")" -gt 100000 ] || { echo "Backup looks too small, stopping: $BACKUP"; exit 1; }
echo "Backup: $BACKUP ($(du -h "$BACKUP" | cut -f1))"

# ---------------------------------------------------------------------------
step "2/6 Loading the dump into ecgbc_staging (live data not touched)"
db -e "DROP DATABASE IF EXISTS ecgbc_staging; CREATE DATABASE ecgbc_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
db ecgbc_staging < "$DUMP"
db -t -e "SELECT 'member' tbl, COUNT(*) n FROM ecgbc_staging.member
          UNION ALL SELECT 'councilfellowship', COUNT(*) FROM ecgbc_staging.councilfellowship
          UNION ALL SELECT 'boardmember', COUNT(*) FROM ecgbc_staging.boardmember
          UNION ALL SELECT 'file', COUNT(*) FROM ecgbc_staging.file
          UNION ALL SELECT 'report', COUNT(*) FROM ecgbc_staging.report
          UNION ALL SELECT 'staff', COUNT(*) FROM ecgbc_staging.staff
          UNION ALL SELECT 'stafffellowship', COUNT(*) FROM ecgbc_staging.stafffellowship;"

echo
if [ "${ASSUME_YES:-}" = "1" ]; then
  echo "ASSUME_YES=1 set: continuing without asking."
else
  read -r -p "Counts above come from the old system. Replace the live data now? Type YES to continue: " answer
  [ "$answer" = "YES" ] || { echo "Stopped. Live database unchanged. (Drop staging with: DROP DATABASE ecgbc_staging)"; exit 1; }
fi

# ---------------------------------------------------------------------------
step "3/6 Stopping the API"
cd "$BACKEND_DIR"
docker compose stop app

# ---------------------------------------------------------------------------
step "4/6 Importing (single transaction)"
if ! db ecgbc_db < "$SCRIPT_DIR/import-old-system.sql"; then
  echo "Import failed - nothing was committed. Starting the API again on the old data."
  docker compose start app
  exit 1
fi
echo "Import committed."

# ---------------------------------------------------------------------------
step "5/6 Verifying"
db -t ecgbc_db <<'SQL'
SELECT t.tbl, t.live, t.old_system, IF(t.live = t.old_system, 'OK', 'CHECK') result FROM (
  SELECT 'member' tbl, (SELECT COUNT(*) FROM member) live, (SELECT COUNT(*) FROM ecgbc_staging.member) old_system
  UNION ALL SELECT 'councilfellowship', (SELECT COUNT(*) FROM councilfellowship), (SELECT COUNT(*) FROM ecgbc_staging.councilfellowship)
  UNION ALL SELECT 'boardmember', (SELECT COUNT(*) FROM boardmember), (SELECT COUNT(*) FROM ecgbc_staging.boardmember)
  UNION ALL SELECT 'file', (SELECT COUNT(*) FROM file), (SELECT COUNT(*) FROM ecgbc_staging.file)
  UNION ALL SELECT 'report', (SELECT COUNT(*) FROM report), (SELECT COUNT(*) FROM ecgbc_staging.report)
  UNION ALL SELECT 'staff', (SELECT COUNT(*) FROM staff), (SELECT COUNT(*) FROM ecgbc_staging.staff)
  UNION ALL SELECT 'stafffellowship', (SELECT COUNT(*) FROM stafffellowship), (SELECT COUNT(*) FROM ecgbc_staging.stafffellowship)
) t;

SELECT 'Broken links (all should be 0)' AS check_name, '' AS n
UNION ALL SELECT 'member -> fellowship', COUNT(*) FROM member m LEFT JOIN councilfellowship c ON c.id = m.councilFellowshipId WHERE m.councilFellowshipId IS NOT NULL AND c.id IS NULL
UNION ALL SELECT 'member -> type lookup', COUNT(*) FROM member m LEFT JOIN datalookup d ON d.id = m.typeId WHERE m.typeId IS NOT NULL AND d.id IS NULL
UNION ALL SELECT 'boardmember -> member', COUNT(*) FROM boardmember b LEFT JOIN member m ON m.id = b.memberId WHERE b.memberId IS NOT NULL AND m.id IS NULL
UNION ALL SELECT 'file -> member', COUNT(*) FROM file f LEFT JOIN member m ON m.id = f.memberId WHERE f.memberId IS NOT NULL AND m.id IS NULL
UNION ALL SELECT 'report -> member', COUNT(*) FROM report r LEFT JOIN member m ON m.id = r.memberId WHERE r.memberId IS NOT NULL AND m.id IS NULL
UNION ALL SELECT 'report -> status lookup', COUNT(*) FROM report r LEFT JOIN datalookup d ON d.id = r.statusId WHERE r.statusId IS NOT NULL AND d.id IS NULL
UNION ALL SELECT 'staff -> role', COUNT(*) FROM staff s LEFT JOIN role r ON r.id = s.roleId WHERE s.roleId IS NOT NULL AND r.id IS NULL
UNION ALL SELECT 'stafffellowship -> staff', COUNT(*) FROM stafffellowship sf LEFT JOIN staff s ON s.id = sf.staffId WHERE s.id IS NULL
UNION ALL SELECT 'fee rule fellowship links', COUNT(*) FROM _councilfellowshiptofeerule x LEFT JOIN councilfellowship c ON c.id = x.A WHERE c.id IS NULL;

SELECT 'Config kept from VPS' AS what, '' AS n
UNION ALL SELECT 'datalookup', COUNT(*) FROM datalookup
UNION ALL SELECT 'permission', COUNT(*) FROM permission
UNION ALL SELECT 'role-permission links', COUNT(*) FROM _permissiontorole
UNION ALL SELECT 'payment methods', COUNT(*) FROM paymentmethodconfig
UNION ALL SELECT 'fee rules', COUNT(*) FROM feerule;
SQL

echo
echo "Files referenced by the database but missing in public/ (should be 0 once the upload is complete):"
PUBLIC_DIR="$BACKEND_DIR/public"
missing=0
while IFS=$'\t' read -r dir name; do
  [ -n "$name" ] || continue
  if [ ! -e "$PUBLIC_DIR/$dir/$name" ]; then
    missing=$((missing + 1))
    [ "$missing" -le 10 ] && echo "  $dir/$name"
  fi
done < <(db -N -r ecgbc_db -e "
  SELECT 'files/file', \`file\` FROM file WHERE \`file\` <> ''
  UNION ALL SELECT 'files/report', \`file\` FROM report WHERE \`file\` <> ''
  UNION ALL SELECT 'images/avatar', avatar FROM staff WHERE avatar <> ''")
echo "  Missing: $missing"

# ---------------------------------------------------------------------------
step "6/6 Starting the API"
docker compose start app
echo
echo "Done. Backup of the previous VPS data: $BACKUP"
echo "Check the admin portal, then remove the staging copy with:"
echo "  docker exec $DB_CONTAINER sh -c 'MYSQL_PWD=\"\$MYSQL_ROOT_PASSWORD\" mysql -uroot -e \"DROP DATABASE ecgbc_staging\"'"
echo "To undo the import:"
echo "  gunzip < $BACKUP | docker exec -i $DB_CONTAINER sh -c 'MYSQL_PWD=\"\$MYSQL_ROOT_PASSWORD\" mysql -uroot ecgbc_db'"
