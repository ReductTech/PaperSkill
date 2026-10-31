$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  node node_modules/typescript/bin/tsc
  if ($LASTEXITCODE -ne 0) { throw 'TypeScript validation failed' }
  & ./node_modules/@esbuild/win32-x64/esbuild.exe src/main.tsx --bundle --format=esm --outdir=dist/assets --minify
  if ($LASTEXITCODE -ne 0) { throw 'Static build failed' }
  $html = Get-Content index.html -Raw
  $html.Replace('<script type="module" src="/src/main.tsx"></script>', '<link rel="stylesheet" href="./assets/main.css" /><script type="module" src="./assets/main.js"></script>') | Set-Content dist/index.html -Encoding utf8
  if (Test-Path public) { Copy-Item public/* dist -Recurse -Force -ErrorAction SilentlyContinue }
  Write-Host 'Local static build completed.'
} finally { Pop-Location }
