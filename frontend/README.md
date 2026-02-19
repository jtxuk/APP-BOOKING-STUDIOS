# Booking App Frontend

React Native + Expo application for studio booking system.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your backend URL:
```
API_URL=http://localhost:5000/api
```

Note: For iOS device testing, use your machine's IP address instead of localhost:
```
API_URL=http://192.168.x.x:5000/api
```

## Running the App

### Web (for testing)
```bash
npm start
# Then press 'w' in the terminal
```

### iOS
```bash
npm run ios
```
Requires Xcode and iOS simulator

### Android
```bash
npm run android
```
Requires Android Studio and Android emulator

### Expo Go (Mobile devices)
```bash
npm start
# Scan QR code with Expo Go app (available on iOS/Android app stores)
```

## Project Structure

```
frontend/
├── App.js                 # Main app component with navigation
├── screens/              
│   ├── LoginScreen.js     # User authentication
│   ├── StudioListScreen.js # List of available studios
│   ├── CalendarScreen.js   # Calendar and time slot selection
│   ├── MyBookingsScreen.js # User's bookings management
│   └── ProfileScreen.js    # User profile
├── services/
│   └── api.js            # API calls and axios configuration
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── README.md

## Features

- **Login**: Restricted access with JWT authentication
- **Studios**: Browse 6 available recording studios
- **Booking**: Select dates and time slots (4 slots of 3 hours each)
- **Calendar**: Interactive calendar for date selection
- **My Bookings**: View and cancel reservations
- **Profile**: View user info and logout

## Constraints

- Maximum 2 bookings per user
- Cannot book consecutive slots in the same studio
- Each slot is 3 hours long
- Studio availability: 08:00 - 20:00
- Users identified by 3-letter initials

## Notes

- Backend must be running on `http://localhost:5000`
- User registration is done in the backend only
- No payments processing in this version
