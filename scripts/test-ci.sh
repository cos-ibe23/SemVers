#!/bin/bash

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

echo "🧪 Running tests..."
docker compose -f docker-compose.test.yml run --rm \
  test-runner sh scripts/docker-test.sh
TEST_EXIT_CODE=$?

cleanup

