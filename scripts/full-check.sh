#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
echo "🔍 Full check: TypeScript..."
npx tsc --noEmit --incremental --tsBuildInfoFile ./node_modules/.cache/.tsconfig.tsbuildinfo
echo "🧪 Full check: Tests..."
npx vitest run
echo "✅ Full check passed"
