#!/bin/sh

echo "🧪 Starting test suite..."

# Wait for postgres to be ready
echo "⏳ Waiting for test database to be ready..."
until pg_isready -h db-test -U imbod -d imbod_test > /dev/null 2>&1; do
  echo "   Database not ready, waiting..."
  sleep 2
done
echo "✅ Test database is ready!"

# Run migrations
echo "📦 Running database migrations..."
if ! npm run db:test:migrate; then
  echo "❌ Migration failed"
  exit 1
fi

# Get test arguments from environment
VITEST_ARGS="${VITEST_ARGS:-}"

# Single run mode - run vitest run with arguments
echo "🎯 Running tests${VITEST_ARGS:+ with: $VITEST_ARGS}..."
if [ -n "$VITEST_ARGS" ]; then
  npx vitest run $VITEST_ARGS
else
  npx vitest run
fi
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Tests failed with exit code $TEST_EXIT_CODE"
fi

exit $TEST_EXIT_CODE

