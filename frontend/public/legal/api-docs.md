# LuxScaler API Documentation

**Version:** 3.4 (Beta)  
**Base URL:** `https://api.luxscaler.com/v1`

---

## 1. Authentication

All API requests must be authenticated using a **Bearer Token** in the header.

`Authorization: Bearer <YOUR_API_KEY>`

### Get your API Key

You can generate your API keys in the [Admin Dashboard](/admin). Keep your keys secure.

---

## 2. Endpoints

### 2.1 Image Processing

### POST /process/image

Uploads and processes an image for upscaling.

**Parameters:**

- `image`: Binary file (JPEG, PNG)
- `scale`: Target scale (2x, 4x, 8x)
- `mode`: 'balanced' | 'fidelity' | 'creative'
- `prompt`: (Optional) Text guidance for the AI

**Response:**

```json
{
  "id": "gen_123456789",
  "status": "processing",
  "eta_seconds": 45
}
```

### 2.2 Check Status

### GET /process/{id}

Returns the status and result URL of a processing job.

**Response:**

```json
{
  "id": "gen_123456789",
  "status": "completed",
  "output_url": "https://cdn.luxscaler.com/results/gen_123456789_4k.png"
}
```

---

## 3. Webhooks

You can configure webhooks to receive real-time notifications when your jobs are completed.

### Event: job.completed

```json
{
  "event": "job.completed",
  "job_id": "gen_123456789",
  "timestamp": "2026-01-12T10:00:00Z"
}
```

---

## 4. Rate Limits

- **Free Tier:** 10 requests / minute
- **Pro Tier:** 100 requests / minute
- **Enterprise:** Custom limits

For higher limits, contact <enterprise@luxscaler.com>
