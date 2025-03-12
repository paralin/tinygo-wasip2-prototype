#!/bin/bash
set -eo pipefail

jco transpile main.wasm --out-dir ./wasm/ --instantiation
