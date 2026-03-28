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
    const { 
        title, 
        rawReportText, 
        category, 
        severity, 
        requiredSkills, 
        locationDescription, 
        location 
    } = req.body;

    if (!title || !rawReportText || !category || !severity || !locationDescription) {
        throw new ApiError(400, "Missing required fields.");
    }

    const newTask = await Task.create({
        title,
        rawReportText,
        category,
        severity: Number(severity),
        requiredSkills: requiredSkills || [],
        locationDescription,
        location: location || { type: "Point", coordinates: [0, 0] },
        reportedBy: req.user._id, 
        status: "Pending"
    });

    if (!newTask) {
        throw new ApiError(500, "Failed to save the task.");
    }

    // 🟢 --- SOCKET.IO REAL-TIME NOTIFICATION ---
    const io = req.app.get("io");
    if (io) {
        // We manually attach the reporter's name so the Admin dashboard looks better
        const taskWithReporter = {
            ...newTask._doc,
            reporterName: req.user.fullName || "Field Worker" 
        };
        io.emit("newTaskCreated", taskWithReporter);
        console.log("📡 Real-time alert sent: New Task Saved");
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

    if (!title || !rawReportText || !locationDescription) {
        throw new ApiError(400, "Required fields missing.");
    }

    try {
        let finalCoordinates = null;

        // 1. Check if coordinates are already provided
        if (location?.coordinates && location.coordinates.length === 2 && 
           (location.coordinates[0] !== 0 || location.coordinates[1] !== 0)) {
            finalCoordinates = location.coordinates;
        } 
        else {
            // Geocoding logic
            try {
                const apiKey = process.env.GOOGLE_MAPS_API_KEY;
                const encodedAddress = encodeURIComponent(locationDescription);
                const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
                
                const geoResponse = await fetch(geocodeUrl);
                const geoData = await geoResponse.json();

                if (geoData.status === "OK" && geoData.results.length > 0) {
                    const { lat, lng } = geoData.results[0].geometry.location;
                    finalCoordinates = [lng, lat];
                }
            } catch (geoError) {
                console.error("Geocoding Error:", geoError.message);
            }
        }

        if (!finalCoordinates) {
            throw new ApiError(400, "Location could not be determined. Please be more specific.");
        }

        // 2. Gemini AI Analysis
        // Using 1.5-flash for stability
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
            Analyze this disaster report and return ONLY a valid JSON object.
            Title: "${title}"
            Description: "${rawReportText}"

            JSON structure:
            {
                "category": "ONE OF: Medical, Rescue, Food & Water, Shelter, Sanitation, Labor, Transport, Supplies, Animal Rescue, Infrastructure, Other",
                "requiredSkills": ["skill1", "skill2"],
                "severity": 1-5
            }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Robust JSON cleaning
        const cleanResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let aiAnalysis;
        try {
            aiAnalysis = JSON.parse(cleanResponse);
        } catch (e) {
            console.error("AI JSON Parse Error. Raw text was:", responseText);
            // Fallback if AI messes up the format
            aiAnalysis = { category: "Other", requiredSkills: [], severity: 3 };
        }

        // 3. Save to Database
        const newTask = await Task.create({
            title,
            rawReportText,
            locationDescription,
            category: aiAnalysis.category || "Other",
            severity: Number(aiAnalysis.severity) || 3,
            requiredSkills: aiAnalysis.requiredSkills || [],
            location: { type: "Point", coordinates: finalCoordinates },
            reportedBy: req.user._id, 
            status: "Pending"
        });

        // 🟢 --- UPDATED SOCKET LOGIC ---
        const io = req.app.get("io");
        if (io) {
            const taskWithReporter = {
                ...newTask.toObject(), // Use toObject() instead of ._doc for safety
                reporterName: req.user.name || "Field Worker" // Fixed: Uses .name
            };
            io.emit("newTaskCreated", taskWithReporter);
            console.log(`📡 Broadcasted new task reported by ${req.user.name}`);
        }

        return res.status(201).json(
            new ApiResponse(201, newTask, "Task created successfully!")
        );

    } catch (error) {
        // Log the actual error to your console so you can see it!
        console.error("CRITICAL TASK ERROR:", error);

        if (error instanceof ApiError) throw error;
        throw new ApiError(500, error.message || "Internal Server Error during task creation.");
    }
});