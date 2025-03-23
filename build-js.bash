#!/bin/bash
set -eo pipefail

# JSPI is in origin trial and not supported yet.
#
# [The announcement for jspi]: https://v8.dev/blog/jspi
# [the jspi spec]: https://github.com/WebAssembly/js-promise-integration/blob/main/proposals/js-promise-integration/Overview.md
# [jspi origin trial]: https://developer.chrome.com/origintrials/#/view_trial/1603844417297317889
#
# --async-mode jspi
# --async-imports wasi:io/poll#[method]pollable.block

jco transpile \
	main.wasm \
	--out-dir ./wasm/ \
	--instantiation async

# Remove the node check
sed -i -e "s#typeof process !== 'undefined' && process.versions && process.versions.node#false#g" ./wasm/main.js
sed -i -e "s#|| await import('node:fs/promises')##g" ./wasm/main.js

# Bring over the types
rm -f ./shim/types/interfaces/*.d.ts || true
cp ./dist/wasm/interfaces/*.d.ts ./shim/types/interfaces/
