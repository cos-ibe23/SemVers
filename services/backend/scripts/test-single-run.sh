#!/bin/bash

# Usage: ./test-single-run.sh [RELATIVE_PATH_TO_TEST_FILE]
# Example: ./test-single-run.sh src/lib/user-can.test.ts

# Check if test file argument is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide a test file path"
    echo "Usage: $0 <test-file-path>"
    echo "Example: $0 src/lib/user-can.test.ts"
    exit 1
fi

TEST_FILE="$1"

# Check if test file exists
if [ ! -f "$TEST_FILE" ]; then
    echo "❌ Error: Test file '$TEST_FILE' not found"
    exit 1
fi

# Capture the exit code from the test command
TEST_EXIT_CODE=0

cleanup() {
    echo "🧹 Cleaning up Docker containers and volumes..."
    docker compose -f docker-compose.test.yml down -v
    exit $TEST_EXIT_CODE
}

trap cleanup SIGINT SIGTERM EXIT

echo "🆕 Starting test services..."
docker compose -f docker-compose.test.yml up -d --wait db-test redis-test minio-test

echo "🧪 Running test file: $TEST_FILE"
docker compose -f docker-compose.test.yml run --rm \
  -e VITEST_ARGS="$TEST_FILE" \
  test-runner sh scripts/docker-test.sh
TEST_EXIT_CODE=$?

cleanup

