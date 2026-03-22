import multer from "multer";
import path from "path";
import { ApiError } from "../utils/ApiError.js";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp"); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ADDED: The File Filter
const fileFilter = (req, file, cb) => {
    // Define the allowed file types (Images and PDFs)
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

    if (allowedMimeTypes.includes(file.mimetype)) {
        // Accept the file
        cb(null, true);
    } else {
        // Reject the file
        cb(new ApiError(400, "Unsupported file format. Please upload an image or PDF."), false);
    }
};

export const upload = multer({ 
    storage,
    fileFilter, // <-- Apply the filter here
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});