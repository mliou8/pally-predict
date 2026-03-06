# Pally Predict Mobile

React Native mobile app for Pally Predict, built with Expo and Solana Mobile Stack for Android/Solana Seeker.

## Features

- Daily prediction questions
- Wager points system
- Solana wallet integration (Mobile Wallet Adapter)
- Leaderboard with time periods
- Twitter authentication

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (for emulator)
- Solana Mobile Stack compatible wallet (Phantom, Solflare, etc.)

## Setup

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Start development server:
```bash
npm start
```

3. Run on Android:
```bash
npm run android
```

## Building for Production

### Preview APK (for testing):
```bash
npm run build:android:preview
```

### Production Build:
```bash
npm run build:android
```

## Solana Mobile Stack

This app integrates with Solana Mobile Wallet Adapter for:
- Wallet connection
- Transaction signing
- Message signing

Compatible with Solana Seeker and any MWA-compatible wallet.

## API

The app connects to the same backend as the web version. Configure the API URL in `src/constants/api.ts`.

For local development with Android emulator, use `http://10.0.2.2:5000` (maps to localhost).

## Project Structure

```
mobile/
├── App.tsx                 # Entry point
├── src/
│   ├── components/         # Reusable UI components
│   ├── constants/          # Colors, API config
│   ├── contexts/           # Auth, Wallet contexts
│   ├── hooks/              # Custom hooks
│   ├── navigation/         # React Navigation setup
│   ├── screens/            # Screen components
│   ├── services/           # API services
│   └── types/              # TypeScript types
└── assets/                 # Images, fonts
```
