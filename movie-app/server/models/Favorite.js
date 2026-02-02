const mongoose = require('mongoose');

// This defines what a "Favorite" looks like in your database
const FavoriteSchema = new mongoose.Schema({
    tmdbId: {
        type: String,
        required: true,
        unique: true // Prevents saving the same movie twice
    },
    title: {
        type: String,
        required: true
    },
    posterPath: {
        type: String,
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now // Automatically records when you saved it
    }
});

module.exports = mongoose.model('Favorite', FavoriteSchema);