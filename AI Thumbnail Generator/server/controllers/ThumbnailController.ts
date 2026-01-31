import { Request, Response } from "express";
// import Thumbnail from '../models/Thumbnail.js'
import Thumbnail from '../models/Thumbnail.js';
import ai from "../configs/ai.js";
import cloudinary from "../configs/cloudinary.js";
import path from "path";
import fs from 'fs';
import sharp from 'sharp';

const stylePrompts = {
    'Bold & Graphics': 'eye-catching thumbnail, bold typography,vibrant colors,expressive facial reaction, dramatic lighting,high contrast, click-worthy composition, professional style',

    'Tech/Futuristic': 'futuristic thumbnail, sleek modern design,digital UI elements, glowing accents, holographic effects,cyber-tech aesthetic, sharp lighting, high-tech atmosphere',

    'Minimalist': 'minimalist thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point', 
    
    'Photorealistic': 'photorealistic thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field',

    'Illustrated': 'illustrated thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style',
}


const colorSchemeDescriptions = {
    vibrant: 'vibrant and energetic colors, high saturation, bold contrasts, eye-catching pallete',
    sunset: 'warm sunset tones, orange pink and purple hues, soft gradients, cinematic glow',
    forest: 'natural green tones, earthy colors, calm and organic palette, fresh atmosphere',
    neon: 'neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow',
    purple: 'purple-dominant color palette, magenta and violettones, modern and stylish mood',
    monochrome: 'black and white color scheme, high contrast,dramatic lighting, timeless aesthetic',
    ocean: 'cool blue and teal tones, aquatic color palette, fresh and clean atmosphere',
    pastel: 'soft pastel colors, low saturation, gentle tones, calm and friendly aesthetic',
}

export const generateThumbnail = async (req: Request, res: Response) => {
    try {
        const { userId } = req.session;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { title, prompt: user_prompt, style, aspect_ratio, color_scheme, text_overlay } = req.body;

        // Validation
        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }

        if (!style) {
            return res.status(400).json({ message: 'Style is required' });
        }

        // Convert empty strings to proper values for boolean fields
        const processedTextOverlay = text_overlay === '' ? false : text_overlay;

        const thumbnail = await Thumbnail.create({
            userId, title, prompt_used: user_prompt, style, aspect_ratio, color_scheme, text_overlay: processedTextOverlay, isGenerating: true
        })

        // Step 1: Refine the prompt using Gemini 2.5 Flash (text-only)
        let initialPrompt = `Create a ${stylePrompts[style as keyof typeof stylePrompts]} for: ${title}`;

        if (color_scheme) {
            initialPrompt += ` Use a ${colorSchemeDescriptions[color_scheme as keyof typeof colorSchemeDescriptions]} color scheme.`
        }

        if (user_prompt) {
            initialPrompt += ` Additional Details: ${user_prompt}.`
        }

        initialPrompt += ` The thumbnail should be ${aspect_ratio || '16:9'}, visually stunning and designed to maximize CTR and make it impossible to ignore.`

        // Get refined prompt from Gemini 2.5 Flash
        let refinedPrompt = initialPrompt;

        try {
            const refinementResponse: any = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `IGNORE ALL PREVIOUS TOPICS. Create a NEW image prompt for: "${title}". 
                                The subject is: ${title},
                                Style: ${style}
                                You are an expert Typography and Thumbnail Designer. 
                                Refine the following idea into a prompt for the FLUX.1 model.

                                TEXT IS VERY VERY VERY MANDATORY:
                                1. You MUST include the exact text: "${title}".
                                2. Describe the text as a physical object: e.g., 'Big, bold, 3D vibrant yellow letters that say "${title}"'.
                                3. Specify placement: 'The text should be prominently displayed in the upper-third of the image'.
                                4. Add contrast: 'The text must have a thick black outline and a cinematic drop shadow to make it pop'.
                                5. Use single quotes: Always put the text inside 'SINGLE QUOTES' so the AI identifies it as characters to render.
            
                                IDEA: "${initialPrompt}"
                                TITLE TO RENDER: "${title}"
                                
                                OUTPUT ONLY THE REFINED PROMPT.`
                            }
                        ]
                    }
                ],
                config: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                }
            })

            refinedPrompt = refinementResponse.candidates?.[0]?.content?.parts?.[0]?.text || initialPrompt;
        } catch (geminiError: any) {
            console.warn("Gemini refinement failed, using initial prompt:", geminiError.message);
            refinedPrompt = initialPrompt;
        }

        if (!process.env.HF_ACCESS_TOKEN) {
            throw new Error('Hugging Face API token not configured');
        }

        let imageBuffer: Buffer;


        // Step 2: Generate image using the new Hugging Face Router (100% FREE)

        try {
            const hfResponse = await fetch(
                // Updated 2026 URL: router.huggingface.co/hf-inference/...
                "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
                {
                    headers: {
                        "Authorization": `Bearer ${process.env.HF_ACCESS_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify({
                        inputs: refinedPrompt,
                        parameters: {
                            "width": 1024,
                            "height": 576,
                            "guidance_scale": 0,
                            "num_inference_steps": 4
                        }
                    }),
                }
            );

            if (!hfResponse.ok) {
                const errorText = await hfResponse.text();
                console.error("HF Error Details:", errorText);
                throw new Error(`HF Router error: ${hfResponse.status} - ${errorText}`);
            }

            const arrayBuffer = await hfResponse.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);

        } catch (hfError: any) {
            console.error("Hugging Face Router failure:", hfError.message);
            throw new Error(`Image generation failed: ${hfError.message}`);
        }

        const filename = `final-output-${Date.now()}.png`
        const filePath = path.join('images', filename);

        // create image directory
        fs.mkdirSync('images', { recursive: true })
        fs.writeFileSync(filePath, imageBuffer);

        // Upload to Cloudinary
        let uploadResult;
        try {
            uploadResult = await cloudinary.uploader.upload(filePath, { resource_type: 'image' })
        } catch (cloudinaryError: any) {
            fs.unlinkSync(filePath);
            throw new Error(`Cloudinary upload failed: ${cloudinaryError.message}`);
        }

        thumbnail.image_url = uploadResult.url;
        thumbnail.isGenerating = false;
        await thumbnail.save()

        res.json({ message: 'Thumbnail Generated Successfully', thumbnail })

        //remove image from disk
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            console.warn("Could not delete temp file:", filePath);
        }
    } catch (error) {
        console.error("Thumbnail generation error - FULL:", JSON.stringify(error, null, 2));
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error("Sending to client:", errorMessage);
        res.status(500).json({ message: errorMessage });
    }
}

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