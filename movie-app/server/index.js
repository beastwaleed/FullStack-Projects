const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. More Flexible CORS (Essential for Vercel)
app.use(cors({
    origin: "https://playpulsemovies.vercel.app", // No trailing slash
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// Manually handle the OPTIONS preflight request
app.options('*', cors());

app.use(express.json());

// 2. Health Check Route (To verify backend is alive)
app.get("/", (req, res) => {
    res.status(200).send("Backend is running!");
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