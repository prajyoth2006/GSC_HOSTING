import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js"; 
import { ApiError } from "../utils/ApiError.js";         
import { ApiResponse } from "../utils/ApiResponse.js";   
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); // Bypass validation for partial update

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

// ==========================================
// REGISTER USER (Redirect to Login Flow)
// ==========================================

const registerUser = asyncHandler(async (req, res) => {
    console.log("Request received on register");
    
    const { name, email, password, role, skills, location, adminKey } = req.body;

    if (
        [name, email, password, role].some((field) => field?.trim() === "") ||
        !name || !email || !password || !role
    ) {
        throw new ApiError(400, "All required fields (name, email, password, role) must be provided");
    }

    // Admin Passkey Validation
    if (role === 'Admin' || role === 'Main') {
        const requiredKey = role === 'Admin' ? process.env.ADMIN_REGISTRATION_KEY : process.env.MAIN_REGISTRATION_KEY;
        if (!adminKey) {
            throw new ApiError(403, `${role} registration key is required`);
        }
        if (adminKey !== requiredKey) {
            throw new ApiError(403, `Invalid ${role} registration key`);
        }
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // --- Prepare Base User Data (Applies to ALL roles) ---
    const userData = {
        name,
        email,
        password,
        role
    };

    // --- Conditionally Add Volunteer Fields ---
    if (role === 'Volunteer') {
        let assignedCategory = 'Other';

        if (skills && skills.length > 0) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = `
                    Analyze these disaster relief volunteer skills: ${skills.join(", ")}.
                    Assign EXACTLY ONE category from this list: Medical, Rescue, Food & Water, Shelter, Sanitation, Labor, Transport, Supplies, Animal Rescue, Infrastructure, Other.
                    Reply with ONLY the exact category name. NO punctuation, NO markdown, NO extra words.
                `;

                const result = await model.generateContent(prompt);
                
                // 1. Get the raw text
                const rawResponse = result.response.text();
                
                // 🛠️ DEBUGGING: This will print exactly what Gemini sends back to your terminal!
                console.log("🤖 Gemini Raw Response ->", rawResponse); 

                // 2. Clean the response: Remove markdown (*), periods (.), newlines (\n), and trim spaces, then make lowercase
                const cleanResponse = rawResponse.replace(/[*.\n]/g, '').trim().toLowerCase();

                const validCategories = [
                    'Medical', 'Rescue', 'Food & Water', 'Shelter', 
                    'Sanitation', 'Labor', 'Transport', 'Supplies', 
                    'Animal Rescue', 'Infrastructure', 'Other'
                ];

                // 3. Do a case-insensitive search to find the matching category
                const matchedCategory = validCategories.find(
                    (category) => category.toLowerCase() === cleanResponse
                );

                if (matchedCategory) {
                    assignedCategory = matchedCategory;
                    console.log(`✅ Success: Assigned category '${assignedCategory}'`);
                } else {
                    console.log(`⚠️ Warning: Cleaned response '${cleanResponse}' did not match any category. Defaulting to 'Other'.`);
                }
                
            } catch (error) {
                // 🚨 If you see this in your terminal, your API Key is likely invalid or missing!
                console.error("❌ Gemini API Error:", error.message);
                // assignedCategory naturally falls back to 'Other'
            }
        }

        // Attach volunteer-specific data
        userData.skills = skills || [];
        userData.category = assignedCategory;
        userData.location = location || { type: 'Point', coordinates: [0, 0] };
        userData.isAvailable = true; // Volunteers start as available by default
    }

    // Create the user with the dynamically built object
    const user = await User.create(userData);

    if (!user) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(201)
        .json(
            new ApiResponse(
                201, 
                { user: createdUser }, 
                "User registered successfully. Please proceed to login."
            )
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Find user and explicitly request the password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Use your model's custom method
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Secure cookie options
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" // True in prod, false in local dev
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // Ensure the token matches what is stored in the database
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        };

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    // req.user is populated by your verifyJWT middleware
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } }, // Remove the refresh token from the database
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});
// ==========================================
// 4. GET CURRENT USER PROFILE
// ==========================================
// Because verifyJWT already finds the user and attaches it to req.user, 
// this is the easiest controller you will ever write!
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            req.user, 
            "User profile fetched successfully"
        ));
});

// ==========================================
// 5. UPDATE ACCOUNT DETAILS
// ==========================================
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name, skills, isAvailable, location } = req.body;
    
    // The user's role should be available via the auth middleware (e.g., verifyJWT)
    const userRole = req.user?.role; 

    // 1. Initialize the update object with fields applicable to ALL users
    const updateData = {};
    if (name) updateData.name = name;

    // 2. Handle Volunteer-Specific Fields
    if (userRole === 'Volunteer') {
        if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
        if (location) updateData.location = location;

        // If the volunteer is updating their skills, we MUST recalculate their category using Gemini
        if (skills && Array.isArray(skills)) {
            updateData.skills = skills;
            let assignedCategory = 'Other'; // Default fallback

            if (skills.length > 0) {
                try {
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                    const prompt = `
                        Analyze the following list of skills provided by a disaster relief volunteer: ${skills.join(", ")}.
                        Based on these skills, assign the volunteer to EXACTLY ONE of the following categories:
                        'Medical', 'Rescue', 'Food & Water', 'Shelter', 'Sanitation', 'Labor', 'Transport', 'Supplies', 'Animal Rescue', 'Infrastructure', 'Other'.
                        Respond with ONLY the category name. Do not include any extra text.
                    `;

                    const result = await model.generateContent(prompt);
                    const responseText = result.response.text().trim();

                    const validCategories = [
                        'Medical', 'Rescue', 'Food & Water', 'Shelter', 
                        'Sanitation', 'Labor', 'Transport', 'Supplies', 
                        'Animal Rescue', 'Infrastructure', 'Other'
                    ];

                    if (validCategories.includes(responseText)) {
                        assignedCategory = responseText;
                    }
                } catch (error) {
                    console.error("Gemini API Error during update:", error);
                    // If Gemini fails, it naturally falls back to 'Other'
                }
            }
            
            // Assign the new category to the update object
            updateData.category = assignedCategory;
        }
    }

    // 3. Find the user by the ID provided by the token and update them
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updateData },
        { new: true, runValidators: true } // 'new: true' returns the updated document
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    // 4. Send response
    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            { user: updatedUser }, 
            "Account details updated successfully"
        ));
});

// ==========================================
// 6. UPDATE PASSWORD
// ==========================================
const updateUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Both old and new passwords are required");
    }

    const user = await User.findById(req.user?._id).select("+password");

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    // Update password AND invalidate current session
    user.password = newPassword;
    user.refreshToken = undefined; // Kills all active sessions using this token
    
    await user.save(); // Enforces schema validation (minlength: 6)

    // Clear cookies on the client side to force them to log in again
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(
            200, 
            {}, 
            "Password updated successfully. Please log in again."
        ));
});

export {registerUser,loginUser,refreshAccessToken ,logoutUser,getCurrentUser,updateAccountDetails,updateUserPassword};