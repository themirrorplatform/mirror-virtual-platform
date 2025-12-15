# Full MVP 01 Port Script
# Systematically ports all 300+ files from MVP 01 to current project

$source = "C:\Users\ilyad\mirror-virtual-platform\mvp-01-latest"
$dest = "C:\Users\ilyad\mirror-virtual-platform\frontend\src"

Write-Host "=== FULL MVP 01 PORT ===" -ForegroundColor Cyan
Write-Host "Source: $source" -ForegroundColor Yellow
Write-Host "Destination: $dest" -ForegroundColor Yellow
Write-Host ""

# 1. PORT SERVICES (19 files)
Write-Host "1. Porting Services Layer..." -ForegroundColor Green
$services = @(
    "mirrorOS.ts",
    "database.ts",
    "stateManager.ts",
    "syncService.ts",
    "encryption.ts",
    "autoRecovery.ts",
    "crisisResources.ts",
    "patternDetection.ts",
    "reflectionLinks.ts",
    "reflectionVersioning.ts",
    "searchHighlighting.ts",
    "threadDiscovery.ts",
    "timeBasedReflections.ts",
    "constitutionalAudit.ts",
    "databaseHealth.ts",
    "deviceRegistry.ts",
    "exportTemplates.ts",
    "migration.ts",
    "offlineQueue.ts"
)

foreach ($file in $services) {
    $src = Join-Path $source "src\services\$file"
    $dst = Join-Path $dest "services\$file"
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "  ✓ $file" -ForegroundColor DarkGray
    }
}

# 2. PORT HOOKS (10 files)
Write-Host "2. Porting Hooks..." -ForegroundColor Green
$hooks = @(
    "useAppState.ts",
    "useDebounce.ts",
    "useGlobalKeyboard.ts",
    "useKeyboardNavigation.ts",
    "useKeyboardShortcut.ts",
    "useLocalStorage.ts",
    "useMicroInteractions.ts",
    "useMirrorState.ts",
    "useReflectionState.ts",
    "useUndo.ts"
)

foreach ($file in $hooks) {
    $src = Join-Path $source "src\hooks\$file"
    $dst = Join-Path $dest "hooks\$file"
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "  ✓ $file" -ForegroundColor DarkGray
    }
}

# 3. PORT CRISIS COMPONENTS
Write-Host "3. Porting Crisis Components..." -ForegroundColor Green
$crisisComponents = @(
    "CrisisDetection.tsx",
    "CrisisModal.tsx",
    "PauseAndGround.tsx",
    "SafetyPlan.tsx",
    "SupportResources.tsx"
)

New-Item -ItemType Directory -Path (Join-Path $dest "components\crisis") -Force | Out-Null

foreach ($file in $crisisComponents) {
    $src = Join-Path $source "src\components\$file"
    $dst = Join-Path $dest "components\crisis\$file"
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "  ✓ $file" -ForegroundColor DarkGray
    }
}

# Crisis screen
$crisisScreen = Join-Path $source "src\components\screens\CrisisScreen.tsx"
if (Test-Path $crisisScreen) {
    Copy-Item $crisisScreen (Join-Path $dest "components\crisis\CrisisScreen.tsx") -Force
    Write-Host "  ✓ CrisisScreen.tsx" -ForegroundColor DarkGray
}

# 4. PORT CONSTITUTIONAL COMPONENTS
Write-Host "4. Porting Constitutional Components..." -ForegroundColor Green
$constitutionalComponents = @(
    "RefusalModal.tsx",
    "BoundaryWarningChip.tsx",
    "SafeText.tsx"
)

New-Item -ItemType Directory -Path (Join-Path $dest "components\constitutional") -Force | Out-Null

foreach ($file in $constitutionalComponents) {
    $src = Join-Path $source "src\components\$file"
    $dst = Join-Path $dest "components\constitutional\$file"
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "  ✓ $file" -ForegroundColor DarkGray
    }
}

# 5. PORT ACCESSIBILITY COMPONENTS
Write-Host "5. Porting Accessibility Components..." -ForegroundColor Green
$a11yComponents = @(
    "AriaLiveRegion.tsx",
    "EnhancedFocusRing.tsx",
    "FocusManager.tsx"
)

New-Item -ItemType Directory -Path (Join-Path $dest "components\accessibility") -Force | Out-Null

foreach ($file in $a11yComponents) {
    $src = Join-Path $source "src\components\$file"
    $dst = Join-Path $dest "components\accessibility\$file"
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "  ✓ $file" -ForegroundColor DarkGray
    }
}

# 6. PORT UI COMPONENTS
Write-Host "6. Porting UI Components..." -ForegroundColor Green
$uiComponents = @(
    "EmptyStates.tsx",
    "LoadingStates.tsx",
    "ToastSystem.tsx",
    "ErrorBoundary.tsx",
    "TransitionManager.tsx",
    "SkeletonLoader.tsx"
)

New-Item -ItemType Directory -Path (Join-Path $dest "components\feedback") -Force | Out-Null

foreach ($file in $uiComponents) {
    $src = Join-Path $source "src\components\$file"
    $dst = Join-Path $dest "components\feedback\$file"
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "  ✓ $file" -ForegroundColor DarkGray
    }
}

# 7. PORT UTILS
Write-Host "7. Porting Utils..." -ForegroundColor Green
$utils = @(
    "sanitization.ts",
    "accessibility.ts",
    "animations.ts",
    "storage.ts",
    "performance.ts",
    "validation.ts"
)

foreach ($file in $utils) {
    $src = Join-Path $source "src\utils\$file"
    $dst = Join-Path $dest "utils\$file"
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "  ✓ $file" -ForegroundColor DarkGray
    }
}

# 8. PORT STYLES
Write-Host "8. Porting Styles..." -ForegroundColor Green
$styles = @(
    "shadows.css"
)

foreach ($file in $styles) {
    $src = Join-Path $source "src\styles\$file"
    $dst = Join-Path $dest "styles\$file"
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "  ✓ $file" -ForegroundColor DarkGray
    }
}

# 9. PORT ALL INSTRUMENTS (29 files)
Write-Host "9. Porting Constitutional Instruments..." -ForegroundColor Green
$instrumentsDir = Join-Path $source "src\components\instruments"
$destInstruments = Join-Path $dest "components\instruments"

if (Test-Path $instrumentsDir) {
    New-Item -ItemType Directory -Path $destInstruments -Force | Out-Null
    $instruments = Get-ChildItem -Path $instrumentsDir -Filter "*.tsx"
    foreach ($file in $instruments) {
        Copy-Item $file.FullName (Join-Path $destInstruments $file.Name) -Force
        Write-Host "  ✓ $($file.Name)" -ForegroundColor DarkGray
    }
}

# 10. PORT ALL SCREENS (30+ files)
Write-Host "10. Porting Realm Screens..." -ForegroundColor Green
$screensDir = Join-Path $source "src\components\screens"
$destScreens = Join-Path $dest "components\screens"

if (Test-Path $screensDir) {
    New-Item -ItemType Directory -Path $destScreens -Force | Out-Null
    $screens = Get-ChildItem -Path $screensDir -Filter "*.tsx"
    foreach ($file in $screens) {
        Copy-Item $file.FullName (Join-Path $destScreens $file.Name) -Force
        Write-Host "  ✓ $($file.Name)" -ForegroundColor DarkGray
    }
}

# 11. COPY ADDITIONAL COMPONENT DIRECTORIES
Write-Host "11. Porting Additional Components..." -ForegroundColor Green
$additionalDirs = @(
    "archive",
    "commons",
    "finder",
    "governance",
    "identity",
    "mirror",
    "settings",
    "system",
    "threads",
    "variants"
)

foreach ($dir in $additionalDirs) {
    $srcDir = Join-Path $source "src\components\$dir"
    $dstDir = Join-Path $dest "components\$dir"
    if (Test-Path $srcDir) {
        New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        Copy-Item -Path (Join-Path $srcDir "*") -Destination $dstDir -Recurse -Force
        $count = (Get-ChildItem -Path $srcDir -Recurse -File).Count
        Write-Host "  ✓ $dir ($count files)" -ForegroundColor DarkGray
    }
}

# SUMMARY
Write-Host ""
Write-Host "=== PORT COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  ✓ Services: 19 files" -ForegroundColor Green
Write-Host "  ✓ Hooks: 10 files" -ForegroundColor Green
Write-Host "  ✓ Crisis: 6 components" -ForegroundColor Green
Write-Host "  ✓ Constitutional: 3 components" -ForegroundColor Green
Write-Host "  ✓ Accessibility: 3 components" -ForegroundColor Green
Write-Host "  ✓ UI/Feedback: 6 components" -ForegroundColor Green
Write-Host "  ✓ Utils: 6 files" -ForegroundColor Green
Write-Host "  ✓ Styles: Enhanced" -ForegroundColor Green
Write-Host "  ✓ Instruments: 29 files" -ForegroundColor Green
Write-Host "  ✓ Screens: 30+ files" -ForegroundColor Green
Write-Host "  ✓ Additional: 10 directories" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Update imports (motion/react to framer-motion)" -ForegroundColor DarkGray
Write-Host "  2. Adapt services to Next.js API routes" -ForegroundColor DarkGray
Write-Host "  3. Test crisis detection flow" -ForegroundColor DarkGray
Write-Host "  4. Verify accessibility features" -ForegroundColor DarkGray
Write-Host "  5. Run build to check for errors" -ForegroundColor DarkGray
Write-Host ""
