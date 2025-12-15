# Export The Mirror to VS Code

This guide helps you download every line of code from this Figma Make project to your local VS Code environment.

## Quick Start (5 minutes)

### Step 1: Download from Figma Make

**In Figma Make interface:**
1. Look for the **Export/Download** button (usually top-right corner)
2. Select **"Download Project"** or **"Export Code"**
3. Save the ZIP file to your desktop

**Can't find export button?** See Manual Export below.

---

## Step 2: Set Up Locally

### Option A: If you downloaded a ZIP

```bash
cd ~/Desktop
unzip the-mirror.zip
cd the-mirror
npm install
npm run dev
```

### Option B: Manual Setup

```bash
# Create project folder
mkdir ~/Desktop/the-mirror
cd ~/Desktop/the-mirror

# Initialize Vite + React + TypeScript
npm create vite@latest . -- --template react-ts

# Install all dependencies
npm install

# Install additional packages
npm install motion lucide-react idb recharts
npm install sonner@2.0.3
npm install react-hook-form@7.55.0

# Start dev server
npm run dev
```

---

## Step 3: Copy Files from Figma Make

If you can't download directly, follow this process:

### Core Files (Copy these first)

1. **App.tsx** - Main application entry
2. **styles/globals.css** - All design tokens
3. **services/** - All 16 service files
4. **hooks/** - All 8 custom hooks
5. **components/** - All 200+ components
6. **utils/** - All utility files

### File Structure

```
the-mirror/
├── src/
│   ├── App.tsx                 ← Main entry point
│   ├── components/             ← 200+ UI components
│   │   ├── screens/           ← 20 main screens
│   │   ├── instruments/       ← 20 constitutional instruments
│   │   ├── ui/                ← 40+ base UI components
│   │   ├── advanced/          ← Advanced features
│   │   ├── system/            ← System components
│   │   ├── governance/        ← Governance tools
│   │   └── ...
│   ├── services/              ← Backend services
│   │   ├── database.ts        ← IndexedDB
│   │   ├── mirrorOS.ts        ← AI service
│   │   ├── encryption.ts      ← Security
│   │   └── ...
│   ├── hooks/                 ← Custom React hooks
│   ├── utils/                 ← Utilities
│   ├── styles/                ← CSS
│   └── guidelines/            ← Constitutional docs
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Step 4: Package.json Configuration

Create this `package.json`:

```json
{
  "name": "the-mirror",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "motion": "^11.11.17",
    "lucide-react": "latest",
    "idb": "^8.0.0",
    "recharts": "^2.12.0",
    "sonner": "^2.0.3",
    "react-hook-form": "^7.55.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.6.2",
    "vite": "^6.0.1"
  }
}
```

---

## Step 5: Vite Configuration

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: ['motion/react', 'lucide-react', 'idb'],
  },
})
```

---

## Step 6: TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

---

## Step 7: Index HTML

Create `index.html` in root:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>The Mirror</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Step 8: Main Entry Point

Create `src/main.tsx`:

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

## File Count Summary

Total files to copy: **~300 files**

- **Components**: 200+ files
- **Services**: 16 files
- **Hooks**: 8 files
- **Utils**: 5 files
- **Styles**: 2 files
- **Guidelines**: 6 files
- **Config**: 4 files

---

## Verification Checklist

After copying files:

- [ ] All components compile without errors
- [ ] `npm run dev` starts successfully
- [ ] Browser shows "THE MIRROR" welcome screen
- [ ] Command palette opens (Cmd/Ctrl+K)
- [ ] Can create reflections
- [ ] IndexedDB stores data locally
- [ ] All 5 realms accessible

---

## Common Issues & Fixes

### Missing dependencies
```bash
npm install motion lucide-react idb recharts sonner@2.0.3 react-hook-form@7.55.0
```

### Import errors
- Check file paths match exactly
- Ensure all files copied to correct folders
- Verify no missing files

### Build errors
```bash
npm run build
# Check console for specific errors
```

---

## Contact & Support

If you have issues:
1. Check the console for specific error messages
2. Verify all files copied correctly
3. Ensure dependencies installed
4. Check Node version (need 18+)

---

## Alternative: GitHub Repository

Want to use Git?

```bash
cd ~/Desktop/the-mirror
git init
git add .
git commit -m "Initial commit - The Mirror export"
git remote add origin https://github.com/yourusername/the-mirror.git
git push -u origin main
```

---

**You now have The Mirror running locally on your desktop!** 🎯
