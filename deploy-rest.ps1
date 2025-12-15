$ErrorActionPreference = "Stop"
$projectRef = "bfctvwjxlfkzeahmscbe"
$zipDir = "C:\Users\ilyad\mirror-virtual-platform"
$accessToken = $env:SUPABASE_ACCESS_TOKEN

if (-not $accessToken) {
    Write-Error "SUPABASE_ACCESS_TOKEN not set"
    exit 1
}

$zipFiles = @(
    "analytics-aggregator",
    "broadcast-reflection",
    "cleanup-sessions",
    "process-reflection",
    "send-contact-notification",
    "sync-user-profile",
    "webhook-handler"
)

Write-Host "Deploying Edge Functions via REST API to: $projectRef`n" -ForegroundColor Cyan

foreach ($fnName in $zipFiles) {
    $zipPath = Join-Path $zipDir "$fnName.zip"
    
    if (-not (Test-Path $zipPath)) {
        Write-Warning "ZIP not found: $zipPath - Skipping"
        continue
    }
    
    Write-Host "Deploying: $fnName" -ForegroundColor Yellow
    
    # Read and encode ZIP
    $bytes = [System.IO.File]::ReadAllBytes($zipPath)
    $base64 = [System.Convert]::ToBase64String($bytes)
    
    # Try multiple Supabase API endpoints
    $endpoints = @(
        "https://api.supabase.com/v1/projects/$projectRef/functions",
        "https://api.supabase.io/v1/projects/$projectRef/functions"
    )
    
    $deployed = $false
    
    foreach ($endpoint in $endpoints) {
        try {
            $body = @{
                slug = $fnName
                name = $fnName
                body = $base64
                verify_jwt = $false
            } | ConvertTo-Json -Compress
            
            $headers = @{
                "Authorization" = "Bearer $accessToken"
                "Content-Type" = "application/json"
                "apikey" = $accessToken
            }
            
            Write-Host "  Trying: $endpoint" -ForegroundColor Gray
            
            $response = Invoke-RestMethod -Method Post -Uri $endpoint -Headers $headers -Body $body -ErrorAction Stop
            
            Write-Host "  SUCCESS: $fnName deployed!" -ForegroundColor Green
            Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
            $deployed = $true
            break
            
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            $errorMsg = $_.ErrorDetails.Message
            Write-Host "  Failed ($statusCode): $errorMsg" -ForegroundColor DarkGray
        }
    }
    
    if (-not $deployed) {
        Write-Host "  FAILED: Could not deploy $fnName to any endpoint" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "`nDeployment script completed!" -ForegroundColor Cyan
Write-Host "Verify functions at: https://supabase.com/dashboard/project/$projectRef/functions" -ForegroundColor White
