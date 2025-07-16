# Website Chat Admin - Android App

Android app for website administrators to handle real-time chat messages with visitors.

## Features

- JWT-based authentication
- Real-time messaging via WebSocket
- Conversation list with unread counts
- Individual chat interface
- Material You design with Jetpack Compose

## Setup

1. Install Android Studio
2. Copy `local.properties.example` to `local.properties` and update the SDK path
3. Update the backend URL in `NetworkModule.kt`:
   - For emulator: `http://10.0.2.2:8000/`
   - For physical device: `http://YOUR_COMPUTER_IP:8000/`
4. Build and run the app

## Architecture

- **UI**: Jetpack Compose
- **Navigation**: Navigation Compose
- **DI**: Dagger Hilt
- **Networking**: Retrofit + OkHttp
- **WebSocket**: OkHttp WebSocket
- **State Management**: ViewModel + StateFlow
- **Local Storage**: DataStore

## Project Structure

```
app/
├── src/main/java/com/websitechat/admin/
│   ├── data/
│   │   ├── models/      # Data models
│   │   ├── network/     # API service, WebSocket manager
│   │   └── repository/  # Repository layer
│   ├── di/              # Dependency injection
│   ├── ui/
│   │   ├── navigation/  # Navigation setup
│   │   ├── screens/     # UI screens
│   │   └── theme/       # Material theme
│   └── MainActivity.kt
└── build.gradle.kts
```

## Building

```bash
cd apps/admin-android
./gradlew assembleDebug
```

The APK will be generated at `app/build/outputs/apk/debug/app-debug.apk`