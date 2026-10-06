param([string]$ImageBaseUrl = $env:OPENAI_BASE_URL, [string[]]$Poses = @('wave', 'hold', 'open', 'sip', 'enjoy', 'grind', 'coffee'))

$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$skillRoot = 'C:/Users/s1397722/.codex/skills/.system/imagegen'
$imageCli = Join-Path $skillRoot 'scripts/image_gen.py'
$matteCli = Join-Path $skillRoot 'scripts/remove_chroma_key.py'
if (-not $env:OPENAI_API_KEY) { throw 'Configure OPENAI_API_KEY locally before generating.' }
if ($ImageBaseUrl) { $env:OPENAI_BASE_URL = $ImageBaseUrl }
Push-Location $taskRoot
try {
  $master = 'output/imagegen/master-chroma.png'
  if (-not (Test-Path -LiteralPath $master)) {
    python $imageCli edit --image 'Media (4).jpg' --image 'shared image (4).jpg' --prompt-file 'output/imagegen/master-prompt.txt' --model gpt-image-2 --quality high --size 1536x2048 --out $master
    if ($LASTEXITCODE) { throw 'Master generation failed. Check image API credentials and routing.' }
  }
  $actions = Get-Content -Raw 'output/imagegen/pose-prompts.json' | ConvertFrom-Json
  foreach ($pose in $Poses) {
    $chroma = "output/imagegen/$pose-chroma.png"
    if (-not (Test-Path -LiteralPath $chroma)) {
      $prompt = "Image 1: master 3D character, preserve identity, full body framing and scale exactly. Image 2: primary facial and clothing reference. Image 3: body proportions and profile reference. " + $actions.$pose + ' Keep the navy jacket with checked lining, black shirt and trousers, off-white sneakers, hair, beard, facial structure, dark rectangular glasses, natural adult proportions, camera and lighting unchanged. Entire body visible, feet at 94% canvas height. Uniform #00FF00 chroma background with no gradients, cast shadows or scenery; green nowhere on subject. No text or watermark.'
      python $imageCli edit --image $master --image 'Media (4).jpg' --image 'shared image (4).jpg' --prompt $prompt --model gpt-image-2 --quality high --size 1536x2048 --out $chroma
      if ($LASTEXITCODE) { throw "Generation failed for $pose." }
    }
    $alpha = "output/imagegen/$pose.png"
    if (-not (Test-Path -LiteralPath $alpha)) {
      python $matteCli --input $chroma --out $alpha --auto-key border --soft-matte --transparent-threshold 28 --opaque-threshold 120 --despill
      if ($LASTEXITCODE) { throw "Background removal failed for $pose." }
    }
  }
  if (@('wave', 'hold', 'open', 'sip', 'enjoy', 'grind', 'coffee').Where({ -not (Test-Path "output/imagegen/$_.png") }).Count -eq 0) {
    node scripts/prepare-character-assets.mjs
    if ($LASTEXITCODE) { throw 'Asset preparation failed.' }
  }
  Write-Host 'Inspect every PNG and WebP before enabling characterAssetsReady in lib/character-assets.ts.'
} finally { Pop-Location }
