# Admin Android App

React Native mobile app for the website chat admin interface, built with Expo.

## Features

- **Authentication**: Login with email/password
- **Real-time Chat**: WebSocket-based live messaging with fallback to REST API
- **Conversation Management**: View and manage customer conversations
- **Mobile Optimized**: Native mobile interface with intuitive navigation
- **Cross-platform**: Runs on iOS, Android, and Web

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Real-time**: WebSocket with Socket.IO client
- **Storage**: AsyncStorage for auth tokens
- **UI**: Native components with custom styling

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure API URL (optional):
   Create a `.env` file with:
   ```
   EXPO_PUBLIC_API_URL=http://your-api-server:8000
   ```

3. Start development server:
   ```bash
   npm start
   ```

## Development Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Main app screens
│   ├── LoginScreen.tsx
│   ├── ConversationsScreen.tsx
│   └── ChatScreen.tsx
├── hooks/          # Custom React hooks
│   └── useWebSocket.ts
├── utils/          # Utility functions
│   └── auth.ts
├── types/          # TypeScript type definitions
│   ├── chat.ts
│   └── user.ts
└── config/         # Configuration files
    └── api.ts
```

## Key Components

### Authentication
- Secure token storage with AsyncStorage
- Automatic session management
- Login/logout functionality

### Real-time Messaging
- WebSocket connection with auto-reconnect
- Heartbeat monitoring
- Graceful fallback to REST API
- App state handling (background/foreground)

### UI/UX
- Native mobile interface
- Pull-to-refresh conversations
- Real-time message updates
- Typing indicators
- Message status indicators

## Configuration

The app automatically detects the API server URL from environment variables or defaults to localhost. For development on physical devices, update the WebSocket URL in `src/config/api.ts` to use your computer's IP address.

## Deployment

### For Development
Use Expo Go app on your device:
1. Install Expo Go from App Store/Play Store
2. Scan QR code from `npm start`

### For Production
Build standalone apps:
```bash
npx expo build:android
npx expo build:ios
```

## API Integration

The app integrates with the same FastAPI backend as the web admin interface:
- Authentication endpoints
- Conversation management
- Message sending/receiving
- WebSocket real-time updates

## Related Apps

- **admin-web**: Next.js web interface (shares API logic)
- **backend**: FastAPI server
- **chat-widget**: TypeScript widget for websites