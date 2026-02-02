import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    secure: true
});

// Configure Cloudinary with CLOUDINARY_URL environment variable
if (process.env.CLOUDINARY_URL) {
    // CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
    // Node.js automatically parses this when set as env var
}

export default cloudinary;
