# SMS Gateway (Semaphore, server-side)

This gateway keeps your Semaphore API key on the server and exposes:

- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `GET /health`

## Request OTP

```json
{
  "phone": "+639171234567",
  "userId": "user_123"
}
```

The gateway generates the OTP, sends it through Semaphore, and stores it in memory until it expires.

## Verify OTP

```json
{
  "userId": "user_123",
  "code": "123456"
}
```

## Setup

1. Copy `.env.example` values into your server env.
2. Set `SEMAPHORE_API_KEY` and optional `SEMAPHORE_SENDER_NAME`.
3. Start server:

```bash
node server/sms-gateway/server.mjs
```

4. In app `.env`, set:

```bash
EXPO_PUBLIC_SMS_GATEWAY_URL=http://localhost:4000/auth/request-otp
```

For physical devices, replace `localhost` with your PC LAN IP.

## Render deployment

This repo includes `render.yaml`. In Render, create a Blueprint from the GitHub repo, then set:

```bash
SEMAPHORE_API_KEY=your_server_only_semaphore_key
```

After Render creates the service, set the app variable to your public HTTPS endpoint:

```bash
EXPO_PUBLIC_SMS_GATEWAY_URL=https://your-render-service.onrender.com/auth/request-otp
```

For a production auth system, move OTP sessions from memory to Redis/Postgres so pending OTPs survive server restarts.
