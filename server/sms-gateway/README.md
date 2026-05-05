# Wizenance Backend

This backend keeps email OTP secrets on the server and exposes:

- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `POST /auth/register`
- `POST /auth/login`
- `GET /sync/:userId`
- `PUT /sync/:userId`
- `GET /health`

## Register

```json
{
  "name": "Martin",
  "email": "user@example.com",
  "password": "Wizenance123!",
  "phone": "+639171234567"
}
```

The backend stores the user in Firestore and returns a stable `userId`.

## Login

```json
{
  "email": "user@example.com",
  "password": "Wizenance123!"
}
```

Login returns the same `userId`, which lets the app pull the same cloud sync snapshot after reinstalling.

## Request OTP

```json
{
  "email": "user@example.com",
  "userId": "user_123"
}
```

The gateway generates the OTP, sends it through Resend, and stores it in memory until it expires.

## Verify OTP

```json
{
  "userId": "user_123",
  "code": "123456"
}
```

## Setup

1. Copy `.env.example` values into your server env.
2. Set `RESEND_API_KEY`.
3. Start server:

```bash
node server/sms-gateway/server.mjs
```

4. In app `.env`, set:

```bash
EXPO_PUBLIC_SMS_GATEWAY_URL=http://localhost:4000/auth/request-otp
EXPO_PUBLIC_API_URL=http://localhost:4000
```

For physical devices, replace `localhost` with your PC LAN IP.

## Sync

Each app user gets a separate backend snapshot, keyed by `userId`.

Pull a user's cloud copy:

```bash
GET /sync/user_123
```

Push the latest app snapshot:

```bash
PUT /sync/user_123
```

```json
{
  "userId": "user_123",
  "accounts": [],
  "transactions": [],
  "budgets": [],
  "lastSyncAt": "2026-03-03T00:00:00.000Z"
}
```

By default, snapshots are written to `server/sms-gateway/data/sync`. Set `SYNC_DATA_DIR` to change that location.

For production, configure Firebase Firestore. When Firebase env vars are present, sync uses Firestore instead of files:

```bash
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIRESTORE_SYNC_COLLECTION=userSyncSnapshots
FIRESTORE_USERS_COLLECTION=authUsers
FIRESTORE_EMAIL_INDEX_COLLECTION=authEmailIndex
```

You can also set `FIREBASE_SERVICE_ACCOUNT_JSON` to the full service account JSON instead of separate Firebase values. Keep these values on the backend only.

## Render deployment

This repo includes `render.yaml`. In Render, create a Blueprint from the GitHub repo, then set:

```bash
RESEND_API_KEY=your_server_only_resend_key
```

After Render creates the service, set the app variable to your public HTTPS endpoint:

```bash
EXPO_PUBLIC_SMS_GATEWAY_URL=https://your-render-service.onrender.com/auth/request-otp
EXPO_PUBLIC_API_URL=https://your-render-service.onrender.com
```

For a production auth and finance system, keep OTP sessions in Redis or another managed store so pending OTPs survive restarts. Sync snapshots can live in Firestore with the Firebase variables above.
