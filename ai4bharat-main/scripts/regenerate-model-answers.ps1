# PowerShell script to regenerate model answers for all interviews
# Run this from the project root: .\scripts\regenerate-model-answers.ps1

Write-Host "🔄 Starting to regenerate model answers for all interviews..." -ForegroundColor Cyan
Write-Host ""

# Make sure app is running
$appUrl = "http://localhost:3000"
Write-Host "Checking if app is running at $appUrl..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$appUrl/api/admin/regenerate-model-answers" -Method GET -ErrorAction Stop
    Write-Host "✅ App is running!" -ForegroundColor Green
} catch {
    Write-Host "❌ App is not running. Please start it with: npm run dev" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting regeneration process..." -ForegroundColor Cyan

# Call the API endpoint
try {
    $response = Invoke-RestMethod -Uri "$appUrl/api/admin/regenerate-model-answers" -Method POST -ContentType "application/json"
    
    Write-Host ""
    Write-Host "✅ Update process completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Yellow
    Write-Host "  Total interviews: $($response.summary.total)"
    Write-Host "  Updated: $($response.summary.updated)" -ForegroundColor Green
    Write-Host "  Failed: $($response.summary.failed)"
    Write-Host "  Skipped: $($response.summary.skipped)"
    Write-Host ""
    
    if ($response.summary.failed -gt 0) {
        Write-Host "Failed interviews:" -ForegroundColor Red
        $response.results | Where-Object { $_.status -eq "error" } | ForEach-Object {
            Write-Host "  - $($_.id): $($_.error)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "💡 Tip: Refresh the app to see updated model answers in interviews!" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error during regeneration:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
