param(
  [string[]]$Assets = @('tech', 'business', 'editing', 'design', 'photo', 'video', 'writing', 'cooking', 'travel', 'finance', 'economics'),
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$imageSkillRoot = 'C:/Users/s1397722/.codex/skills/.system/imagegen'
$imageCli = Join-Path $imageSkillRoot 'scripts/image_gen.py'
$matteCli = Join-Path $imageSkillRoot 'scripts/remove_chroma_key.py'
if (-not $DryRun -and -not $env:OPENAI_API_KEY) { throw 'Configure the image credential locally; never put it in this script.' }
Push-Location $projectRoot
try {
  $manifest = Get-Content -Raw docs/interest-artwork-prompts.json | ConvertFrom-Json
  foreach ($item in $manifest.assets) {
    if ($item.name -notin $Assets) { continue }
    $chromaPath = "output/imagegen/interests/$($item.name)-chroma.png"
    $cutoutPath = "output/imagegen/interests/$($item.name).png"
    $prompt = $manifest.sharedStyle + ' Primary request: ' + $item.prompt + ' Background constraints: ' + $manifest.background
    if (-not (Test-Path -LiteralPath $chromaPath)) {
      $cliArgs = @($imageCli, 'edit', '--image', $manifest.reference, '--prompt', $prompt, '--model', $manifest.model, '--quality', $manifest.quality, '--size', $manifest.size, '--out', $chromaPath)
      if ($DryRun) { $cliArgs += '--dry-run' }
      python @cliArgs
      if ($LASTEXITCODE) { throw "Generation failed for $($item.name). Check gateway configuration." }
    }
    if ($DryRun) { continue }
    if (-not (Test-Path -LiteralPath $cutoutPath)) {
      python $matteCli --input $chromaPath --out $cutoutPath --auto-key border --soft-matte --transparent-threshold 28 --opaque-threshold 120 --despill
      if ($LASTEXITCODE) { throw "Chroma extraction failed for $($item.name)." }
    }
  }
  if ($DryRun) { return }
  node scripts/prepare-interest-assets.mjs @Assets
  if ($LASTEXITCODE) { throw 'Interest asset export failed.' }
} finally { Pop-Location }
