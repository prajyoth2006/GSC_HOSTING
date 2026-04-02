const IS_PRODUCTION = false;

export const BASE_URL = IS_PRODUCTION 
    ? "https://your-api-name.appspot.com/api"  // Example GCP URL
    : "http://localhost:8000/api/v1"; //local development URL

