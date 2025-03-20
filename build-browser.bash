#!/bin/bash
set -euo pipefail

# Check if esbuild is installed
if ! command -v esbuild &> /dev/null; then
  echo "esbuild is not installed. Installing..."
  npm install -g esbuild
fi

# Note: We're no longer generating the index.html file since we've manually created it

# Create a dist directory if it doesn't exist
mkdir -p dist

# Copy the wasm directory to dist for easier access
echo "Copying wasm directory to dist..."
cp -r wasm dist/

echo "Building main bundle with esbuild..."
esbuild main.ts \
  --bundle \
  --outfile=dist/bundle.js \
  --format=esm \
  --platform=browser \
  --sourcemap \
  --tree-shaking=true \
  --loader:.wasm=file \
  --loader:.core.wasm=file \
  --loader:.core2.wasm=file \
  --loader:.core3.wasm=file \
  --loader:.core4.wasm=file \
  --asset-names=[name]-[hash] \
  --public-path=/dist \
  --define:process.versions='{}'

echo "Building worker bundle with esbuild..."
esbuild worker.ts \
  --bundle \
  --outfile=dist/worker.js \
  --format=esm \
  --platform=browser \
  --sourcemap \
  --tree-shaking=true \
  --loader:.wasm=file \
  --loader:.core.wasm=file \
  --loader:.core2.wasm=file \
  --loader:.core3.wasm=file \
  --loader:.core4.wasm=file \
  --asset-names=[name]-[hash] \
  --public-path=/dist \
  --define:process.versions='{}'

echo "Starting server with COOP/COEP headers for cross-origin isolation..."
node serve-with-headers.js
