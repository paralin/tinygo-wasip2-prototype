#!/bin/bash
set -eo pipefail

GOOS=wasip2 GOARCH=wasm tinygo build -scheduler asyncify -o main.wasm main.go
