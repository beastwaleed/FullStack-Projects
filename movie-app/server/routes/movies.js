const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite'); // Ensure this path to your model is correct

// 1. GET ALL FAVORITES
router.get('/all', async (req, res) => {
    try {
        const favorites = await Favorite.find();
        res.json(favorites);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. ADD A FAVORITE
router.post('/add', async (req, res) => {
    const { tmdbId, title, posterPath } = req.body;

    try {
        // Check if it already exists
        const existing = await Favorite.findOne({ tmdbId });
        if (existing) {
            return res.status(400).json({ message: "Movie already in watchlist!" });
        }

        const newFavorite = new Favorite({ tmdbId, title, posterPath });
        await newFavorite.save();
        res.status(201).json(newFavorite);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/:id', async(req, res)=>{
    try{
        await Favorite.findByIdAndDelete(req.params.id);
        res.json({message: "Movie removed from watchlist"});
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
})

module.exports = router;