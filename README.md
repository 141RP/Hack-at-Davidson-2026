# WanderSwipe

Tinder-style group travel planning app. Swipe on destinations with friends to find the perfect trip.

## Setup

**Prerequisites:** Node.js 20+

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project
2. **Enable Google Auth:** Go to Authentication > Sign-in method > Google > Enable
3. **Create Firestore:** Go to Firestore Database > Create database > Start in **test mode**
4. **Register a Web App:** Go to Project Settings > General > Add app (Web) and copy the config
5. **Add authorized domain:** Go to Authentication > Settings > Authorized domains > Add your computer's local IP (e.g. `10.52.21.25`)

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your Firebase config values:

```bash
cp .env.example .env
```

### 4. Start dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`. To access from your phone, use the Network URL printed in the terminal.

## Tech Stack

- React 19 + Vite
- Tailwind CSS v4
- React Router v7
- Firebase Auth (Google OAuth) + Firestore (real-time database)
