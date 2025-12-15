$ErrorActionPreference = "Stop"
$projectRef = "bfctvwjxlfkzeahmscbe"
$zipDir = "C:\Users\ilyad\mirror-virtual-platform"
$accessToken = $env:SUPABASE_ACCESS_TOKEN

if (-not $accessToken) {
    Write-Error "SUPABASE_ACCESS_TOKEN not set"
    exit 1
}

$zipFiles = @(
    "analytics-aggregator.zip",
    "broadcast-reflection.zip",
    "cleanup-sessions.zip",
    "process-reflection.zip",
    "send-contact-notification.zip",
    "sync-user-profile.zip",
    "webhook-handler.zip"
)

Write-Host "Deploying Edge Functions to project: $projectRef"

foreach ($zipName in $zipFiles) {
    $zipPath = Join-Path $zipDir $zipName
    $fnName = [System.IO.Path]::GetFileNameWithoutExtension($zipName)
    $tempDir = Join-Path $env:TEMP ("supafn_" + [guid]::NewGuid().ToString())
    
    try {
        New-Item -ItemType Directory -Path $tempDir | Out-Null
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $tempDir)
        
        Write-Host "`nDeploying: $fnName" -ForegroundColor Cyan
        
        supabase functions deploy $fnName --project-ref $projectRef --no-verify-jwt 2>&1 | Write-Host
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: $fnName" -ForegroundColor Green
        } else {
            Write-Host "FAILED: $fnName (exit code $LASTEXITCODE)" -ForegroundColor Yellow
        }
    } finally {
        if (Test-Path $tempDir) {
            Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "`nDeployment Complete!" -ForegroundColor Green
