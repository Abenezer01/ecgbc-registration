#!/bin/sh
set -e

echo "🔄 Applying database schema changes (prisma db push)..."

# --skip-generate: client is already generated at build time
# NO --accept-data-loss: if Prisma detects a destructive change it will
# abort and the container will fail loudly instead of silently destroying data.
npx prisma db push --skip-generate

echo "✅ Database schema is up to date."
echo "🚀 Starting application..."
exec node dist/index.js
