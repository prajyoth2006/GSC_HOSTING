import { Task } from '../models/task.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
// Initialize Gemini (Ensure your API Key is in .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Get all the pending tasks in order of severity
export const getTriageTasks = asyncHandler(async (req, res) => {
    // 1. Extract optional filters from the query URL (e.g., ?category=Medical)
    const { category } = req.query;

    // 2. Build the base query: We only want tasks waiting for a human
    const query = { status: 'Pending' };

    // 3. Apply the category filter if the frontend sends one
    if (category && category !== 'All') {
        query.category = category;
    }

    // 4. Fetch the data from MongoDB
    const triageTasks = await Task.find(query)
        .populate('reportedBy', 'name email role') // Grab the reporter's contact info
        .sort({ 
            severity: -1, // Primary Sort: 5 (Critical) down to 1 (Low)
            createdAt: 1  // Secondary Sort: Oldest tasks first (FIFO queue)
        });

    // 5. Optional safety check (asyncHandler catches major crashes, but this catches DB misses)
    if (!triageTasks) {
        throw new ApiError(500, "Failed to retrieve the triage queue from the database.");
    }

    // 6. Return your standardized API response
    return res.status(200).json(
        new ApiResponse(
            200, 
            triageTasks, // This will map to `result.data` in your React frontend
            "Triage queue retrieved successfully."
        )
    );
});

// Hard filter - matching all the volunteers with category and isAvailable and sorted according to distance
export const getHardFilterCandidates = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    // 1. Fetch the specific task
    const task = await Task.findById(taskId);
    
    if (!task) {
        throw new ApiError(404, "Task not found.");
    }

    // 2. Define the "Search Rings" (in meters). 
    // It will try 50km first. If 0 found, it tries 100km. If 0 found, it tries 200km.
    const searchRings = [50000, 100000, 200000]; 
    
    let candidates = [];
    let finalRadiusUsed = 0;

    // 3. The Automatic Expansion Loop
    for (const currentRadius of searchRings) {
        finalRadiusUsed = currentRadius;

        candidates = await User.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: task.location.coordinates
                    },
                    distanceField: "distanceInMeters",
                    maxDistance: currentRadius, // Uses the current ring radius
                    query: { 
                        role: "Volunteer",
                        isAvailable: true,     
                        category: task.category 
                    },
                    spherical: true
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    phone: 1,
                    skills: 1,
                    category: 1,
                    distanceInKm: { $round: [{ $divide: ["$distanceInMeters", 1000] }, 1] }
                }
            },
            {
                $limit: 25
            }
        ]);

        // If we found at least 1 person, STOP expanding and break the loop!
        if (candidates.length > 0) {
            break;
        }
    }

    // 4. Generate a smart message so the frontend Admin knows if the system had to expand
    let message = `Found ${candidates.length} matching candidates within ${finalRadiusUsed / 1000}km.`;
    
    if (candidates.length === 0) {
        message = `Critical: No available volunteers found even after expanding the search to ${searchRings[searchRings.length - 1] / 1000}km.`;
    } else if (finalRadiusUsed > searchRings[0]) {
        // Warn the admin that we had to pull people from further away
        message = `Expanded search to ${finalRadiusUsed / 1000}km to find ${candidates.length} candidates.`;
    }

    // 5. Return the response
    return res.status(200).json(
        new ApiResponse(
            200, 
            {
                taskDetails: {
                    title: task.title,
                    category: task.category,
                    requiredSkills: task.requiredSkills
                },
                searchRadiusKm: finalRadiusUsed / 1000, // Tell the UI what radius worked
                candidates: candidates
            },
            message
        )
    );
});

// smart-sort - this first sorts by distance and then by AI gives skills score based on skill match and then finally return the array
export const getSmartSortedCandidates = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) throw new ApiError(404, "Task not found.");

    // 1. Ring Expansion to get the base list (Fast DB check)
    const searchRings = [50000, 100000, 200000]; 
    let baseCandidates = [];
    let radiusUsed = 0;

    for (const radius of searchRings) {
        radiusUsed = radius;
        baseCandidates = await User.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: task.location.coordinates },
                    distanceField: "distanceInMeters",
                    maxDistance: radius,
                    query: { role: "Volunteer", isAvailable: true, category: task.category },
                    spherical: true
                }
            },
            { $limit: 15 } // We only send the top 15 to Gemini to save tokens/time
        ]);
        if (baseCandidates.length > 0) break;
    }

    if (baseCandidates.length === 0) {
        return res.status(200).json(new ApiResponse(200, { candidates: [] }, "No local candidates found."));
    }

    // ==========================================
    // 2. Prepare the AI Prompt (Perfected)
    // ==========================================
    const prompt = `
    You are an emergency dispatch AI. Your job is to calculate a 'skillScore' (0 to 50) by comparing a Task's requirements to a Volunteer's skills.
    
    CRITICAL RULES:
    1. Semantic Matching: 'Ambulance' matches 'Paramedic'. 'Boat' matches 'Water Rescue'.
    2. Partial Credit: If a volunteer has 1 out of 3 skills, give them a proportional score.
    3. Output Format: You MUST return ONLY a JSON array. No conversational text.
    
    TASK DATA:
    - Title: "${task.title}"
    - Required Skills: [${task.requiredSkills?.join(", ") || "None specified"}]
    
    VOLUNTEERS TO EVALUATE:
    ${baseCandidates.map((v, i) => `ID: ${i} | Skills: [${v.skills?.join(", ") || "No skills listed"}]`).join("\n")}
    
    RESPONSE SCHEMA:
    [{"id": number, "skillScore": number, "reasoning": "short string"}]
    `;

    // ==========================================
    // 3. Call Gemini & Robust Parsing (Perfected)
    // ==========================================
    let skillRatings = [];

    try {
        const aiResult = await model.generateContent(prompt);
        const responseText = aiResult.response.text();

        // 3a. Robust Extraction: LLMs often wrap JSON in ```json blocks. 
        // We use a Regex to find the content between the first '[' and last ']'
        const jsonRegex = /\[[\s\S]*\]/;
        const match = responseText.match(jsonRegex);

        if (!match) {
            throw new Error("Gemini did not return a valid JSON array structure.");
        }

        skillRatings = JSON.parse(match[0]);

        // 3b. Validate that we got a rating for every candidate
        if (skillRatings.length !== baseCandidates.length) {
            console.warn("AI returned mismatched candidate count. Using default scoring.");
            throw new Error("Incomplete AI data.");
        }

    } catch (error) {
        console.error("GEMINI_ERROR / PARSING_ERROR:", error.message);
        
        // 3c. THE PERFECT FALLBACK: 
        // If the AI is down or the JSON is broken, we give a neutral score (25/50)
        // so the system stays functional for the admin.
        skillRatings = baseCandidates.map((_, i) => ({
            id: i,
            skillScore: 10, // Low but non-zero fallback
            reasoning: "AI analysis unavailable; using distance-only fallback."
        }));
    }

    // 4. Combine AI Logic with Distance Logic
    const rankedCandidates = baseCandidates.map((volunteer, index) => {
        // --- Distance Score (0 to 50) ---
        const distanceScore = 50 - ((volunteer.distanceInMeters / radiusUsed) * 50);
        
        // --- AI Skill Score (0 to 50) ---
        const aiScore = skillRatings.find(r => r.id === index)?.skillScore || 0;
        
        const totalMatch = Math.round(Math.max(0, distanceScore) + aiScore);

        return {
            _id: volunteer._id,
            name: volunteer.name,
            distanceInKm: (volunteer.distanceInMeters / 1000).toFixed(1),
            skills: volunteer.skills,
            matchPercentage: totalMatch,
            aiReasoning: aiScore > 35 ? "High Skill Relevance" : aiScore > 15 ? "Partial Match" : "Low Match",
            breakdown: {
                distanceWeight: Math.round(distanceScore),
                aiSkillWeight: aiScore
            }
        };
    });

    // 5. Final Sort by AI + Math combined score
    rankedCandidates.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return res.status(200).json(
        new ApiResponse(
            200, 
            {
                taskTitle: task.title,
                searchRadiusKm: radiusUsed / 1000,
                candidates: rankedCandidates
            },
            "AI-Powered Smart Sorting Analysis Complete."
        )
    );
});

// Assigning a volunteer to a task
export const assignVolunteerToTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { volunteerId } = req.body;

    if (!volunteerId) {
        throw new ApiError(400, "You must select a volunteer to assign.");
    }

    // 1. Fetch both documents
    const task = await Task.findById(taskId);
    const volunteer = await User.findOne({ _id: volunteerId, isAvailable: true });

    if (!task) throw new ApiError(404, "Task not found.");
    if (!volunteer) throw new ApiError(404, "Volunteer no longer exists in the system.");

    // 2. Eligibility Checks
    if (task.status !== 'Pending') {
        throw new ApiError(400, "This task is already assigned or completed.");
    }

    if (!volunteer.isAvailable) {
        throw new ApiError(400, "This volunteer is currently busy with another task.");
    }

    // 3. The Handshake
    task.assignedVolunteer = volunteerId;
    task.status = 'Matched';
    volunteer.isAvailable = false;

    await task.save();
    await volunteer.save();

    return res.status(200).json(
        new ApiResponse(
            200, 
            { taskStatus: task.status, volunteerName: volunteer.name },
            `Mission Lock: ${volunteer.name} has been deployed to "${task.title}".`
        )
    );
});

// Revoking a volunteer from a task
export const unassignVolunteer = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) throw new ApiError(404, "Task not found.");
    if (!task.assignedVolunteer) {
        throw new ApiError(400, "This task doesn't have an assigned volunteer to remove.");
    }

    // 1. Get the volunteer who was assigned
    const volunteer = await User.findById(task.assignedVolunteer);

    // 2. Reset the Task
    task.assignedVolunteer = null;
    task.status = 'Pending';

    // 3. Free up the Volunteer (if they still exist in DB)
    if (volunteer) {
        volunteer.isAvailable = true;
        await volunteer.save();
    }

    await task.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Assignment revoked. Task has been returned to the Triage Queue.")
    );
});