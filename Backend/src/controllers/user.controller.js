import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js"; 
import { ApiError } from "../utils/ApiError.js";         
import { ApiResponse } from "../utils/ApiResponse.js";   

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
    // 1. Extract data from request body
    console.log("Request received on register");
    const { name, email, password, role, skills, location } = req.body;

    // 2. Validate required fields
    if (
        [name, email, password, role].some((field) => field?.trim() === "") ||
        !name || !email || !password || !role
    ) {
        throw new ApiError(400, "All required fields (name, email, password, role) must be provided");
    }

    // 3. Check if user already exists
    const existedUser = await User.findOne({ email });
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // 4. Create the user object
    // (Password is automatically hashed by the pre-save hook in user.model.js)
    const user = await User.create({
        name,
        email,
        password,
        role,
        skills: role === 'Volunteer' ? skills : [],
        location: location || { type: 'Point', coordinates: [0, 0] }
    });

    // 5. Verify the user was successfully created
    if (!user) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // 6. Fetch the created user without the password and refresh token for the response
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    // 7. Send the structured success response (No Tokens Included)
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

    // We do not want to update passwords or emails here for security reasons.
    // Only update the fields the user actually sent in the request body.
    const updateData = {};
    if (name) updateData.name = name;
    if (skills) updateData.skills = skills;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (location) updateData.location = location;

    // Find the user by the ID provided by the token and update them
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updateData },
        { new: true, runValidators: true } // 'new: true' returns the updated document, not the old one
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            user, 
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

    // 1. Find the user and explicitly request the password field
    const user = await User.findById(req.user?._id).select("+password");

    // 2. Check if the old password matches
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    // 3. Update the password
    // CRITICAL: We MUST use user.save() here instead of findByIdAndUpdate.
    // If we don't use .save(), our user.model.js pre("save") hook won't trigger,
    // and the new password will be saved as plain text!
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            {}, 
            "Password updated successfully"
        ));
});

export {registerUser,loginUser,refreshAccessToken ,logoutUser,getCurrentUser,updateAccountDetails,updateUserPassword};