# =============================================================================
# SikaFlow — Validate GitHub Actions workflows (PowerShell)
# =============================================================================
# Usage:  .\scripts\validate-workflows.ps1
# =============================================================================

Write-Host "🔍 Validating GitHub Actions workflows..." -ForegroundColor Cyan
Write-Host ""

# Find actionlint
$actionlint = $null

if (Get-Command actionlint -ErrorAction SilentlyContinue) {
    $actionlint = "actionlint"
} elseif (Test-Path "$env:LOCALAPPDATA\actionlint\actionlint.exe") {
    $actionlint = "$env:LOCALAPPDATA\actionlint\actionlint.exe"
} else {
    Write-Host "❌ actionlint not found." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install it:" -ForegroundColor Yellow
    Write-Host '  Invoke-WebRequest -Uri "https://github.com/rhysd/actionlint/releases/download/v1.7.7/actionlint_1.7.7_windows_amd64.zip" -OutFile "$env:TEMP\actionlint.zip"'
    Write-Host '  Expand-Archive -Path "$env:TEMP\actionlint.zip" -DestinationPath "$env:LOCALAPPDATA\actionlint" -Force'
    exit 1
}

# Run actionlint
$output = & $actionlint 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All workflows are valid!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Workflow errors found:" -ForegroundColor Red
    Write-Host ""
    Write-Host $output
    exit 1
}
