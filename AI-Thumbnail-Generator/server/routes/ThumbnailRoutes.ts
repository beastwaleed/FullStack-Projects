import express from 'express'
import { generateThumbnail, getThumbnail, getUserThumbnails, deleteThumbnail } from '../controllers/ThumbnailController.js';
import protect from '../middlewares/auth.js';

const ThumbnailRouter = express.Router();

ThumbnailRouter.post('/generate', protect, generateThumbnail)
ThumbnailRouter.get('/:id', protect, getThumbnail)
ThumbnailRouter.delete('/:id', protect, deleteThumbnail)
ThumbnailRouter.get('/', protect, getUserThumbnails)

export default ThumbnailRouter;