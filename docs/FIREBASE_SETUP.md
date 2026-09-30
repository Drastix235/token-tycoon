# ☁️ Firebase setup

Google sign-in, cloud saves and the leaderboard run on [Firebase](https://firebase.google.com/) (free *Spark* plan).
Without this setup the game still works: progress is simply saved in the browser only.

## 1. Create the project

1. Go to the [Firebase console](https://console.firebase.google.com/) and click **Create a project**.
2. Name it (for example `token-tycoon`). Google Analytics is not needed.

## 2. Register the web app

1. On the project home page, click the **Web** icon (`</>`).
2. Name the app `Token Tycoon` (no need for Firebase Hosting) and click **Register app**.
3. Copy the `firebaseConfig` values into [`js/firebase-config.js`](../js/firebase-config.js):

```js
export const firebaseConfig = {
  apiKey: '...',
  authDomain: '...firebaseapp.com',
  projectId: '...',
  appId: '...',
};
```

> These values are not secrets. They only identify the project; the data is protected by the security rules.

## 3. Enable Google sign-in

1. **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Google** → enable it, pick a support email, **Save**.
3. **Settings** tab → **Authorized domains** → **Add domain** → `drastix235.github.io`.
   (`localhost` is already allowed for local testing.)

## 4. Create the database

1. **Build → Firestore Database → Create database**.
2. Pick a location close to your players (for example `europe-west`), then **Start in production mode**.
3. **Rules** tab → replace everything with the contents of [`firestore.rules`](../firestore.rules) → **Publish**.

## 5. Done

Commit and push `js/firebase-config.js`. After GitHub Pages redeploys, the **Profile** tab shows the *Sign in with Google* button and the **Leaderboard** tab fills up as players sign in.

## Data model

| Collection | Document | Contents | Access |
|---|---|---|---|
| `saves` | player uid | Full game state (JSON string), total earnings, timestamp | Owner only |
| `leaderboard` | player uid | Lab name, total earnings, best model, timestamp | Public read, owner write |

The game runs entirely in the browser, so a determined player could still submit a fake score. The rules limit what can be written, but cannot fully prevent cheating without a server.
