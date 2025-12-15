# The Mirror - Quick Start Guide
**Get up and running in 5 minutes**

---

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/the-mirror.git
cd the-mirror

# Install dependencies
npm install

# Start development server
npm run dev
```

**Open:** http://localhost:5173

---

## 📁 Project Structure

```
the-mirror/
├── components/          # UI components
│   ├── instruments/     # Constitutional instruments
│   ├── screens/         # Full-screen views
│   └── *.tsx           # Reusable components
│
├── hooks/              # React hooks
│   ├── useMirrorState.ts
│   └── useUndo.ts
│
├── services/           # Business logic
│   ├── database.ts     # IndexedDB layer
│   ├── stateManager.ts # Global state
│   └── *.ts
│
├── utils/              # Pure functions
│   ├── accessibility.ts
│   ├── sanitization.ts
│   └── performance.ts
│
├── tests/              # Integration tests
│   ├── integration/
│   └── setup.ts
│
├── styles/
│   └── globals.css     # Design system
│
└── App.tsx             # Main application
```

---

## 🎯 Key Concepts

### **1. The Five Realms**
- **Mirror** → Private reflection
- **Threads** → Evolution over time
- **Archive** → Memory without shame
- **World** → Witnessing others
- **Self** → Identity & sovereignty

### **2. Constitutional Principles**
- No directive language
- No engagement optimization
- No required order
- Silence-first design
- User sovereignty

### **3. Three Layers**
- **Sovereign** → Private (default)
- **Commons** → Shared
- **Builder** → Advanced

---

## 🛠️ Common Tasks

### Run Tests
```bash
npm test
```

### Run Accessibility Scan
```bash
# Install axe DevTools browser extension
# Then manually scan in browser
```

### Clean Production Code
```bash
npm run cleanup --dry-run  # Preview
npm run cleanup            # Execute
```

### Build for Production
```bash
npm run build
```

---

## 🎨 Making Changes

### Add a New Component
```tsx
// /components/MyComponent.tsx
interface MyComponentProps {
  value: string;
}

export function MyComponent({ value }: MyComponentProps) {
  return <div>{value}</div>;
}
```

### Add a New Screen
```tsx
// /components/screens/MyScreen.tsx
export function MyScreen() {
  return (
    <div className="p-8">
      {/* Screen content */}
    </div>
  );
}
```

### Add a New Instrument
See `/DEVELOPER_GUIDE.md` → "Adding New Instruments"

---

## 📖 Documentation

- **User Guide:** `/USER_GUIDE.md`
- **Developer Guide:** `/DEVELOPER_GUIDE.md`
- **Launch Checklist:** `/LAUNCH_CHECKLIST.md`
- **Project Complete:** `/PROJECT_COMPLETE.md`

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Command Palette |
| `⌘⇧C` | Crisis Support |
| `ESC` | Close instrument |
| `⌘S` | Save reflection |

---

## 🐛 Troubleshooting

### Database Issues
```typescript
// Clear database (dev only)
import { databaseService } from './services/database';
await databaseService.clearAll();
```

### State Issues
```typescript
// Reset state
import { stateManager } from './services/stateManager';
stateManager.reset();
```

### Build Issues
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

---

## 🧪 Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Single file
npm test reflection-flow

# Coverage
npm test -- --coverage
```

---

## 🚢 Deployment

### Quick Deploy (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Deploy
```bash
# Build
npm run build

# Upload /dist folder to your host
```

---

## 📚 Learning Path

1. **Start:** Read `/Guidelines.md` (Constitutional principles)
2. **Explore:** Open app, summon instruments (⌘K)
3. **Understand:** Read `/DEVELOPER_GUIDE.md`
4. **Build:** Add a new instrument
5. **Test:** Write integration tests
6. **Ship:** Follow `/LAUNCH_CHECKLIST.md`

---

## 🆘 Getting Help

- **GitHub Issues:** https://github.com/yourusername/the-mirror/issues
- **Email:** support@themirror.app
- **Discord:** https://discord.gg/mirror

---

## ✅ Quick Checklist

Before committing:
- [ ] Tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Constitutional alignment verified
- [ ] Accessibility considered
- [ ] Security reviewed

---

## 🎉 You're Ready!

**The Mirror is now running locally.**

**Open the Command Palette (⌘K) and explore.**

**Read the full guides for deeper understanding:**
- `/USER_GUIDE.md` - How to use The Mirror
- `/DEVELOPER_GUIDE.md` - How to extend The Mirror
- `/PROJECT_COMPLETE.md` - What's been built

**Happy reflecting! 🪞**

---

**Version:** 1.0.0-beta  
**Last Updated:** December 15, 2024
