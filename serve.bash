#!/bin/bash
set -euo pipefail

echo "Building Go WASM module..."
./build-go.bash

echo "Transpiling WASM to JavaScript..."
./build-js.bash

echo "Starting browser server..."
exec ./build-browser.bash
