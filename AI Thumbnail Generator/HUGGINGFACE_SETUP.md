# Hugging Face FLUX.1 Integration - Quick Start Guide

## ✅ Changes Implemented

### Backend (Server)
- [x] Updated `ThumbnailController.ts` to use two-step generation pipeline
  - Step 1: Gemini 2.5 Flash for prompt refinement
  - Step 2: Hugging Face FLUX.1-schnell for image generation
- [x] Removed Gemini image-specific parameters and config
- [x] Added HF API fetch integration with error handling
- [x] Maintained Cloudinary for image persistence
- [x] Created `.env.example` template for configuration reference

### Frontend (Client)
- [x] Implemented `handleGenerate()` function in Generate.tsx
- [x] Added validation for required fields (title)
- [x] Added proper loading state management
- [x] Error handling and user feedback
- [x] PreviewPanel component compatible (no changes needed)

### Configuration
- [x] Added `HF_ACCESS_TOKEN` to environment variables
- [x] Verified all required env variables are present in `.env`

## 🚀 To Get Started

### 1. Obtain Hugging Face API Token
```
1. Visit: https://huggingface.co/settings/tokens
2. Create new token with "read" access
3. Copy token and add to .env file:
   HF_ACCESS_TOKEN=hf_xxxxxxxxxxxxx
```

### 2. Test the Integration
```bash
# Start backend server
cd server
npm run server

# In another terminal, start frontend
cd client
npm run dev
```

### 3. Generate a Thumbnail
1. Navigate to Generate page
2. Enter a title (required)
3. Select style, aspect ratio, color scheme
4. Add optional additional details
5. Click "Generate Thumbnail"
6. Wait 20-60 seconds for generation and upload

## 📋 What's New

### Generation Pipeline
```
User Input
   ↓
Gemini 2.5 Flash (refines prompt)
   ↓
Hugging Face FLUX.1-schnell (generates image)
   ↓
Image uploaded to Cloudinary
   ↓
Frontend displays with download option
```

### Key Advantages
- ✅ No quota restrictions (FLUX.1 has generous free tier)
- ✅ Better quality with Gemini-refined prompts
- ✅ Persistent image storage via Cloudinary
- ✅ Production-ready error handling
- ✅ No breaking changes to database schema

## 🔍 Troubleshooting

### Error: "HF API error: 429"
- HF API is rate limited. Wait and retry in a few seconds.
- Ensure HF_ACCESS_TOKEN is valid at https://huggingface.co/settings/tokens

### Error: "HF API error: 400"
- The refined prompt might be invalid for FLUX.1
- Check server console for the actual refined prompt used

### Blank Image Displayed
- Ensure Cloudinary URL is set correctly in `.env`
- Check if image successfully uploaded to Cloudinary dashboard

### Generation Timeout (>2 minutes)
- FLUX.1 model might be loading (cold start can take 30+ seconds)
- Retry after model loads
- Check HF API status: https://status.huggingface.co

## 📝 Files Modified

- `server/controllers/ThumbnailController.ts` - Core generation logic
- `client/src/pages/Generate.tsx` - Frontend API integration
- `server/.env.example` - Configuration template (new)
- `REFACTORING_SUMMARY.md` - Detailed documentation (new)

## 🧪 Testing Commands

```bash
# Check if HF token is working
curl -X POST "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell" \
  -H "Authorization: Bearer YOUR_HF_TOKEN" \
  -d '{"inputs":"test prompt"}'

# Check if Gemini API is working
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_GEMINI_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

## 📚 References

- [Hugging Face Inference API](https://huggingface.co/docs/hub/security-inference-api)
- [FLUX.1 Model Card](https://huggingface.co/black-forest-labs/FLUX.1-schnell)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Cloudinary Upload Reference](https://cloudinary.com/documentation/upload_images)

---

**Version:** 1.0 | **Date:** January 30, 2026 | **Status:** Ready for Testing
