#!/bin/bash
set -euo pipefail

echo "Building Go WASM module..."
./build-go.bash

echo "Transpiling WASM to JavaScript..."
./build-js.bash

echo "Bundling for the browser..."
./build-browser.bash

echo "Starting server with COOP/COEP headers for cross-origin isolation..."
exec node serve-with-headers.js
