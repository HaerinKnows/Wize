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
