import { Request, Response } from "express";
import Thumbnail from '../models/Thumbnail.js';
import ai from "../configs/ai.js";
import cloudinary from "../configs/cloudinary.js";
import path from "path";
import fs from 'fs';
import sharp from 'sharp';

let textVariationIndex = 0;

const textVariations = [
    { gradient: ['#ff6b6b', '#4ecdc4', '#45b7d1'], fontSize: 75, fontWeight: 900, stroke: 'white', strokeWidth: 3, shadowOffset: { dx: 4, dy: 4 }, yPos: '85%' },
    { gradient: ['#ff9ff3', '#f368e0', '#a8e6cf'], fontSize: 80, fontWeight: 800, stroke: 'black', strokeWidth: 2, shadowOffset: { dx: 3, dy: 3 }, yPos: '82%' },
    { gradient: ['#ffd93d', '#ff6b6b', '#4ecdc4'], fontSize: 78, fontWeight: 900, stroke: 'white', strokeWidth: 4, shadowOffset: { dx: 5, dy: 5 }, yPos: '88%' }
];

export const generateThumbnail = async (req: Request, res: Response) => {
    try {
        const { userId } = req.session;
        if (!userId) return res.status(401).json({ message: 'User not authenticated' });
        const { title, style } = req.body;

        const filename = `thumb-${Date.now()}.png`;
        const filePath = path.join(process.cwd(), 'images', filename);
        if (!fs.existsSync('images')) fs.mkdirSync('images');

        // 1. FIXED GEMINI (Using the 2026 stable string)
        let backgroundPrompt = `A cinematic background for ${title}, ${style} style. NO TEXT.`;
        try {
            const refinementResponse: any = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // Ensure this matches your config/ai.js
                contents: [{ role: 'user', parts: [{ text: `Create a cinematic scene description for: ${title}. NO text, NO graphic icons.` }] }]
            });
            backgroundPrompt = refinementResponse.candidates?.[0]?.content?.parts?.[0]?.text || backgroundPrompt;
        } catch (e: any) {
            console.warn("Gemini failing: Use the new key from AI Studio!");
        }

        // 2. FIXED HUGGING FACE (Using SDXL Base - the most reliable free model)
        const modelId = "black-forest-labs/FLUX.1-schnell";

        // stabilityai/stable-diffusion-xl-base-1.0

        const hfResponse = await fetch(
            `https://router.huggingface.co/hf-inference/models/${modelId}`,
            {
                headers: {
                    "Authorization": `Bearer ${process.env.HF_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: backgroundPrompt,
                    parameters: {
                        "width": 1024, // Note: v1.5 prefers 512 or 768, but Sharp will fix the size
                        "height": 576,
                        "guidance_scale": 7.5,
                        "negative_prompt": "text, letters, words, play button, logo",
                        "num_inference_steps": 30
                    }
                }),
            }
        );

        if (!hfResponse.ok) {
            const errorText = await hfResponse.text();
            throw new Error(`HF Router Error: ${hfResponse.status} - ${errorText}`);
        }

        const backgroundBuffer = Buffer.from(await hfResponse.arrayBuffer());

        // 3. SVG Overlay & Sharp (Round Robin)
        const variation = textVariations[textVariationIndex];
        textVariationIndex = (textVariationIndex + 1) % textVariations.length;

        const svgOverlay = `
            <svg width="1024" height="576" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${variation.gradient[0]}" />
                        <stop offset="100%" style="stop-color:${variation.gradient[1]}" />
                    </linearGradient>
                </defs>
                <rect width="1024" height="576" fill="rgba(0,0,0,0.2)"/>
                <text x="50%" y="${variation.yPos}" text-anchor="middle" font-family="sans-serif" font-size="${variation.fontSize}" font-weight="900" fill="url(#g)" stroke="white" stroke-width="2">
                    ${title.toUpperCase()}
                </text>
            </svg>`;

        await sharp(backgroundBuffer)
            .resize(1024, 576)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .toFile(filePath);

        // 4. Cloudinary
        const uploadResult = await cloudinary.uploader.upload(filePath);
        const thumbnail = await Thumbnail.create({
            userId, title, style, prompt_used: backgroundPrompt, image_url: uploadResult.secure_url, isGenerating: false
        });

        res.json({ message: 'Success', thumbnail });
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    } catch (error: any) {
        console.error("GENERATION ERROR:", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const getThumbnail = async (req: Request, res: Response) => {
    try {
        const { userId } = req.session;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const thumbnail = await Thumbnail.findById(id);

        if (!thumbnail) {
            return res.status(404).json({ message: 'Thumbnail not found' });
        }

        if (thumbnail.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to view this thumbnail' });
        }

        res.json({ thumbnail });
    } catch (error) {
        console.error("Get thumbnail error:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        res.status(500).json({ message: errorMessage });
    }
}

export const getUserThumbnails = async (req: Request, res: Response) => {
    try {
        const { userId } = req.session;
        const { search } = req.query;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        let query: any = { userId };

        // Add search filter if provided
        if (search) {
            query.title = { $regex: search, $options: 'i' }; // Case-insensitive search
        }

        const thumbnails = await Thumbnail.find(query).sort({ createdAt: -1 });

        res.json({ thumbnails });
    } catch (error) {
        console.error("Get user thumbnails error:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        res.status(500).json({ message: errorMessage });
    }
}

export const deleteThumbnail = async (req: Request, res: Response) => {
    try {
        const { userId } = req.session;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const thumbnail = await Thumbnail.findById(id);

        if (!thumbnail) {
            return res.status(404).json({ message: 'Thumbnail not found' });
        }

        if (thumbnail.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this thumbnail' });
        }

        // Delete from Cloudinary if image URL exists
        if (thumbnail.image_url) {
            try {
                // Extract public_id from Cloudinary URL
                const urlParts = thumbnail.image_url.split('/');
                const publicId = urlParts[urlParts.length - 1].split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (cloudinaryError: any) {
                console.warn("Could not delete image from Cloudinary:", cloudinaryError.message);
            }
        }

        // Delete from database
        await Thumbnail.findByIdAndDelete(id);

        res.json({ message: 'Thumbnail deleted successfully' });
    } catch (error) {
        console.error("Delete thumbnail error:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        res.status(500).json({ message: errorMessage });
    }
}