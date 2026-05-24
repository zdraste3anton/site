# Проверка PostgreSQL и подсказки для CharacterForge API (запуск: powershell -File scripts/windows-check-backend.ps1)
$ErrorActionPreference = 'Continue'

Write-Host "`n=== CharacterForge backend / PostgreSQL ===" -ForegroundColor Cyan

$portOk = (Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue).TcpTestSucceeded
if ($portOk) {
  Write-Host "[OK] localhost:5432 доступен" -ForegroundColor Green
} else {
  Write-Host "[!!] localhost:5432 недоступен — PostgreSQL не запущен или не установлен" -ForegroundColor Red
  Write-Host "     См. server/POSTGRESQL-WINDOWS.md" -ForegroundColor Yellow
}

$svc = Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'postgres' -or $_.DisplayName -match 'postgres' }
if ($svc) {
  $svc | Format-Table Name, Status, DisplayName -AutoSize
} else {
  Write-Host "[i] Служба PostgreSQL не найдена среди зарегистрированных служб (возможно, не установлена)." -ForegroundColor Yellow
}

$envFile = Join-Path $PSScriptRoot '..' '.env' | Resolve-Path -ErrorAction SilentlyContinue
if (-not $envFile) { $envFile = Join-Path (Split-Path $PSScriptRoot -Parent) '.env' }
if (Test-Path $envFile) {
  Write-Host "`n[OK] Найден .env: $envFile" -ForegroundColor Green
} else {
  Write-Host "`n[!!] Нет server/.env — скопируйте из .env.example" -ForegroundColor Red
}

Write-Host "`nКоманды из папки server после запуска PostgreSQL:" -ForegroundColor Cyan
Write-Host "  npx prisma generate"
Write-Host "  npx prisma migrate dev"
Write-Host "  npm run dev"
