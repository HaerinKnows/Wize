# SMS OTP Setup (Server-side only)

Wizenance now sends OTP through a backend gateway only.

Client app variable:

`EXPO_PUBLIC_SMS_GATEWAY_URL=https://your-api.example.com/auth/request-otp`

## Why

- API keys in `EXPO_PUBLIC_*` are exposed to the client bundle.
- SMS provider secrets (Semaphore/Twilio) must stay on your server.

## Client request format

The app sends:

```json
{
  "phone": "+15551234567",
  "userId": "user_123"
}
```

The backend generates the OTP, sends it through Semaphore, and returns HTTP `200` for success.

The app verifies with:

```json
{
  "userId": "user_123",
  "code": "123456"
}
```

## Included sample gateway

See:

- `server/sms-gateway/server.mjs`
- `server/sms-gateway/.env.example`
- `server/sms-gateway/README.md`

This sample uses Semaphore server-side and keeps `SEMAPHORE_API_KEY` out of the app.

For local phone testing, put your PC LAN URL in the app `.env`:

```env
EXPO_PUBLIC_SMS_GATEWAY_URL=http://YOUR_PC_LAN_IP:4000/auth/request-otp
```

Then put your server-only Semaphore key in `server/sms-gateway/.env`:

```env
SEMAPHORE_API_KEY=your_rotated_server_only_key
SEMAPHORE_SENDER_NAME=WIZENANCE
PORT=4000
```

Start the gateway with:

```powershell
npm run start:sms-gateway
```

## Public deployment

This repo includes a `render.yaml` blueprint for Render. Deploy it from the GitHub repo, set the `SEMAPHORE_API_KEY` environment variable in Render, then put the public endpoint into the app:

```env
EXPO_PUBLIC_SMS_GATEWAY_URL=https://your-render-service.onrender.com/auth/request-otp
```

After changing the app URL, publish an OTA update or rebuild the APK.

The sample gateway stores pending OTPs in memory. For a larger production launch, move OTP sessions to Redis/Postgres so OTPs survive server restarts and scale across instances.

## Dev fallback

If `EXPO_PUBLIC_SMS_GATEWAY_URL` is empty, app falls back to `Dev OTP` preview in 2FA.
