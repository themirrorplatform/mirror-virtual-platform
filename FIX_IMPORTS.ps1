# Import Fix Script - Updates all ported files to work with Next.js + current project structure

$frontendSrc = "C:\Users\ilyad\mirror-virtual-platform\frontend\src"

Write-Host "=== FIXING IMPORTS ===" -ForegroundColor Cyan
Write-Host ""

# Get all TypeScript/TSX files in ported directories
$dirs = @(
    "services",
    "hooks",
    "components\crisis",
    "components\constitutional",
    "components\accessibility",
    "components\feedback",
    "components\instruments-mvp",
    "components\screens-mvp",
    "components\archive",
    "components\commons",
    "components\finder",
    "components\governance",
    "components\identity",
    "components\mirror",
    "components\settings",
    "components\system",
    "components\threads",
    "components\variants",
    "utils"
)

$filesFixed = 0

foreach ($dir in $dirs) {
    $path = Join-Path $frontendSrc $dir
    if (Test-Path $path) {
        $files = Get-ChildItem -Path $path -Filter "*.ts*" -Recurse
        
        foreach ($file in $files) {
            $content = Get-Content -Path $file.FullName -Raw
            $originalContent = $content
            
            # Fix 1: motion/react → framer-motion
            $content = $content -replace "from 'motion/react'", "from 'framer-motion'"
            $content = $content -replace 'from "motion/react"', 'from "framer-motion"'
            
            # Fix 2: Remove Button/Modal/Input imports (we have our own UI components)
            # These will need manual review but comment them out
            $content = $content -replace "import \{ ([^\}]*Button[^\}]*) \} from '\./Button';", "// import { `$1 } from './Button'; // TODO: Use UI components from project"
            $content = $content -replace "import \{ ([^\}]*Modal[^\}]*) \} from '\./Modal';", "// import { `$1 } from './Modal'; // TODO: Use UI components from project"
            $content = $content -replace "import \{ ([^\}]*Input[^\}]*|.*Radio.*) \} from '\./Input';", "// import { `$1 } from './Input'; // TODO: Use UI components from project"
            
            # Fix 3: Update relative service imports
            $content = $content -replace "from '\.\./services/", "from '@/services/"
            $content = $content -replace "from '\.\./\.\./services/", "from '@/services/"
            $content = $content -replace "from '\.\./\.\./\.\./services/", "from '@/services/"
            
            # Fix 4: Update relative hooks imports
            $content = $content -replace "from '\.\./hooks/", "from '@/hooks/"
            $content = $content -replace "from '\.\./\.\./hooks/", "from '@/hooks/"
            
            # Fix 5: Update relative utils imports
            $content = $content -replace "from '\.\./utils/", "from '@/utils/"
            $content = $content -replace "from '\.\./\.\./utils/", "from '@/utils/"
            
            # Fix 6: Update relative component imports
            $content = $content -replace "from '\.\./components/", "from '@/components/"
            $content = $content -replace "from '\.\./\.\./components/", "from '@/components/"
            
            # Only write if changes were made
            if ($content -ne $originalContent) {
                Set-Content -Path $file.FullName -Value $content -NoNewline
                $filesFixed++
                Write-Host "  ✓ $($file.Name)" -ForegroundColor DarkGray
            }
        }
    }
}

Write-Host ""
Write-Host "Fixed $filesFixed files" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Manual review needed for:" -ForegroundColor Yellow
Write-Host "  - Button/Modal/Input component imports" -ForegroundColor DarkGray
Write-Host "  - Database service (IndexedDB to Supabase)" -ForegroundColor DarkGray
Write-Host "  - mirrorOS service (adapt to API routes)" -ForegroundColor DarkGray
Write-Host ""
