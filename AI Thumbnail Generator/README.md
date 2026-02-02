# AI Thumbnail Generator

## Description

AI Thumbnail Generator is a full-stack web application that empowers users to create stunning, eye-catching thumbnails for YouTube videos and other content using cutting-edge AI technology. By leveraging advanced AI models from Hugging Face, the app generates high-quality, customized images based on user-defined parameters such as title, style, color scheme, and aspect ratio.

## Features

- **User Authentication**: Secure registration and login system
- **AI-Powered Generation**: Utilizes Hugging Face models for image creation
- **Multiple Styles**: Choose from Bold & Graphics, Tech/Futuristic, Minimalist, Photorealistic, and Illustrated styles
- **Color Schemes**: Select from vibrant, sunset, forest, neon, purple, monochrome, ocean, and pastel palettes
- **Aspect Ratios**: Support for 16:9, 1:1, and 9:16 ratios
- **Text Integration**: AI-generated text directly in images for seamless thumbnails
- **Cloud Storage**: Images stored securely on Cloudinary
- **User Dashboard**: View, manage, and delete generated thumbnails
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- React Router for navigation

### Backend
- Node.js with Express.js
- TypeScript
- MongoDB with Mongoose ODM
- Cloudinary for image storage and management
- Hugging Face Inference API for AI image generation
- Google Gemini API for prompt refinement and enhancement

## Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Hugging Face account with API access token
- Cloudinary account for image storage
- Google Gemini API key

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd "AI Thumbnail Generator"
   ```

2. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Configuration**

   Create a `.env` file in the `server` directory with the following variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   HF_ACCESS_TOKEN=your_hugging_face_api_token
   GEMINI_API_KEY=your_google_gemini_api_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   SESSION_SECRET=your_random_session_secret
   ```

5. **Start the Development Servers**

   **Terminal 1 - Backend Server:**
   ```bash
   cd server
   npm run server
   ```

   **Terminal 2 - Frontend Client:**
   ```bash
   cd client
   npm run dev
   ```

6. **Access the Application**

   Open your browser and navigate to `http://localhost:5173` (Vite default port)

## Usage

1. **Registration/Login**: Create an account or sign in to access the thumbnail generator
2. **Generate Thumbnails**:
   - Navigate to the Generate page
   - Enter your video title
   - Select preferred style and color scheme
   - Choose aspect ratio (16:9 recommended for YouTube)
   - Add optional custom prompt for additional details
   - Click "Generate" to create your thumbnail
3. **Manage Thumbnails**: View all your generated thumbnails in the "My Generations" section
4. **Download/Share**: Download thumbnails or share them directly

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Thumbnails
- `POST /api/thumbnails/generate` - Generate new thumbnail
- `GET /api/thumbnails` - Retrieve user's thumbnails (with optional search)
- `GET /api/thumbnails/:id` - Get specific thumbnail details
- `DELETE /api/thumbnails/:id` - Delete a thumbnail

## Project Structure

```
AI Thumbnail Generator/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── sections/       # Section components
│   │   └── assets/         # Static assets
│   ├── public/             # Public assets
│   └── package.json
├── server/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middlewares/        # Custom middlewares
│   ├── configs/            # Configuration files
│   └── package.json
├── README.md               # Project documentation
└── package-lock.json       # Root dependencies lockfile
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `HF_ACCESS_TOKEN` | Hugging Face API token | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `SESSION_SECRET` | Random string for session encryption | Yes |

## Troubleshooting

### Common Issues

1. **Server won't start**: Check if all environment variables are set correctly
2. **Image generation fails**: Verify Hugging Face API token and internet connection
3. **Database connection error**: Ensure MongoDB is running and URI is correct
4. **Client build errors**: Run `npm install` in the client directory

### Development Tips

- Use `npm run server` for backend development with auto-restart
- Use `npm run dev` for frontend development with hot reload
- Check server logs for detailed error messages
- Ensure all API keys have sufficient credits/permissions

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- Hugging Face for providing AI model inference APIs
- Google for Gemini API
- Cloudinary for image storage solutions
- The open-source community for amazing tools and libraries
