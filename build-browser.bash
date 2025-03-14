#!/bin/bash
set -euo pipefail

# Check if esbuild is installed
if ! command -v esbuild &> /dev/null; then
  echo "esbuild is not installed. Installing..."
  npm install -g esbuild
fi

# Note: We're no longer generating the index.html file since we've manually created it

# Create a dist directory if it doesn't exist
mkdir -p dist

# Copy the wasm directory to dist for easier access
echo "Copying wasm directory to dist..."
cp -r wasm dist/

# Create a custom HTTP server that sets the required cross-origin isolation headers
cat > serve-with-headers.js << EOF
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const server = http.createServer((req, res) => {
  // Set COOP/COEP headers for cross-origin isolation (required for SharedArrayBuffer)
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  // Simple routing
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  // Handle 404 for non-existent files
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end('File not found');
    return;
  }

  // Set content type based on file extension
  const ext = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (ext) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.wasm':
      contentType = 'application/wasm';
      break;
  }
  
  res.setHeader('Content-Type', contentType);
  
  // Stream the file
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

server.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}/\`);
  console.log(\`IMPORTANT: Cross-Origin Isolation headers are enabled for SharedArrayBuffer support\`);
});
EOF

echo "Building main bundle with esbuild..."
esbuild main.ts \
  --bundle \
  --outfile=dist/bundle.js \
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

echo "Building worker bundle with esbuild..."
esbuild worker.ts \
  --bundle \
  --outfile=dist/worker.js \
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

echo "Starting server with COOP/COEP headers for cross-origin isolation..."
node serve-with-headers.js
