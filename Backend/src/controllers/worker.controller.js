import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Task } from "../models/task.model.js";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// extract task from image using AI and sending it back to the user for verification
export const extractTaskFromImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "No image file provided");
    }

    const filePath = req.file.path;

    try {
        // 1. Read the image saved by multer
        const imageAsBase64 = fs.readFileSync(filePath).toString("base64");
        const imagePart = {
            inlineData: { data: imageAsBase64, mimeType: req.file.mimetype },
        };

        // 2. Set up Gemini (1.5 Flash is perfect for fast image processing)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 3. The Prompt: Instruct Gemini to read the community needs report
       // 3. The Prompt: Strictly typed for the updated Task schema
        const prompt = `
            You are an expert data extractor assisting in disaster response and community management.
            Analyze this handwritten field report. 
            Extract the problem details and return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
            
            Expected JSON structure:
            {
                "title": "A short, punchy summary of the crisis (e.g., 'Fallen Tree on Powerline', 'Severe Flooding')",
                "rawReportText": "A complete, word-for-word transcription of the handwritten text in the image",
                "category": "You MUST categorize this into exactly ONE of the following: 'Medical', 'Rescue', 'Food & Water', 'Shelter', 'Sanitation', 'Labor', 'Transport', 'Supplies', 'Animal Rescue', 'Infrastructure', 'Other'",
                "severity": Analyze the urgency and return a single integer between 1 and 5 (1 being lowest, 5 being critical/life-threatening),
                "requiredSkills": ["Skill 1", "Skill 2"],
                "locationDescription": "A textual description of the location mentioned in the report (e.g., 'Behind the community center on Main St.')",
                "location": {
                    "type": "Point",
                    "coordinates": [longitude, latitude] // Estimate from the text if a known city/landmark is mentioned, otherwise default to [0,0]
                }
            }
        `;

        // 4. Send to Gemini
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        // 5. Parse the JSON string from Gemini into a JavaScript object
        const extractedData = JSON.parse(responseText.trim());

        // 6. Send it back to the frontend for the Field Worker to review before saving
        return res.status(200).json(
            new ApiResponse(200, extractedData, "Field report analyzed successfully")
        );

    } catch (error) {
        console.error("Gemini AI Error:", error);
        throw new ApiError(500, "Failed to analyze the field report image.");
    } finally {
        // 7. ALWAYS delete the local file after processing to save server space
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

// CREATE TASK MANUALLY (AI AUTO-TAGGING)
export const createTaskManually = asyncHandler(async (req, res) => {
    // 1. We only ask the user for the bare minimum details
    const { 
        title, 
        rawReportText, 
        severity, 
        locationDescription, 
        location 
    } = req.body;

    if (!title || !rawReportText || !severity || !locationDescription) {
        throw new ApiError(400, "Please provide the title, description, severity, and location.");
    }

    try {
        // 2. Wake up Gemini to analyze what the worker just typed
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 3. The Auto-Tagger Prompt
        const prompt = `
            You are an expert emergency dispatcher. 
            Read the following disaster report submitted by a field worker.
            Title: "${title}"
            Description: "${rawReportText}"

            Based on this text, predict the most accurate category and the required skills needed to fix it.
            Return ONLY a valid JSON object. Do not include markdown like \`\`\`json.
            
            Expected JSON structure:
            {
                "category": "You MUST choose exactly ONE of these: 'Medical', 'Rescue', 'Food & Water', 'Shelter', 'Sanitation', 'Labor', 'Transport', 'Supplies', 'Animal Rescue', 'Infrastructure', 'Other'",
                "requiredSkills": ["List 2 to 4 specific skills needed, e.g., 'First Aid', 'Debris Removal', 'Plumbing'"]
            }
        `;

        const result = await model.generateContent(prompt);
        const aiPrediction = JSON.parse(result.response.text().trim());

        // 4. Merge the worker's input with the AI's predictions and save to the database!
        const newTask = await Task.create({
            title,
            rawReportText,
            category: aiPrediction.category, // <-- AI's choice!
            severity: Number(severity),
            requiredSkills: aiPrediction.requiredSkills || [], // <-- AI's choice!
            locationDescription,
            location: location || { type: "Point", coordinates: [0, 0] },
            reportedBy: req.user._id, 
            status: "Pending"
        });

        // 5. Send the successfully saved task back to the frontend
        return res.status(201).json(
            new ApiResponse(201, newTask, "Digital report auto-tagged and saved successfully!")
        );

    } catch (error) {
        console.error("AI Auto-Tagging Error:", error);
        throw new ApiError(500, "Failed to analyze and save the report.");
    }
});