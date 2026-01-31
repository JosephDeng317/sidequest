# Sidequest

App to let you go on sidequests and post about it. React Native + Expo with Firebase auth and posts (title, caption, photo).

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Firebase**

   - Create a project at [Firebase Console](https://console.firebase.google.com).
   - Enable **Authentication** → Sign-in method → **Email/Password**.
   - Create a **Firestore Database** (start in test mode for dev).
   - Create a **Storage** bucket (use default rules for dev).
   - Add a **Web app**, copy the config, then copy `.env.example` to `.env` and fill in:

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   ```

3. **Assets (optional)**

   If you see missing asset errors, add `assets/icon.png` (1024×1024) and `assets/splash.png`. You can generate them with [Expo’s asset tool](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/) or copy from a new Expo app: `npx create-expo-app@latest temp --template blank`, then copy `temp/assets/*` into `assets/`.

4. **Run**

   ```bash
   npx expo start
   ```

   Then scan the QR code with Expo Go (Android) or the Camera app (iOS).

## Features

- **Auth**: Email/password sign up and log in via Firebase Auth.
- **Posts**: After logging in, create a post with:
  - Title (required)
  - Caption (optional)
  - Photo (optional, from library)
- **Feed**: Home screen shows your posts and others’ in reverse chronological order.

## Firestore rules (example)

For development you can use test mode. For production, lock down like this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Storage rules (example)

Allow authenticated users to upload under their `userId`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
