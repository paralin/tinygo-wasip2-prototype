# TinyGo WebAssembly WASI Preview2 Prototype

## Project Overview
This project demonstrates compiling Go code to WebAssembly using TinyGo with WASI Preview2 support, and running it in a JavaScript environment.

## Build Commands

### Building the Go WASM Module
```bash
./build-go.bash
```
This script compiles the Go code to WebAssembly using TinyGo with WASI Preview2 targeting:
- Uses TinyGo (not standard Go compiler)
- Targets `wasip2` operating system
- Uses `wasm` architecture
- Outputs `main.wasm`

### Building the JavaScript Interface
```bash
./build-js.bash
```
This script uses `jco` (JavaScript Component Objectives) to transpile the WebAssembly module:
- Transpiles `main.wasm` to JavaScript
- Outputs to `./wasm/` directory
- Generates instantiation boilerplate

## Execution Flow
1. Go code is compiled to WebAssembly with TinyGo
2. The WASM binary is transpiled to JS-compatible format
3. The TypeScript code (`main.ts`) imports and instantiates the WASM module
4. The WASM code runs with WASI Preview2 interfaces provided by `@bytecodealliance/preview2-shim`

## Key Technologies
- TinyGo: Compiler for Go targeting small places like WebAssembly
- WASI Preview2: The newer version of WebAssembly System Interface
- Bytecode Alliance Preview2 Shim: JavaScript implementation of WASI Preview2 interfaces
- JavaScript Component Objectives (jco): Tool for working with WebAssembly Components

## Current Functionality
The current implementation is a simple "Hello World" that writes to stdout from the WebAssembly module.