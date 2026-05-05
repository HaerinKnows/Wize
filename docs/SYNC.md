# Cloud Sync (Optional)

Wizenance stores data locally by default (`AsyncStorage`), so emulator and physical devices do not share records automatically.

To enable cross-device sync for the same account, set:

```env
EXPO_PUBLIC_API_URL=https://your-domain.example.com
```

The app will call:

- `GET /sync/:userId` to pull latest snapshot
- `PUT /sync/:userId` to push latest snapshot

Expected JSON shape:

```json
{
  "userId": "user_123",
  "accounts": [],
  "transactions": [],
  "budgets": [],
  "lastSyncAt": "2026-03-03T00:00:00.000Z"
}
```

If the endpoint is not reachable, the app falls back to local-only sync and shows a status message.

The included Node backend now supports these endpoints. It stores one snapshot per app `userId`, so every registered account can have separate accounts, transactions, and budgets on the backend.

For local testing:

```bash
npm run start:sms-gateway
```

Then set:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4000
EXPO_PUBLIC_SMS_GATEWAY_URL=http://YOUR_LAN_IP:4000/auth/request-otp
```

`localhost` only works from web or the same machine. On a phone or emulator, use your computer's LAN IP or a deployed HTTPS URL.

## Firebase Firestore

For production, configure Firebase Firestore on the backend. When these variables are present, the backend stores snapshots in Firestore instead of local files:

```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIRESTORE_SYNC_COLLECTION=userSyncSnapshots
```

You can also set `FIREBASE_SERVICE_ACCOUNT_JSON` to the full service account JSON instead of the three separate Firebase variables.

Firebase setup:

1. Create a Firebase project.
2. Enable Firestore Database in production mode.
3. In Firebase Console, open Project settings > Service accounts.
4. Generate a new private key.
5. Put the service account values in your backend environment, not in the mobile app.

Local file storage remains available when Firebase variables are missing. It is useful for testing, but not for real finance data because free hosting filesystems may reset during deploys or restarts.
