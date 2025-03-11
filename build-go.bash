#!/bin/bash
set -eo pipefail

GOOS=wasip2 GOARCH=wasm tinygo build -o main.wasm main.go
