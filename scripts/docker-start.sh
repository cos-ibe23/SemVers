#!/bin/sh
set -e

echo "🚀 Starting Imbod API..."

# Wait for postgres to be ready
echo "⏳ Waiting for database to be ready..."
until pg_isready -h postgres -U imbod -d imbod > /dev/null 2>&1; do
  echo "   Database not ready, waiting..."
  sleep 2
done
echo "✅ Database is ready!"

# Run migrations
echo "📦 Running database migrations..."
npm run db:migrate

# Run seeding
echo "🌱 Seeding database..."
npm run db:seed

# Start the dev server
echo "🎯 Starting development server..."
exec npm run dev

