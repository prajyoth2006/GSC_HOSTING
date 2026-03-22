import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { extractTaskFromImage, saveTask ,createTaskManually} from "../controllers/worker.controller.js"; // Import saveTask

const router = Router();

router.use(verifyJWT);

// ==========================================
// WORKER-ONLY ROUTES
// ==========================================

// 1. Upload photo and get AI JSON
router.route("/upload-report").post(
    authorizeRoles("Worker", "Admin"), 
    upload.single("formImage"), 
    extractTaskFromImage
);

// 2. Save the confirmed JSON to the database
router.route("/save-task").post(
    authorizeRoles("Worker", "Admin"), 
    saveTask 
);

router.route("/create-task").post(
    authorizeRoles("Worker", "Admin"), 
    createTaskManually 
);

export default router;