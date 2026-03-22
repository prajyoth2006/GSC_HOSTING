import { ApiError } from "../utils/ApiError.js";

// We use the spread operator (...) so you can pass as many roles as you want
// Example: authorizeRoles("Admin", "Worker")
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        
        // 1. Safety Check: Ensure verifyJWT ran first and attached the user
        if (!req.user) {
            return next(new ApiError(401, "Unauthorized request. Please log in first."));
        }

        // 2. Check if the user's role is included in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new ApiError(
                    403, 
                    `Forbidden: Your role (${req.user.role}) is not allowed to access this resource.`
                )
            );
        }

        // 3. If they pass the check, let them move on to the controller!
        next();
    };
};