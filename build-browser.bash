#!/bin/bash
set -euo pipefail

# Check if esbuild is installed
if ! command -v esbuild &>/dev/null; then
	echo "esbuild is not installed. Installing..."
	npm install -g esbuild
fi

# Note: We're no longer generating the index.html file since we've manually created it

# Create a dist directory if it doesn't exist
mkdir -p dist

# Copy the wasm directory to dist for easier access
echo "Copying wasm directory to dist..."
cp -r wasm dist/

# Function to build a bundle with common options
build_bundle() {
	local input_file=$1
	local output_file=$2

	echo "Building ${input_file} bundle with esbuild..."
	esbuild ${input_file} \
		--bundle \
		--outfile=dist/${output_file} \
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
}

# Build the main bundle
build_bundle main.ts bundle.js

# Build the worker bundle
build_bundle worker.ts worker.js
