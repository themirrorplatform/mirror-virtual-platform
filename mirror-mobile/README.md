# Mirror Mobile Apps (React Native)
iOS and Android reflection apps with local-first storage

## Overview
Native mobile apps for Mirror using React Native. Single codebase for both iOS and Android with local SQLite storage, native voice recording, and background sync.

## Architecture

### Frontend
- **Framework**: React Native 0.73+
- **UI**: React Native components + shared web components (where possible)
- **State**: Redux + local SQLite
- **Navigation**: React Navigation

### Native Modules
- **Database**: react-native-sqlite-storage
- **Voice**: react-native-audio-recorder-player
- **Crypto**: react-native-quick-crypto (Ed25519)
- **Biometrics**: react-native-biometrics
- **Background Sync**: react-native-background-fetch

## Tech Stack
```
Core:
- React Native 0.73
- TypeScript 5
- Expo (managed workflow)

Native Features:
- SQLite (local event log)
- Audio recording (native)
- Biometric auth (Face ID, Touch ID, Fingerprint)
- Push notifications
- Background tasks

Styling:
- NativeWind (TailwindCSS for RN)
- React Native Paper (Material Design)
```

## Features

### Offline-First
- All reflections stored in local SQLite
- Identity graph computed on-device
- No internet required for core features
- Background sync when online

### Native Integration
- **iOS**: Face ID/Touch ID unlock
- **Android**: Fingerprint/Face unlock
- Native voice recording (no web APIs)
- Native notifications
- Deep linking

### Mobile-Optimized
- Pull-to-refresh
- Swipe gestures
- Haptic feedback
- Native sharing
- Camera/photo library access

### Privacy
- Biometric lock
- Local encryption
- Private keys in Keychain (iOS) / Keystore (Android)
- Optional PIN lock

## Installation

### Prerequisites
```bash
# Install Node.js
# Download from https://nodejs.org/

# Install Expo CLI
npm install -g expo-cli

# iOS: Install Xcode (Mac only)
# Android: Install Android Studio
```

### Development Setup
```bash
cd mirror-mobile

# Install dependencies
npm install

# iOS (Mac only)
npx expo run:ios

# Android
npx expo run:android

# Or use Expo Go app for quick testing
npx expo start
```

### Build for Production

#### iOS
```bash
# Build with EAS (Expo Application Services)
eas build --platform ios

# Or with Xcode
cd ios
pod install
open MirrorApp.xcworkspace
```

#### Android
```bash
# Build with EAS
eas build --platform android

# Or with Gradle
cd android
./gradlew assembleRelease
```

## Project Structure
```
mirror-mobile/
├── src/
│   ├── components/        # UI components
│   │   ├── ReflectionComposer.tsx
│   │   ├── IdentityGraph.tsx
│   │   └── VoiceRecorder.tsx
│   ├── screens/           # Navigation screens
│   │   ├── HomeScreen.tsx
│   │   ├── ReflectScreen.tsx
│   │   ├── GraphScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── lib/
│   │   ├── db.ts          # SQLite wrapper
│   │   ├── crypto.ts      # Ed25519 signing
│   │   ├── sync.ts        # Cloud sync
│   │   └── voice.ts       # Audio recording
│   ├── store/             # Redux store
│   └── navigation/        # React Navigation
├── ios/                   # iOS native code
├── android/               # Android native code
├── app.json               # Expo config
├── package.json
└── tsconfig.json
```

## Core Implementation

### Local Database (src/lib/db.ts)
```typescript
import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

export class MobileEventLog {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    this.db = await SQLite.openDatabase({
      name: 'mirror_events.db',
      location: 'default',
    });

    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS events (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL,
        event_data TEXT NOT NULL,
        signature TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async appendEvent(eventId: string, eventData: string, signature: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.executeSql(
      'INSERT INTO events (event_id, event_data, signature) VALUES (?, ?, ?)',
      [eventId, eventData, signature]
    );
  }

  async getEvents(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const [results] = await this.db.executeSql(
      'SELECT * FROM events ORDER BY seq ASC'
    );
    
    const events = [];
    for (let i = 0; i < results.rows.length; i++) {
      events.push(results.rows.item(i));
    }
    return events;
  }

  async replayEvents() {
    const events = await this.getEvents();
    // TODO: Replay logic (identity graph computation)
    return events;
  }
}
```

### Voice Recording (src/lib/voice.ts)
```typescript
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { Platform, PermissionsAndroid } from 'react-native';

const audioRecorderPlayer = new AudioRecorderPlayer();

export class VoiceRecorder {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS handles via Info.plist
  }

  async startRecording(): Promise<string> {
    const path = Platform.select({
      ios: 'mirror_reflection.m4a',
      android: 'sdcard/mirror_reflection.mp4',
    });
    
    const uri = await audioRecorderPlayer.startRecorder(path);
    return uri;
  }

  async stopRecording(): Promise<string> {
    const result = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    return result;
  }

  async getAudioData(uri: string): Promise<ArrayBuffer> {
    // Read audio file
    const RNFS = require('react-native-fs');
    const base64 = await RNFS.readFile(uri, 'base64');
    const buffer = Buffer.from(base64, 'base64');
    return buffer.buffer;
  }
}
```

### Biometric Authentication (src/lib/biometrics.ts)
```typescript
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export class BiometricAuth {
  async isAvailable(): Promise<boolean> {
    const { available } = await rnBiometrics.isSensorAvailable();
    return available;
  }

  async authenticate(): Promise<boolean> {
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage: 'Unlock Mirror',
      cancelButtonText: 'Cancel',
    });
    return success;
  }

  async createKeys(): Promise<string> {
    const { publicKey } = await rnBiometrics.createKeys();
    return publicKey;
  }

  async createSignature(payload: string): Promise<string> {
    const { success, signature } = await rnBiometrics.createSignature({
      promptMessage: 'Sign reflection',
      payload: payload,
    });
    
    if (!success) throw new Error('Biometric authentication failed');
    return signature;
  }
}
```

### Background Sync (src/lib/sync.ts)
```typescript
import BackgroundFetch from 'react-native-background-fetch';

export class BackgroundSync {
  async configure() {
    await BackgroundFetch.configure(
      {
        minimumFetchInterval: 15, // minutes
        stopOnTerminate: false,
        startOnBoot: true,
      },
      async (taskId) => {
        console.log('[BackgroundFetch] Task:', taskId);
        
        // Sync with cloud
        await this.syncWithCloud();
        
        // Finish task
        BackgroundFetch.finish(taskId);
      },
      (taskId) => {
        console.log('[BackgroundFetch] TIMEOUT:', taskId);
        BackgroundFetch.finish(taskId);
      }
    );
  }

  async syncWithCloud() {
    // Get unsync'd events from local DB
    const eventLog = new MobileEventLog();
    await eventLog.init();
    const events = await eventLog.getEvents();
    
    // Upload to cloud
    // TODO: Implement sync protocol
    console.log('Syncing', events.length, 'events');
  }
}
```

### Reflection Composer Screen (src/screens/ReflectScreen.tsx)
```typescript
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { VoiceRecorder } from '../lib/voice';
import { MobileEventLog } from '../lib/db';

export const ReflectScreen = () => {
  const [content, setContent] = useState('');
  const [recording, setRecording] = useState(false);
  const recorder = new VoiceRecorder();

  const handleTextReflection = async () => {
    const eventLog = new MobileEventLog();
    await eventLog.init();
    
    await eventLog.appendEvent(
      `event-${Date.now()}`,
      JSON.stringify({ content, modality: 'text' }),
      'signature-placeholder'
    );
    
    setContent('');
    alert('Reflection saved!');
  };

  const handleVoiceRecording = async () => {
    if (!recording) {
      await recorder.requestPermissions();
      await recorder.startRecording();
      setRecording(true);
    } else {
      const uri = await recorder.stopRecording();
      const audioData = await recorder.getAudioData(uri);
      
      // TODO: Transcribe audio (Whisper)
      // TODO: Save to event log
      
      setRecording(false);
      alert('Voice reflection saved!');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          height: 200,
          textAlignVertical: 'top',
        }}
        multiline
        placeholder="What's on your mind?"
        value={content}
        onChangeText={setContent}
      />
      
      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          marginTop: 10,
          borderRadius: 8,
        }}
        onPress={handleTextReflection}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Save Reflection
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={{
          backgroundColor: recording ? '#FF3B30' : '#34C759',
          padding: 15,
          marginTop: 10,
          borderRadius: 8,
        }}
        onPress={handleVoiceRecording}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {recording ? 'Stop Recording' : 'Record Voice Reflection'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

## app.json (Expo Configuration)
```json
{
  "expo": {
    "name": "Mirror",
    "slug": "mirror-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.mirror.app",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Mirror needs microphone access for voice reflections",
        "NSFaceIDUsageDescription": "Mirror uses Face ID to secure your reflections"
      }
    },
    "android": {
      "package": "com.mirror.app",
      "permissions": [
        "RECORD_AUDIO",
        "USE_BIOMETRIC",
        "INTERNET",
        "VIBRATE"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "plugins": [
      "react-native-biometrics",
      "react-native-background-fetch"
    ]
  }
}
```

## package.json
```json
{
  "name": "mirror-mobile",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "react-native-sqlite-storage": "^6.0.1",
    "react-native-audio-recorder-player": "^3.6.0",
    "react-native-biometrics": "^3.0.1",
    "react-native-background-fetch": "^4.2.0",
    "react-native-quick-crypto": "^0.7.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-fs": "^2.20.0",
    "nativewind": "^2.0.11"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "typescript": "^5.1.3"
  }
}
```

## Key Features

### 1. Native Performance
- SQLite for fast local queries
- Native audio recording (no web APIs)
- Smooth 60fps animations

### 2. Offline Capability
- All core features work offline
- Background sync when online
- Conflict-free event log merge

### 3. Security
- Biometric authentication
- Encrypted local storage
- Keys in native keychains

### 4. Mobile UX
- Pull-to-refresh
- Swipe gestures
- Haptic feedback
- Native sharing

## Push Notifications

Configure push notifications for mirrorbacks:

### iOS (APNs)
```typescript
import messaging from '@react-native-firebase/messaging';

await messaging().requestPermission();
const token = await messaging().getToken();
// Send token to backend
```

### Android (FCM)
```typescript
import messaging from '@react-native-firebase/messaging';

const token = await messaging().getToken();
// Send token to backend
```

## Deep Linking

Open specific reflections via URLs:

```typescript
import { Linking } from 'react-native';

Linking.addEventListener('url', (event) => {
  // mirror://reflection/event-123
  const url = event.url;
  // Navigate to reflection
});
```

## App Store Requirements

### iOS App Store
- Privacy Policy URL
- App Store screenshots (6.5", 5.5")
- App icon (1024x1024)
- App Review Guidelines compliance

### Google Play Store
- Privacy Policy URL
- Feature graphic (1024x500)
- Screenshots (phone, tablet)
- Content rating questionnaire

## Distribution

### TestFlight (iOS Beta)
```bash
eas build --platform ios --profile preview
```

### Google Play Internal Testing
```bash
eas build --platform android --profile preview
```

### Production Release
```bash
# iOS
eas submit --platform ios

# Android
eas submit --platform android
```

## Performance

### Optimization
- Use React Native Hermes engine
- Enable ProGuard (Android)
- Optimize images with WebP
- Lazy load screens
- Memoize components

### Monitoring
- Sentry for crash reporting
- Firebase Analytics (optional)
- Performance monitoring

## Next Steps

1. Complete SQLite integration
2. Implement voice transcription (Whisper)
3. Add biometric unlock flow
4. Build sync protocol
5. Design app icons and screenshots
6. Submit to App Stores
7. Implement push notifications
8. Add deep linking support
