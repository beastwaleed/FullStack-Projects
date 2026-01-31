import  express  from "express";
import { getThumbnailbyId, getUsersThumbnail } from "../controllers/UserController.js";

const UserRouter = express.Router();

UserRouter.get('/thumbnails',getUsersThumbnail);
UserRouter.get('/thumbnails/:id',getThumbnailbyId);

export default UserRouter;