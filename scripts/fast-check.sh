#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
echo "🔍 Fast check: TypeScript..."
npx tsc --noEmit --incremental --tsBuildInfoFile ./node_modules/.cache/.tsconfig.tsbuildinfo
echo "✅ TypeScript passed"
