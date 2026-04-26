const IS_PRODUCTION = true;

export const BASE_URL = IS_PRODUCTION 
    ? "https://gsc-backend-2026.onrender.com/api/v1"  // Example GCP URL
    : "http://localhost:8000/api/v1"; //local development URL