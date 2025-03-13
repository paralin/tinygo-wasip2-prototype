#!/bin/bash
set -eo pipefail

jco transpile \
    main.wasm \
    --out-dir ./wasm/ \
    --instantiation async \
    --async-mode jspi \
    --async-imports wasi:io/poll#[method]pollable.block

# Remove the node check
sed -i -e "s#typeof process !== 'undefined' && process.versions && process.versions.node#false#g" ./wasm/main.js
sed -i -e "s#|| await import('node:fs/promises')##g" ./wasm/main.js
