import { Router } from "express";
import { 
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    updateUserPassword
} from "../controllers/user.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

// --- PUBLIC ROUTES ---
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// protected routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/profile").get(verifyJWT,getCurrentUser)
router.route("/update-password").post(verifyJWT,updateUserPassword);
router.route("/update-details").post(verifyJWT, updateAccountDetails);

export default router;