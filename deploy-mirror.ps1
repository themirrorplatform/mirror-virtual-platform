<#
Deploy Mirror Virtual Platform to Supabase (PowerShell)

Save this file as deploy-mirror.ps1 and run from the project root:
  cd 'C:\Users\ilyad\mirror-virtual-platform'
  .\deploy-mirror.ps1

This script:
 - Checks for Supabase CLI and offers install options if not found.
 - Scans for expected folders (supabase/, migrations/, functions/, sql/, seed/).
 - Detects destructive SQL (DROP, TRUNCATE, DELETE without WHERE, ALTER ... DROP COLUMN).
 - Applies non-destructive migrations automatically.
 - Prompts before applying destructive SQL.
 - Deploys Edge Functions with `supabase functions deploy`.
 - Imports seed SQL/CSV files (prompted) using psql via SUPABASE_DB_URL or supabase db remote.
 - Logs all output to a timestamped logfile.

IMPORTANT: The script will request SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY if not present in env.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Log {
    param([string]$Message)
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $entry = "[$timestamp] $Message"
    Write-Host $entry
    Add-Content -Path $Global:LogFile -Value $entry
}

function Ask-YesNo {
    param([string]$Prompt,[bool]$DefaultYes=$true)
    $yn = if ($DefaultYes) { "[Y/n]" } else { "[y/N]" }
    while ($true) {
        $resp = Read-Host "$Prompt $yn"
        if ([string]::IsNullOrWhiteSpace($resp)) { return $DefaultYes }
        switch ($resp.ToLower()) {
            'y' { return $true }
            'yes' { return $true }
            'n' { return $false }
            'no' { return $false }
            default { Write-Host "Please answer y or n." }
        }
    }
}

# --- Init ---
$ScriptStart = Get-Date
$ProjectRoot = (Get-Location).Path
$TimeTag = (Get-Date).ToString("yyyyMMdd-HHmmss")
$Global:LogFile = Join-Path $ProjectRoot "deploy-log-$TimeTag.txt"
Write-Log "Starting Mirror deployment script in $ProjectRoot"

# --- Check for Supabase CLI ---
function Check-SupabaseCLI {
    try {
        $supaver = & supabase --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Supabase CLI found: $supaver"
            return $true
        }
    } catch {
        Write-Log "Supabase CLI not found in PATH."
    }
    return $false
}

$hasSupabase = Check-SupabaseCLI
if (-not $hasSupabase) {
    Write-Log "Supabase CLI is not installed or not in PATH."
    $installChoice = Read-Host "Install Supabase CLI now? (options: winget / npm / skip) -- type winget, npm, or skip"
    switch ($installChoice.ToLower()) {
        'winget' {
            Write-Log "Attempting winget install of supabase CLI..."
            try {
                winget install -e --id Supabase.supabase -h
                Write-Log "winget install attempted. Re-checking supabase CLI..."
            } catch {
                Write-Log "winget install failed: $_"
            }
        }
        'npm' {
            Write-Log "Attempting npm install -g supabase..."
            try {
                npm install -g supabase
                Write-Log "npm install attempted. Re-checking supabase CLI..."
            } catch {
                Write-Log "npm install failed: $_"
            }
        }
        default {
            Write-Log "Skipping automatic install. You must install supabase CLI before continuing."
        }
    }
    $hasSupabase = Check-SupabaseCLI
    if (-not $hasSupabase) {
        $cont = Ask-YesNo -Prompt "Supabase CLI still not found. Continue anyway? (You won't be able to deploy functions or run db push)" -DefaultYes:$false
        if (-not $cont) { Write-Log "Exiting."; throw "Supabase CLI required." }
    }
}

# --- Ensure required env vars or supabase login ---
$envSupabaseUrl = $env:SUPABASE_URL
$envServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $envSupabaseUrl -or -not $envServiceKey) {
    Write-Log "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment."
    Write-Host ""
    Write-Host "You can set these environment variables for this PowerShell session now."
    Write-Host " - SUPABASE_URL (e.g. https://xyz.supabase.co)"
    Write-Host " - SUPABASE_SERVICE_ROLE_KEY (from Project Settings -> API -> Service Key)"
    $setNow = Ask-YesNo -Prompt "Set env vars now interactively?" -DefaultYes:$true
    if ($setNow) {
        $supUrl = Read-Host "Enter SUPABASE_URL (or leave blank to skip)"
        if ($supUrl) { $env:SUPABASE_URL = $supUrl; Write-Log "SUPABASE_URL set for session." }
        $svcKey = Read-Host "Enter SUPABASE_SERVICE_ROLE_KEY (or leave blank to skip)"
        if ($svcKey) { $env:SUPABASE_SERVICE_ROLE_KEY = $svcKey; Write-Log "SUPABASE_SERVICE_ROLE_KEY set for session." }
        $envSupabaseUrl = $env:SUPABASE_URL
        $envServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY
    } else {
        Write-Log "Skipping env var set. The script will attempt operations that do not require these keys."
    }
}

# If supabase CLI present, prefer supabase login method
if ($hasSupabase) {
    try {
        Write-Log "Checking supabase auth status..."
        $whoami = & supabase status 2>&1
        Write-Log "Supabase status: $whoami"
    } catch {
        Write-Log "Unable to run 'supabase status' (this is informational). Continue."
    }
}

# --- Scan project folders ---
$expectedFolders = @('supabase','migrations','functions','sql','seed')
$found = @{}
foreach ($f in $expectedFolders) {
    $path = Join-Path $ProjectRoot $f
    $exists = Test-Path $path
    $found[$f] = $exists
    Write-Log "Folder '$f' present: $exists"
}

# Summarize
Write-Host ""
Write-Log "Project folder scan complete. Summary:"
foreach ($k in $found.Keys) {
    Write-Log "  $k : $($found[$k])"
}

# --- Gather SQL files (migrations/sql) ---
$MigrationFiles = @()
if ($found['migrations']) {
    $migrationsPath = Join-Path $ProjectRoot 'migrations'
    $MigrationFiles = Get-ChildItem -Path $migrationsPath -Recurse -File -Include *.sql -ErrorAction SilentlyContinue | Sort-Object FullName
    Write-Log "Found $($MigrationFiles.Count) .sql migration files under migrations/."
} elseif ($found['supabase']) {
    $supabaseMigrationsPath = Join-Path $ProjectRoot 'supabase\migrations'
    if (Test-Path $supabaseMigrationsPath) {
        $MigrationFiles = Get-ChildItem -Path $supabaseMigrationsPath -Recurse -File -Include *.sql -ErrorAction SilentlyContinue | Sort-Object FullName
        Write-Log "Found $($MigrationFiles.Count) .sql migration files under supabase/migrations/."
    }
} elseif ($found['sql']) {
    $sqlPath = Join-Path $ProjectRoot 'sql'
    $MigrationFiles = Get-ChildItem -Path $sqlPath -Recurse -File -Include *.sql -ErrorAction SilentlyContinue | Sort-Object FullName
    Write-Log "Found $($MigrationFiles.Count) .sql files under sql/."
}

if ($MigrationFiles.Count -eq 0) {
    Write-Log "No migrations/ or sql/ folder found with SQL files. Skipping DB migration step."
    $contNoMigrations = Ask-YesNo -Prompt "Continue without applying DB migrations?" -DefaultYes:$true
    if (-not $contNoMigrations) { Write-Log "Exiting."; throw "No migrations to apply." }
}

# --- Detect potentially destructive SQL ---
function Is-DestructiveSQL {
    param([string]$SqlText)
    $lower = $SqlText.ToLower()
    if ($lower -match '\bdrop\b' -or $lower -match '\btruncate\b') { return $true }
    if ($lower -match '\balter\s+table[^\;]*\bdrop\b') { return $true }
    # DELETE without WHERE heuristic: DELETE FROM X; or DELETE FROM X;
    if ($lower -match '(^|\s)delete\s+from\s+[^\;]+\;?' ) {
        if ($lower -notmatch 'where') { return $true }
    }
    return $false
}

$DestructiveFiles = @()
$NonDestructiveFiles = @()
foreach ($file in $MigrationFiles) {
    $content = Get-Content -Raw -Path $file.FullName -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    if (Is-DestructiveSQL -SqlText $content) {
        $DestructiveFiles += $file
    } else {
        $NonDestructiveFiles += $file
    }
}

Write-Log "Non-destructive SQL files: $($NonDestructiveFiles.Count)"
Write-Log "Potentially destructive SQL files: $($DestructiveFiles.Count)"

# --- Apply non-destructive migrations ---
if ($NonDestructiveFiles.Count -gt 0) {
    Write-Log "Applying non-destructive SQL files one-by-one using psql or supabase CLI."
    foreach ($file in $NonDestructiveFiles) {
        Write-Log "Processing: $($file.FullName)"
        # Prefer using supabase db push if supabase folder exists and supabase CLI available
        if ($hasSupabase -and (Test-Path (Join-Path $ProjectRoot 'supabase'))) {
            Write-Log "Running: supabase db execute --file `"$($file.FullName)`""
            try {
                # Attempt using supabase db execute (supabase CLI may not support single-file execute; fallback to psql)
                & supabase db execute --file $file.FullName 2>&1 | ForEach-Object { Write-Log $_ }
                Write-Log "supabase db execute finished for $($file.Name)."
                continue
            } catch {
                Write-Log "supabase db execute failed or unsupported: $_. Will attempt psql if SUPABASE_DB_URL present."
            }
        }
        # Fallback: use psql if SUPABASE_DB_URL env var is set
        if ($env:SUPABASE_DB_URL) {
            Write-Log "Using psql with SUPABASE_DB_URL to execute $($file.Name)."
            try {
                & psql $env:SUPABASE_DB_URL -f $file.FullName 2>&1 | ForEach-Object { Write-Log $_ }
                Write-Log "psql execution complete for $($file.Name)."
            } catch {
                Write-Log "psql execution failed: $_"
                throw "Failed to execute $($file.FullName)."
            }
        } else {
            Write-Log "No SUPABASE_DB_URL available. Skipping execution of $($file.Name). To run this file manually, set SUPABASE_DB_URL or use supabase CLI."
        }
    }
} else {
    Write-Log "No non-destructive SQL files to apply."
}

# --- Prompt and apply destructive migrations ---
if ($DestructiveFiles.Count -gt 0) {
    Write-Log "There are $($DestructiveFiles.Count) potentially destructive SQL files."
    Write-Host ""
    foreach ($df in $DestructiveFiles) {
        Write-Host "Destructive file: $($df.FullName)"
    }
    $applyDestructive = Ask-YesNo -Prompt "Apply destructive SQL files now? (They will be executed in order)" -DefaultYes:$false
    if ($applyDestructive) {
        foreach ($file in $DestructiveFiles) {
            Write-Log "Applying destructive file: $($file.FullName)"
            if ($hasSupabase -and (Test-Path (Join-Path $ProjectRoot 'supabase'))) {
                try {
                    & supabase db execute --file $file.FullName 2>&1 | ForEach-Object { Write-Log $_ }
                    Write-Log "supabase db execute finished for $($file.Name)."
                    continue
                } catch {
                    Write-Log "supabase db execute failed: $_"
                }
            }
            if ($env:SUPABASE_DB_URL) {
                try {
                    & psql $env:SUPABASE_DB_URL -f $file.FullName 2>&1 | ForEach-Object { Write-Log $_ }
                    Write-Log "psql executed $($file.Name)."
                } catch {
                    Write-Log "psql execution failed: $_"
                    throw "Failed to execute destructive file $($file.FullName)."
                }
            } else {
                Write-Log "SUPABASE_DB_URL not set; cannot execute $($file.Name). Skipping."
            }
        }
    } else {
        Write-Log "User chose not to apply destructive SQL files now. Skipping."
    }
}

# --- Deploy Edge Functions ---
$FunctionsPaths = @()
# Look in supabase/functions, functions, or ./functions
$possibleFunctionDirs = @('supabase\functions','functions','.\functions')
foreach ($rel in $possibleFunctionDirs) {
    $abs = Join-Path $ProjectRoot $rel
    if (Test-Path $abs) {
        Write-Log "Found functions directory: $abs"
        $FunctionsPaths += $abs
    }
}

if ($FunctionsPaths.Count -gt 0) {
    if (-not $hasSupabase) {
        Write-Log "Supabase CLI not available. Cannot deploy Edge Functions. Skipping functions deployment."
    } else {
        Write-Log "Deploying Edge Functions from discovered paths..."
        foreach ($fpath in $FunctionsPaths) {
            # Get subdirectories (each function)
            $funcDirs = Get-ChildItem -Path $fpath -Directory -ErrorAction SilentlyContinue
            foreach ($fd in $funcDirs) {
                $funcName = $fd.Name
                Write-Log "Deploying function: $funcName (path: $($fd.FullName))"
                try {
                    & supabase functions deploy $funcName --project-ref $env:SUPABASE_PROJECT_REF 2>&1 | ForEach-Object { Write-Log $_ }
                    Write-Log "Deployment attempted for $funcName."
                } catch {
                    Write-Log "supabase functions deploy failed for $funcName: $_"
                }
            }
        }
    }
} else {
    Write-Log "No Edge Functions directories found to deploy."
}

# --- Import seed data (optional) ---
if ($found['seed']) {
    $seedPath = Join-Path $ProjectRoot 'seed'
    $seedFiles = Get-ChildItem -Path $seedPath -File -Include *.sql,*.csv -Recurse -ErrorAction SilentlyContinue
    if ($seedFiles.Count -gt 0) {
        Write-Log "Found $($seedFiles.Count) seed files."
        $applySeeds = Ask-YesNo -Prompt "Import seed files now? (order: alphabetical)" -DefaultYes:$true
        if ($applySeeds) {
            foreach ($sf in $seedFiles | Sort-Object Name) {
                Write-Log "Importing seed file: $($sf.Name)"
                if ($sf.Extension -eq '.sql') {
                    if ($hasSupabase) {
                        try {
                            & supabase db execute --file $sf.FullName 2>&1 | ForEach-Object { Write-Log $_ }
                            Write-Log "Executed seed SQL $($sf.Name) via supabase CLI."
                            continue
                        } catch {
                            Write-Log "supabase db execute failed for seed: $_"
                        }
                    }
                    if ($env:SUPABASE_DB_URL) {
                        & psql $env:SUPABASE_DB_URL -f $sf.FullName 2>&1 | ForEach-Object { Write-Log $_ }
                        Write-Log "psql executed seed $($sf.Name)."
                    } else {
                        Write-Log "SUPABASE_DB_URL not set; cannot execute seed $($sf.Name)."
                    }
                } elseif ($sf.Extension -eq '.csv') {
                    Write-Log "CSV seed detected: $($sf.Name). You must import CSVs manually or ensure psql/copy command usage."
                    # Offer to import CSV via COPY if SUPABASE_DB_URL set
                    if ($env:SUPABASE_DB_URL) {
                        $tableGuess = Read-Host "Enter target table for $($sf.Name) (or leave blank to skip)"
                        if ($tableGuess) {
                            try {
                                $copyCmd = "\COPY $tableGuess FROM '$($sf.FullName)' WITH (FORMAT csv, HEADER true);"
                                Write-Log "Executing COPY for $($sf.Name) into $tableGuess"
                                & psql $env:SUPABASE_DB_URL -c $copyCmd 2>&1 | ForEach-Object { Write-Log $_ }
                                Write-Log "CSV import attempted for $($sf.Name)."
                            } catch {
                                Write-Log "CSV import failed: $_"
                            }
                        } else {
                            Write-Log "User skipped CSV import for $($sf.Name)."
                        }
                    } else {
                        Write-Log "SUPABASE_DB_URL not set; cannot import CSV $($sf.Name)."
                    }
                }
            }
        } else {
            Write-Log "User skipped seed import."
        }
    } else {
        Write-Log "No seed files found in seed/."
    }
} else {
    Write-Log "No seed/ folder present."
}

# --- Post-deploy validation ---
Write-Log "Running basic post-deploy checks."
if ($hasSupabase) {
    try {
        Write-Log "Running 'supabase projects list' for verification (if supported)."
        & supabase projects list 2>&1 | ForEach-Object { Write-Log $_ }
    } catch {
        Write-Log "Optional supabase projects list failed or unsupported: $_"
    }
}

$ScriptEnd = Get-Date
$duration = $ScriptEnd - $ScriptStart
Write-Log "Deployment script finished in $($duration.ToString()). Log saved to $Global:LogFile"
Write-Host ""
Write-Host "Done. Review the log file at:"
Write-Host "  $Global:LogFile"
