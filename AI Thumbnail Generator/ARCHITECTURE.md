# Architecture Diagram: Hybrid AI Thumbnail Generation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Generate.tsx                                             │   │
│  │  - Title input (required)                                 │   │
│  │  - Style selector (5 styles)                             │   │
│  │  - Aspect ratio (3 ratios)                               │   │
│  │  - Color scheme (8 colors)                               │   │
│  │  - Additional prompt (optional)                          │   │
│  │                                                           │   │
│  │  [Generate Button] → handleGenerate()                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PreviewPanel.tsx                                         │   │
│  │  - Shows loading state                                    │   │
│  │  - Displays generated image from image_url              │   │
│  │  - Download button (opens image in new tab)             │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                            ↕ (HTTP)
        POST /api/thumbnails/generate (JSON)
                            ↕
┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js/Express)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ThumbnailController.generateThumbnail()                  │   │
│  │                                                           │   │
│  │  1️⃣  Input Processing                                    │   │
│  │      - Extract: title, style, color_scheme,              │   │
│  │        aspect_ratio, prompt, text_overlay               │   │
│  │      - Create Thumbnail record in DB (isGenerating:true)│   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  2️⃣  Prompt Refinement (Gemini 2.5 Flash)               │   │
│  │      Build Initial Prompt:                                │   │
│  │      - Add style descriptor                               │   │
│  │      - Add color scheme description                       │   │
│  │      - Add user's additional prompt                       │   │
│  │      - Add aspect ratio and CTR directive                │   │
│  │                                                           │   │
│  │      Send to Gemini:                                      │   │
│  │      "Refine this into FLUX.1-optimized prompt"          │   │
│  │                                                           │   │
│  │      Receive: Refined, detailed prompt                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  3️⃣  Image Generation (Hugging Face FLUX.1-schnell)      │   │
│  │      Send refined prompt to HF Inference API:            │   │
│  │      POST /models/black-forest-labs/FLUX.1-schnell      │   │
│  │      Headers: Authorization: Bearer HF_ACCESS_TOKEN      │   │
│  │      Body: { inputs: refinedPrompt }                     │   │
│  │                                                           │   │
│  │      Receive: Image buffer (PNG)                          │   │
│  │      Convert: Buffer → File (save to /images)            │   │
│  │                                                           │   │
│  │      Time: ~15-45 seconds (depends on HF queue)          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  4️⃣  Image Upload (Cloudinary)                           │   │
│  │      cloudinary.uploader.upload(filePath)                │   │
│  │      ↓                                                    │   │
│  │      Receive: { url: "https://..." }                     │   │
│  │      Time: ~2-5 seconds                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  5️⃣  Database Update                                    │   │
│  │      Update Thumbnail:                                    │   │
│  │      - image_url = cloudinary_url                        │   │
│  │      - isGenerating = false                              │   │
│  │      - Save to MongoDB                                    │   │
│  │                                                           │   │
│  │      Delete temp image from /images                      │   │
│  │      Return: { message, thumbnail }                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
└──────────────────────────────────────────────────────────────────┘
                            ↕ (HTTP)
            Response: { thumbnail: { image_url } }
                            ↕
┌──────────────────────────────────────────────────────────────────┐
│                     Frontend Updates PreviewPanel                 │
│  - Stop showing loader                                            │
│  - Display generated image from thumbnail.image_url             │
│  - Enable download button                                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## External API Integration

```
┌─────────────────────────────────────────┐
│     Your Application                     │
├─────────────────────────────────────────┤
│                                         │
│  Uses: GEMINI_API_KEY                   │
│  Service: Google Generative AI           │
│  Model: gemini-2.5-flash (text-only)    │
│  Task: Prompt Refinement                │
│                                         │
└────────────┬────────────────────────────┘
             │
             ↓
   ┌─────────────────────┐
   │ Google GenAI API    │
   │ (Prompt refinement) │
   └─────────────────────┘


┌─────────────────────────────────────────┐
│     Your Application                     │
├─────────────────────────────────────────┤
│                                         │
│  Uses: HF_ACCESS_TOKEN                   │
│  Service: Hugging Face Inference API     │
│  Model: black-forest-labs/FLUX.1-schnell│
│  Task: Image Generation                 │
│                                         │
└────────────┬────────────────────────────┘
             │
             ↓
   ┌──────────────────────────┐
   │ Hugging Face API         │
   │ (Image generation)       │
   │ Returns: PNG image       │
   └──────────────────────────┘


┌─────────────────────────────────────────┐
│     Your Application                     │
├─────────────────────────────────────────┤
│                                         │
│  Uses: CLOUDINARY_URL                    │
│  Service: Cloudinary Upload API          │
│  Task: Image Hosting                    │
│  Returns: CDN URL                       │
│                                         │
└────────────┬────────────────────────────┘
             │
             ↓
   ┌──────────────────────────┐
   │ Cloudinary               │
   │ (Persistent storage)     │
   │ Returns: CDN URL         │
   └──────────────────────────┘


┌─────────────────────────────────────────┐
│     Your Application                     │
├─────────────────────────────────────────┤
│                                         │
│  Uses: MONGODB_URI                       │
│  Service: MongoDB                        │
│  Task: Store thumbnail metadata          │
│                                         │
└────────────┬────────────────────────────┘
             │
             ↓
   ┌──────────────────────────┐
   │ MongoDB                  │
   │ (Thumbnail database)     │
   └──────────────────────────┘
```

---

## Data Flow Example

```
INPUT:
{
  title: "10 Tips for Better Sleep",
  style: "Bold & Graphics",
  color_scheme: "sunset",
  aspect_ratio: "16:9",
  prompt: "Include clock and bed"
}

STEP 1 - Build Initial Prompt:
"Create a eye-catching thumbnail, bold typography, vibrant colors...
for: 10 Tips for Better Sleep. Use a warm sunset tones, orange pink...
color scheme. Additional Details: Include clock and bed.
The thumbnail should be 16:9, visually stunning..."

STEP 2 - Gemini Refines to:
"A striking 16:9 thumbnail featuring a cozy bedroom at sunset with
an alarm clock on a nightstand. Bold, modern typography overlaid...
warm orange-to-pink gradient background with soft glowing light..."

STEP 3 - FLUX.1 Generates: [IMAGE BUFFER]

STEP 4 - Cloudinary Uploads: 
https://res.cloudinary.com/dg46t4sxa/image/upload/...

STEP 5 - Database Stores:
{
  _id: "...",
  userId: "...",
  title: "10 Tips for Better Sleep",
  image_url: "https://res.cloudinary.com/...",
  prompt_used: "Include clock and bed",
  style: "Bold & Graphics",
  color_scheme: "sunset",
  aspect_ratio: "16:9",
  isGenerating: false,
  createdAt: "2026-01-30T..."
}

OUTPUT TO FRONTEND:
{
  thumbnail: { image_url: "https://...", ...other fields }
}

FRONTEND DISPLAYS:
<img src="https://res.cloudinary.com/..." alt="10 Tips for Better Sleep" />
```

---

## Timing Breakdown

```
Request → Processing
├─ 1-2s: Gemini prompt refinement
├─ 15-45s: FLUX.1 image generation (varies)
├─ 2-5s: Cloudinary upload
├─ <1s: Database save
└─ <1s: Response to client

TOTAL: 20-60 seconds per generation
```

---

## Error Handling Flow

```
                    generateThumbnail()
                          ↓
                    ┌─────────────┐
                    │ Try Block   │
                    └──────┬──────┘
                           ↓
                ┌─────────────────────┐
                │ Input Validation    │
                │ & DB Create         │
                └──────┬──────────────┘
                       ↓
            ┌────────────────────────┐
            │ Gemini Refinement      │ ← Can fail (invalid key, quota)
            └──────┬─────────────────┘
                   ↓
         ┌──────────────────────────┐
         │ HF Image Generation      │ ← Can fail (429, 400, timeout)
         └──────┬───────────────────┘
                ↓
      ┌──────────────────────────┐
      │ Cloudinary Upload        │ ← Can fail (upload error)
      └──────┬───────────────────┘
             ↓
       ┌─────────────────┐
       │ DB Update       │ ← Can fail (DB error)
       └────────┬────────┘
                ↓
           Success ✅
                │
                └─→ res.json({ thumbnail })
                │
                └─→ Catch Block (any error)
                    │
                    └─→ res.status(500)
                        .json({ message: error })
```

---

## Key Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React + TypeScript | User interface |
| **Backend** | Node.js + Express | API server |
| **Prompt Refinement** | Google Gemini 2.5 Flash | Enhance prompts |
| **Image Generation** | Hugging Face FLUX.1-schnell | Generate images |
| **Image Hosting** | Cloudinary | Persistent CDN storage |
| **Database** | MongoDB | Store thumbnail metadata |
| **Authentication** | Express Session | User sessions |

---

This architecture ensures reliability, scalability, and high-quality thumbnail generation!
