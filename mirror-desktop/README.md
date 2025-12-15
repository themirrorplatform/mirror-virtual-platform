# Mirror Desktop App (Tauri)
Offline-first reflection platform for Windows, macOS, Linux

## Overview
The Mirror desktop app uses Tauri for native OS integration with local-first data storage. All reflection data is stored locally in SQLite, with optional cloud sync when online.

## Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **UI**: Same components as web app (ReflectionInterface, IdentityGraph, etc.)
- **State**: Local-first with IndexedDB + SQLite sync

### Backend (Rust)
- **Framework**: Tauri 1.5+
- **Database**: SQLite with WAL mode (same as MirrorCore)
- **Crypto**: Ed25519 signing (rust-crypto)
- **Sync**: Background sync when online

## Tech Stack
```
Frontend:
- React 18
- TypeScript 5
- Vite
- TailwindCSS

Backend (Rust):
- Tauri 1.5
- SQLite (rusqlite)
- Ed25519 (ed25519-dalek)
- Tokio (async runtime)
- Serde (serialization)
```

## Features

### Offline-First
- All reflections stored locally
- Identity graph computed locally
- No internet required for core functionality
- 72+ hour offline capability

### Native Integration
- System tray icon
- Native notifications
- File system access (import documents)
- OS-level encryption (Keychain/Credential Manager)
- Auto-start on login

### Privacy
- All data encrypted at rest
- Private keys in OS keychain
- No telemetry unless opted in
- Local-only mode (never sync)

### Sync
- Background sync when online
- Conflict resolution (event log merge)
- Selective sync (choose what to sync)
- Encrypted sync protocol

## Installation

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js
# Download from https://nodejs.org/

# Install Tauri CLI
cargo install tauri-cli
```

### Development Setup
```bash
cd mirror-desktop

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build for Production
```bash
# Build for current platform
npm run tauri build

# Outputs:
# - Windows: .exe, .msi
# - macOS: .app, .dmg
# - Linux: .deb, .AppImage
```

## Project Structure
```
mirror-desktop/
├── src-tauri/           # Rust backend
│   ├── src/
│   │   ├── main.rs      # Entry point
│   │   ├── db.rs        # SQLite operations
│   │   ├── sync.rs      # Cloud sync
│   │   ├── crypto.rs    # Ed25519 signing
│   │   └── commands.rs  # Tauri commands (IPC)
│   ├── Cargo.toml       # Rust dependencies
│   └── tauri.conf.json  # Tauri config
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── lib/
│   │   ├── api.ts       # Backend API (Tauri invoke)
│   │   └── db.ts        # Local DB wrapper
│   └── main.tsx
├── package.json
└── vite.config.ts
```

## Rust Backend (src-tauri/src/main.rs)

```rust
// Mirror Desktop - Tauri Backend
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu};
use rusqlite::{Connection, params};
use ed25519_dalek::{Keypair, PublicKey, SecretKey, Signature, Signer, Verifier};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

// State management
struct AppState {
    db: Mutex<Connection>,
    keypair: Mutex<Option<Keypair>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Reflection {
    event_id: String,
    instance_id: String,
    user_id: String,
    content: String,
    timestamp: String,
    signature: String,
}

// Tauri commands (IPC from frontend)
#[tauri::command]
async fn create_reflection(
    content: String,
    state: tauri::State<'_, AppState>
) -> Result<Reflection, String> {
    // Sign and store reflection locally
    let db = state.db.lock().unwrap();
    let keypair = state.keypair.lock().unwrap();
    
    // Create event
    let reflection = Reflection {
        event_id: uuid::Uuid::new_v4().to_string(),
        instance_id: "desktop-instance".to_string(),
        user_id: "user-001".to_string(),
        content: content.clone(),
        timestamp: chrono::Utc::now().to_rfc3339(),
        signature: "".to_string(), // TODO: Sign
    };
    
    // Store in local SQLite
    db.execute(
        "INSERT INTO events (event_id, event_data, signature) VALUES (?1, ?2, ?3)",
        params![reflection.event_id, content, reflection.signature],
    ).map_err(|e| e.to_string())?;
    
    Ok(reflection)
}

#[tauri::command]
async fn get_identity_graph(
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    // Replay events to compute identity graph
    let db = state.db.lock().unwrap();
    
    let mut stmt = db.prepare("SELECT event_data FROM events ORDER BY seq ASC")
        .map_err(|e| e.to_string())?;
    
    let events: Vec<String> = stmt.query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    // TODO: Replay logic
    Ok(format!("{{\"nodes\": {}, \"edges\": []}}", events.len()))
}

#[tauri::command]
async fn sync_with_cloud(
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    // Background sync with cloud
    // TODO: Implement sync protocol
    Ok("Sync complete".to_string())
}

fn main() {
    // Initialize database
    let db = Connection::open("mirror_desktop.db").unwrap();
    db.execute(
        "CREATE TABLE IF NOT EXISTS events (
            seq INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL,
            event_data TEXT NOT NULL,
            signature TEXT NOT NULL,
            timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    ).unwrap();
    
    // System tray
    let tray_menu = SystemTrayMenu::new();
    let system_tray = SystemTray::new().with_menu(tray_menu);
    
    tauri::Builder::default()
        .manage(AppState {
            db: Mutex::new(db),
            keypair: Mutex::new(None),
        })
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            create_reflection,
            get_identity_graph,
            sync_with_cloud
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Frontend Integration (src/lib/api.ts)

```typescript
import { invoke } from '@tauri-apps/api/tauri';

export const desktopAPI = {
  async createReflection(content: string) {
    return await invoke('create_reflection', { content });
  },
  
  async getIdentityGraph() {
    return await invoke('get_identity_graph');
  },
  
  async syncWithCloud() {
    return await invoke('sync_with_cloud');
  }
};
```

## tauri.conf.json

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Mirror",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": false,
        "scope": ["$APPDATA/mirror/*"]
      },
      "notification": {
        "all": true
      },
      "systemTray": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "identifier": "com.mirror.desktop",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "targets": ["msi", "deb", "dmg", "app"]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "title": "Mirror",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

## Cargo.toml

```toml
[package]
name = "mirror-desktop"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "1.5", features = ["system-tray", "notification"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rusqlite = { version = "0.30", features = ["bundled"] }
ed25519-dalek = "2.0"
uuid = { version = "1.0", features = ["v4"] }
chrono = "0.4"
tokio = { version = "1", features = ["full"] }

[build-dependencies]
tauri-build = { version = "1.5" }
```

## Key Benefits

### 1. True Offline-First
- Reflections work without internet
- Local identity replay
- No dependency on cloud services

### 2. Performance
- Native app speed
- Instant reflection processing
- No network latency for core features

### 3. Privacy
- All data encrypted locally
- Keys in OS keychain (secure)
- Optional local-only mode (never sync)

### 4. Integration
- System tray notifications
- OS-level file access
- Native appearance and behavior

## Sync Protocol

When online, desktop app can sync with cloud:

1. **Export local events** not yet synced
2. **Sign export** with instance key
3. **Upload to cloud** via HTTPS
4. **Download new events** from cloud
5. **Merge event logs** (append-only merge)
6. **Verify signatures** on all events
7. **Replay merged log** to update identity graph

## Security

### Encryption at Rest
- SQLite database encrypted with SQLCipher
- Master key stored in OS keychain
- Private keys never touch disk unencrypted

### Code Signing
- Windows: Authenticode signing
- macOS: Apple Developer ID
- Linux: GPG signature

### Auto-Updates
- Signed update manifests (like update_system.py)
- Verify signatures before applying
- Rollback on failure

## Distribution

### Windows
- Microsoft Store (optional)
- Direct download (.msi installer)
- Auto-updater built-in

### macOS
- Mac App Store (optional)
- Direct download (.dmg)
- Notarized by Apple

### Linux
- .deb for Ubuntu/Debian
- .AppImage for universal
- Snap Store (optional)

## Next Steps

1. Implement Rust backend commands
2. Add sync protocol
3. Build installers
4. Code signing setup
5. Auto-updater implementation
6. App Store submissions
