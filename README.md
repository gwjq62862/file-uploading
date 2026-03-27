# File Uploading App (Next.js 16 + S3-Compatible Storage)

A full-stack file uploader built with **Next.js App Router** that:

- Generates **presigned upload URLs** server-side
- Uploads files directly from browser to S3-compatible object storage
- Tracks upload progress per file
- Shows image/video previews before upload
- Deletes uploaded files from storage
- Includes a sample video listing endpoint/page

This project uses:

- Next.js `16.2.1` (App Router)
- React `19.2.4`
- AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- `react-dropzone` for drag-and-drop uploads
- `zod` for request validation

## Features

- Multi-file drag-and-drop upload UI
- Client-side previews (image/video)
- Per-file upload progress (XHR progress events)
- File status indicators (`uploading`, `success`, `error`)
- Delete API for uploaded files
- Simple `/video` page consuming `/api/videos`

## Tech Stack

- **Frontend:** Next.js App Router + React + Tailwind CSS
- **Backend APIs:** Next.js Route Handlers (`app/api/.../route.ts`)
- **Storage:** S3-compatible object storage (configured via endpoint + credentials)
- **Validation:** Zod

## Project Structure

```text
app/
  api/
    s3/
      route.ts             # POST: generate presigned upload URL
      delete/route.ts      # DELETE: remove object by key
    videos/
      route.ts             # GET: sample video list endpoint
  video/
    page.tsx               # Client page that renders videos from /api/videos
  page.tsx                 # Home page with upload UI
  layout.tsx
  globals.css

component/
  Uploader.tsx             # Main upload component (dropzone + progress + delete)
  CustomToast.tsx          # Toast UI for errors

lib/
  s3client.ts              # S3 client setup
```

## How Upload Works

1. User drops files in `Uploader.tsx`.
2. Client sends `POST /api/s3` with `fileName`, `contentType`, and `size`.
3. Server validates payload using Zod.
4. Server creates a unique object key and generates a presigned `PUT` URL.
5. Client uploads file directly to storage using XHR `PUT`.
6. Client updates progress and marks file as uploaded on success.
7. Optional: user can delete uploaded file via `DELETE /api/s3/delete`.

## API Reference

### `POST /api/s3`
Generate a presigned URL for direct upload.

Request body:

```json
{
  "fileName": "example.png",
  "contentType": "image/png",
  "size": 12345
}
```

Success response (`200`):

```json
{
  "presignedUrl": "https://...",
  "uniqueKey": "uuid-example.png",
  "fileUrl": "https://.../uuid-example.png"
}
```

Error responses:

- `400` invalid payload
- `500` internal error

### `DELETE /api/s3/delete`
Delete object by key.

Request body:

```json
{
  "key": "uuid-example.png"
}
```

Expected response:

```json
{
  "message": "file deleted successfully",
  "status": 200
}
```

### `GET /api/videos`
Returns a static sample list of videos.

## Environment Variables

Create `.env.local` (recommended for local development) with:

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_ENDPOINT_URL_S3=https://your-s3-endpoint
AWS_REGION=auto
AWS_BUCKET_NAME=your_bucket_name
```

Notes:

- `AWS_ENDPOINT_URL_S3` must be your S3-compatible endpoint.
- `AWS_BUCKET_NAME` must already exist.
- `fileUrl` generation in `app/api/s3/route.ts` currently assumes `https://t3.storage.dev/<bucket>/<key>` format. Update this if your provider uses a different public URL pattern.

## Local Development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Open:

- Home upload page: `http://localhost:3000`
- Video page: `http://localhost:3000/video`

## Build & Run Production

```bash
npm run build
npm run start
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## File Type and Size Rules

Current dropzone config in `component/Uploader.tsx`:

- Max files: `5`
- Accepted mime groups:
  - `image/*` (`.png`, `.jpg`, `.jpeg`)
  - `video/*` (`.mp4`, `.webm`, `.mov`)
- Max size (current code): `500MB`

Important:

- The UI helper text says `PNG, JPG up to 10MB`, but code allows larger files and videos. Update either UI text or config to keep behavior consistent.

## Security Notes

- Never commit real credentials to git.
- Use `.env.local` for secrets in local development.
- Rotate keys immediately if they were exposed.
- Restrict key permissions to the minimum required bucket actions.

## Troubleshooting

### Upload fails before starting

- Check `.env.local` exists and variables are set.
- Verify storage endpoint and bucket name.
- Ensure `/api/s3` returns `200` with `presignedUrl`.

### Upload starts but fails mid-way

- Check browser network tab for failed `PUT` request.
- Verify presigned URL expiry window (`expiresIn` in `route.ts`).
- Confirm request `Content-Type` matches the signed request assumptions.

### Delete fails

- Ensure upload response key is stored in local state.
- Verify bucket permission includes `DeleteObject`.

### Uploaded URL does not open

- Bucket/object may not be publicly readable.
- `fileUrl` host pattern may not match your provider.

## Known Improvement Opportunities

- Move provider-specific URL building to config/env.
- Add server-side file type/size enforcement beyond client checks.
- Persist uploaded objects in DB instead of in-memory UI state.
- Replace static `/api/videos` data with bucket listing or DB data.
- Add retry/cancel support for large uploads.

## Version Notes

This project uses **Next.js 16 App Router** conventions (`app/` + Route Handlers). If you upgrade Next.js, verify route handler behavior and deployment/runtime compatibility.

---

If you want, I can also add:

1. A `.env.example` file (safe placeholders)
2. API request/response examples as cURL snippets
3. A short deployment section for Vercel or your own server