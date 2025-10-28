# Google Cloud Vision OCR Setup

## What it does:
- Automatically detects image-based/scanned PDFs (< 100 characters extracted)
- Uses Google Cloud Vision OCR to extract text from images
- Seamlessly integrates with existing document processing

## Setup Instructions:

### 1. Enable Google Cloud Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create one)
3. Go to **APIs & Services** > **Enable APIs and Services**
4. Search for **"Cloud Vision API"**
5. Click **Enable**

### 2. Create Service Account Credentials

**Option A: Using Service Account JSON (Recommended for development)**

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Name it (e.g., "document-ocr")
4. Click **Create and Continue**
5. Grant role: **Cloud Vision API User**
6. Click **Done**
7. Click on the service account you just created
8. Go to **Keys** tab
9. Click **Add Key** > **Create new key** > **JSON**
10. Download the JSON file
11. Save it to your project (e.g., `google-credentials.json`)
12. Add to `.env.local`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
   ```

**Option B: Using API Key (Simpler but less secure)**

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the API key
4. Add to `.env.local`:
   ```
   GOOGLE_CLOUD_API_KEY=your_api_key_here
   ```

### 3. Restart the Dev Server

```bash
pnpm dev
```

## How it works:

1. **First attempt**: Uses `pdf-parse` to extract text
2. **If < 100 characters extracted**: Automatically tries OCR
3. **Uses best result**: Chooses the extraction with more text

## Testing:

Upload a scanned/image-based PDF and watch the logs:
```
⚠️  Only 48 characters extracted, trying OCR...
🔍 OCR extracted 15234 characters
✅ OCR found more text (15234 vs 48 characters)
📄 Extracted 15234 characters from pdf
✂️  Split into 16 chunks
```

## Costs:

Google Cloud Vision is **NOT free** but very affordable:
- First 1,000 pages/month: **FREE**
- After that: **$1.50 per 1,000 pages**

For typical usage (a few hundred documents), it should stay in the free tier.

## Note:

If credentials are not configured, OCR will be skipped and documents will process with whatever text pdf-parse extracted (possibly 0 chunks).
