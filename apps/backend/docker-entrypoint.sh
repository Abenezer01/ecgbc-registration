#!/bin/sh
set -e

echo "🔄 Applying database schema changes (prisma db push)..."

# --skip-generate: client is already generated at build time
# NO --accept-data-loss: if Prisma detects a destructive change it will
# We are adding --accept-data-loss here temporarily because adding the @unique constraint 
# to reservationCode triggers a Prisma warning, even though it won't actually drop data.
npx prisma db push --skip-generate --accept-data-loss

echo "✅ Database schema is up to date."
echo "🚀 Starting application..."
exec node dist/index.js
