param([string[]]$Assets = @('headphones', 'tuning-dial', 'beans', 'brew', 'milk', 'stir'))
$ErrorActionPreference = 'Stop'
$themeRoot = Split-Path -Parent $PSScriptRoot
$imageSkillRoot = 'C:/Users/s1397722/.codex/skills/.system/imagegen'
$imageCli = Join-Path $imageSkillRoot 'scripts/image_gen.py'
$matteCli = Join-Path $imageSkillRoot 'scripts/remove_chroma_key.py'
if (-not $env:OPENAI_API_KEY) { throw 'Configure the image credential locally; never put it in this script.' }
Push-Location $themeRoot
try {
  $manifest = Get-Content -Raw docs/theme-artwork-prompts.json | ConvertFrom-Json
  foreach ($item in $manifest.assets) {
    if ($item.name -notin $Assets) { continue }
    $chromaPath = "output/imagegen/theme/$($item.name)-chroma.png"
    $cutoutPath = "output/imagegen/theme/$($item.name).png"
    $prompt = 'Use case: product-mockup. Image 1: supporting lighting/material reference, not an edit target. ' + $manifest.sharedStyle + ' Primary request: ' + $item.prompt + ' Background constraints: ' + $manifest.background
    if (-not (Test-Path -LiteralPath $chromaPath)) {
      python $imageCli edit --image $item.reference --prompt $prompt --model $manifest.model --quality $manifest.quality --size $manifest.size --out $chromaPath
      if ($LASTEXITCODE) { throw "Generation failed for $($item.name). Check gateway configuration." }
    }
    if (-not (Test-Path -LiteralPath $cutoutPath)) {
      python $matteCli --input $chromaPath --out $cutoutPath --auto-key border --soft-matte --transparent-threshold 28 --opaque-threshold 120 --despill
      if ($LASTEXITCODE) { throw "Chroma extraction failed for $($item.name)." }
    }
  }
  node scripts/prepare-theme-assets.mjs
  if ($LASTEXITCODE) { throw 'Theme asset export failed.' }
} finally { Pop-Location }
