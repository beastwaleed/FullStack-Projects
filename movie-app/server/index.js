const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. CORS: allow local dev and deployed client domains so the frontend can call the API
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'https://full-stack-projects-tau.vercel.app',
    'https://playpulsemovies.vercel.app'
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        // allow requests with no origin (like curl, mobile apps, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        // reject other origins in production
        return callback(new Error('CORS policy: Origin not allowed'), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// 2. Health Check Route (To verify backend is alive)
app.get("/", (req, res) => {
    res.status(200).json({ message: "Backend is running!", mongo: mongoose.connection.readyState });
});

// 2b. Health check for favorites API
app.get("/api/health", (req, res) => {
    res.status(200).json({ message: "API is ready" });
});

// 3. Import and Use Routes
const movieRoutes = require('./routes/movies');
app.use('/api/favorites', movieRoutes);

// 4. Optimized MongoDB Connection for Serverless
// We remove app.listen because Vercel handles the port
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
    }
};

// Connect to DB on every request (standard for Vercel)
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

module.exports = app;