const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
const CLIENT_URLS = (process.env.CLIENT_URLS || "http://localhost:5173").split(',');
app.use(cors({
    origin: CLIENT_URLS,
    methods: ["GET", "POST", "DELETE"]
}));
app.use(express.json());

// IMPORT THE ROUTES
const movieRoutes = require('./routes/movies');

// USE THE ROUTES (This adds the prefix /api/favorites)
app.use('/api/favorites', movieRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;