#!/bin/bash
set -euo pipefail

# Check if esbuild is installed
if ! command -v esbuild &> /dev/null; then
  echo "esbuild is not installed. Installing..."
  npm install -g esbuild
fi

# Build a simple HTML file to load our script
cat > index.html << EOF
<!DOCTYPE html>
<html>
<head>
  <title>TinyGo WASI Preview2 Demo</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
  </style>
</head>
<body>
  <h1>TinyGo WASI Preview2 Demo</h1>
  <p>Check the console for output from the WebAssembly module</p>
  <pre id="output"></pre>
  <script>
    // Capture console output and display it on page
    const originalConsoleLog = console.log;
    console.log = function() {
      const output = document.getElementById('output');
      for (let i = 0; i < arguments.length; i++) {
        const arg = arguments[i];
        if (typeof arg === 'object') {
          output.textContent += JSON.stringify(arg, null, 2) + '\n';
        } else {
          output.textContent += arg + '\n';
        }
      }
      originalConsoleLog.apply(console, arguments);
    };
  </script>
  <script type="module" src="dist/bundle.js"></script>
</body>
</html>
EOF

# Create a dist directory if it doesn't exist
mkdir -p dist

echo "Building and serving with esbuild..."
esbuild main.ts \
  --bundle \
  --outfile=dist/bundle.js \
  --format=esm \
  --platform=browser \
  --sourcemap \
  --loader:.wasm=file \
  --loader:.core.wasm=file \
  --loader:.core2.wasm=file \
  --loader:.core3.wasm=file \
  --loader:.core4.wasm=file \
  --asset-names=[name]-[hash] \
  --public-path=/dist \
  --serve=:8000 \
  --servedir=. \
  --define:process.versions='{}'

# Note: The server will continue running until Ctrl+C is pressed