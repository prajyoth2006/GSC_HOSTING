import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Task } from "../models/task.model.js";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const extractTaskFromImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "No image file provided");
    }

    const filePath = req.file.path;

    try {
        const imageAsBase64 = fs.readFileSync(filePath).toString("base64");
        const imagePart = {
            inlineData: { data: imageAsBase64, mimeType: req.file.mimetype },
        };

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // --- UPDATED PROMPT: Added 'searchableAddress' ---
        const prompt = `
            You are an expert data extractor assisting in disaster response and community management.
            Analyze this handwritten field report. 
            Extract the problem details and return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
            
            Expected JSON structure:
            {
                "title": "A short, punchy summary of the crisis",
                "rawReportText": "A complete, word-for-word transcription of the handwritten text in the image",
                "category": "You MUST categorize this into exactly ONE of the following: 'Medical', 'Rescue', 'Food & Water', 'Shelter', 'Sanitation', 'Labor', 'Transport', 'Supplies', 'Animal Rescue', 'Infrastructure', 'Other'",
                "severity": Analyze the urgency and return a single integer between 1 and 5,
                "requiredSkills": ["Skill 1", "Skill 2"],
                "locationDescription": "The exact, detailed description of the location as mentioned in the text (e.g., 'Intersection of hostel Arya Bhatta and Kalam, IIT Patna').",
                "searchableAddress": "A simplified, broader address optimized for Google Maps Geocoding API. Remove hyper-specific local landmarks and just give the main institution, street, city, and state (e.g., 'IIT Patna, Bihta, Bihar, India').",
                "location": {
                    "type": "Point",
                    "coordinates": [0, 0] 
                }
            }
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const cleanResponse = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const extractedData = JSON.parse(cleanResponse);

        // --- UPDATED GEOCODING: Use the new searchableAddress ---
        // We use the simplified address for Google Maps, but keep the detailed description for the database
        const addressToSearch = extractedData.searchableAddress || extractedData.locationDescription;

        if (addressToSearch) {
            try {
                const apiKey = process.env.GOOGLE_MAPS_API_KEY;
                const encodedAddress = encodeURIComponent(addressToSearch);
                const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
                
                const geoResponse = await fetch(geocodeUrl);
                const geoData = await geoResponse.json();

                console.log(`🔍 Geocoding address: "${addressToSearch}"`);
                console.log("Google Maps Geocoding Response:", geoData);    

                if (geoData.status === "OK" && geoData.results.length > 0) {
                    const { lat, lng } = geoData.results[0].geometry.location;
                    extractedData.location.coordinates = [lng, lat];
                    console.log(`✅ Geocoding successful for "${addressToSearch}": [${lng}, ${lat}]`);
                } else {
                    console.warn(`⚠️ Google Maps could not find coordinates for: "${addressToSearch}". Defaulting to [0,0].`);
                }
            } catch (geoError) {
                console.error("❌ Google Maps API Error:", geoError.message);
            }
        }

        // We can safely delete searchableAddress before sending to the frontend since the DB doesn't need it
        delete extractedData.searchableAddress;

        return res.status(200).json(
            new ApiResponse(200, extractedData, "Field report analyzed and geocoded successfully")
        );

    } catch (error) {
        console.error("Extraction Error:", error);
        throw new ApiError(500, "Failed to analyze the field report image.");
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});

// save the intialized task 
export const saveTask = asyncHandler(async (req, res) => {
    // 1. Destructure the exact fields the AI just gave us
    const { 
        title, 
        rawReportText, 
        category, 
        severity, 
        requiredSkills, 
        locationDescription, 
        location 
    } = req.body;

    // 2. Basic Validation: Ensure the critical fields aren't empty
    if (!title || !rawReportText || !category || !severity || !locationDescription) {
        throw new ApiError(400, "Missing required fields. Please ensure the report is complete.");
    }

    // 3. Create the new Task in MongoDB
    const newTask = await Task.create({
        title,
        rawReportText,
        category,
        severity: Number(severity), // Ensure it saves as a number
        requiredSkills: requiredSkills || [],
        locationDescription,
        location: location || { type: "Point", coordinates: [0, 0] },
        // IMPORTANT: We automatically link the logged-in Worker to this task!
        reportedBy: req.user._id, 
        status: "Pending" // Default status
    });

    // 4. Verify it was created and send success response
    if (!newTask) {
        throw new ApiError(500, "Something went wrong while saving the task to the database");
    }

    return res.status(201).json(
        new ApiResponse(201, newTask, "Task successfully saved to the database!")
    );
});

// CREATE TASK MANUALLY (AI AUTO-TAGGING & GEOCODING)
export const createTaskManually = asyncHandler(async (req, res) => {
    const { 
        title, 
        rawReportText, 
        locationDescription, 
        location 
    } = req.body;

    // 1. Basic Text Validation
    if (!title || !rawReportText || !locationDescription) {
        throw new ApiError(400, "Title, report text, and location description are required.");
    }

    try {
        // --- 2. THE LOCATION GATEKEEPER ---
        let finalCoordinates = null;

        // Check if user provided valid coordinates in the request
        if (location?.coordinates && 
            location.coordinates.length === 2 && 
            (location.coordinates[0] !== 0 || location.coordinates[1] !== 0)) {
            
            finalCoordinates = location.coordinates;
            console.log("📍 Using user-provided coordinates.");
        } 
        // If not, try Google Maps
        else {
            console.log("🔍 Attempting to geocode address...");
            try {
                const apiKey = process.env.GOOGLE_MAPS_API_KEY;
                const encodedAddress = encodeURIComponent(locationDescription);
                const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
                
                const geoResponse = await fetch(geocodeUrl);
                const geoData = await geoResponse.json();

                if (geoData.status === "OK" && geoData.results.length > 0) {
                    const { lat, lng } = geoData.results[0].geometry.location;
                    finalCoordinates = [lng, lat];
                    console.log(`✅ Geocoding successful: [${lng}, ${lat}]`);
                }
            } catch (geoError) {
                console.error("❌ Google Maps API Error:", geoError.message);
            }
        }

        // 🚨 THE CRITICAL CHECK: If we still don't have coordinates, STOP HERE.
        if (!finalCoordinates) {
            throw new ApiError(400, "Location could not be determined. Please provide valid coordinates or a more specific address.");
        }

        // --- 3. Gemini AI Analysis (Category, Skills, Severity) ---
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            You are an expert emergency dispatcher. 
            Analyze this report:
            Title: "${title}"
            Description: "${rawReportText}"

            Return ONLY a valid JSON object:
            {
                "category": "Choose ONE: 'Medical', 'Rescue', 'Food & Water', 'Shelter', 'Sanitation', 'Labor', 'Transport', 'Supplies', 'Animal Rescue', 'Infrastructure', 'Other'",
                "requiredSkills": ["List 2-4 skills"],
                "severity": Integer 1-5 (5 is most urgent)
            }
        `;

        const result = await model.generateContent(prompt);
        const cleanResponse = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const aiAnalysis = JSON.parse(cleanResponse);

        // --- 4. Save to Database ---
        const newTask = await Task.create({
            title,
            rawReportText,
            locationDescription,
            category: aiAnalysis.category || "Other",
            severity: aiAnalysis.severity || 3,
            requiredSkills: aiAnalysis.requiredSkills || [],
            location: { type: "Point", coordinates: finalCoordinates },
            reportedBy: req.user._id, 
            status: "Pending"
        });

        return res.status(201).json(
            new ApiResponse(201, newTask, "Task created successfully with AI analysis.")
        );

    } catch (error) {
        // Handle specific ApiErrors (like our location check) differently than general crashes
        if (error instanceof ApiError) throw error;

        console.error("Task Creation Error:", error);
        throw new ApiError(500, "Internal Server Error while creating task.");
    }
});