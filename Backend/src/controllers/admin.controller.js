import { User } from "../models/user.model.js";
import { Task } from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const getSystemDashboard = asyncHandler(async (req, res) => {
    // 1. Run all queries concurrently for maximum performance
    const [
        pendingCount, 
        inProgressCount, 
        completedCount,
        matchedCount,
        cancelledCount,
        availableVolunteers, 
        offlineVolunteers,
        totalWorkers,        
        criticalTasks,       
        categoryBreakdownRaw,
        allTasksSortedRaw // Changed name here to represent raw data
    ] = await Promise.all([
        Task.countDocuments({ status: "Pending" }),
        Task.countDocuments({ status: "In Progress" }),
        Task.countDocuments({ status: "Completed" }),
        Task.countDocuments({ status: "Matched"}),
        Task.countDocuments({ status: "Cancelled"}),
        User.countDocuments({ role: "Volunteer", isAvailable: true }),
        User.countDocuments({ role: "Volunteer", isAvailable: false }),
        
        // NEW STAT 1: Total Field Workers
        User.countDocuments({ role: "Worker" }), 
        
        // NEW STAT 2: Critical active tasks (Severity 5, not finished)
        Task.countDocuments({ severity: 5, status: { $nin: ["Completed", "Cancelled"] } }),
        
        // NEW STAT 3: Category Breakdown
        Task.aggregate([
            { $match: { status: { $nin: ["Completed", "Cancelled"] } } }, 
            { $group: { _id: "$category", count: { $sum: 1 } } },         
            { $sort: { count: -1 } }                                      
        ]),

        // MASTER LIST: Fetch all tasks with advanced sorting
        Task.aggregate([
            {
                $addFields: {
                    statusWeight: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "In Progress"] }, then: 1 },
                                { case: { $eq: ["$status", "Pending"] }, then: 2 },
                                { case: { $eq: ["$status", "Completed"] }, then: 3 },
                                { case: { $eq: ["$status", "Matched"] }, then: 4 },
                                { case: { $eq: ["$status", "Cancelled"]}, then: 5}
                            ],
                            default: 6
                        }
                    }
                }
            },
            { $sort: { statusWeight: 1, severity: -1, category: 1, createdAt: -1 } },
            { $project: { statusWeight: 0 } } 
        ])
    ]);

    // 2. NEW STEP: Populate the human names into the aggregated tasks
    const allTasksSorted = await Task.populate(allTasksSortedRaw, [
        { path: "reportedBy", select: "name" },
        { path: "assignedVolunteer", select: "name" }
    ]);

    const activeCategories = {};
    categoryBreakdownRaw.forEach(cat => {
        if (cat._id) activeCategories[cat._id] = cat.count;
    });

    const dashboardData = {
        stats: {
            tasks: {
                pending: pendingCount,
                inProgress: inProgressCount,
                completed: completedCount,
                matched: matchedCount,
                cancelled: cancelledCount,
                criticalActive: criticalTasks,
                total: pendingCount + inProgressCount + completedCount + matchedCount + cancelledCount
            },
            activeCategories: activeCategories,
            personnel: {
                volunteersOnline: availableVolunteers,
                volunteersOffline: offlineVolunteers,
                totalVolunteers: availableVolunteers + offlineVolunteers,
                totalWorkers: totalWorkers
            }
        },
        taskList: allTasksSorted // Now contains populated names!
    };

    const io = req.app.get("io");
    if (io) {
        io.emit("dashboardSynced", {
            syncedBy: req.user.name,
            timestamp: new Date(),
            summary: {
                totalActiveTasks: pendingCount + inProgressCount + matchedCount,
                onlineVolunteers: availableVolunteers
            }
        });
        console.log(`📡 Dashboard sync broadcasted by Admin: ${req.user.name}`);
    }

    return res.status(200).json(
        new ApiResponse(200, dashboardData, "Ultimate dashboard stats fetched and synced successfully")
    );
});

// ==========================================
// ADMIN: GET ALL USERS FILTERED BY ROLE
// ==========================================
export const getUsersByRole = asyncHandler(async (req, res) => {
    // 1. Get the role and availability from the query string
    // Example: /api/v1/admin/users?role=Volunteer&isAvailable=true
    const { role, isAvailable } = req.query;

    const query = {};

    // 2. Build the query based on what the Admin wants to see
    if (role) {
        query.role = role;
    }

    if (isAvailable !== undefined) {
        query.isAvailable = isAvailable === "true";
    }

    // 3. Fetch users, hiding sensitive data
    // We sort alphabetically by name for a clean UI list
    const users = await User.find(query)
        .select("-password -refreshToken")
        .sort({ name: 1 });

    return res.status(200).json(
        new ApiResponse(
            200, 
            users, 
            `${role || "User"} directory fetched successfully.`
        )
    );
});

// ==========================================
// ADMIN: GET SPECIFIC USER PROFILE & FULL HISTORY
// ==========================================
export const getUserProfileWithDetails = asyncHandler(async (req, res) => {
    // 1. Get the ID from the URL params: /api/v1/admin/users/:userId
    const { userId } = req.params;

    // 2. Fetch the user's profile (excluding password)
    const user = await User.findById(userId).select("-password -refreshToken");
    
    if (!user) {
        throw new ApiError(404, "User not found in the system.");
    }

    let historyData = {};

    // 3. Logic for VOLUNTEERS: Show missions they are doing or have finished
    if (user.role === "Volunteer") {
        const allAssignedTasks = await Task.find({ assignedVolunteer: userId })
            .sort({ updatedAt: -1 });

        historyData = {
            counts: {
                completed: allAssignedTasks.filter(t => t.status === "Completed").length,
                active: allAssignedTasks.filter(t => t.status === "In Progress").length
            },
            // We send the whole task data objects so the frontend can show details instantly
            tasks: allAssignedTasks 
        };
    } 
    
    // 4. Logic for FIELD WORKERS: Show every crisis they have reported
    else if (user.role === "Worker") {
        const reportedTasks = await Task.find({ reportedBy: userId })
            .sort({ createdAt: -1 });

        historyData = {
            counts: {
                totalReported: reportedTasks.length
            },
            tasks: reportedTasks // Every task this worker created
        };
    }

    // 5. Send the combined response
    return res.status(200).json(
        new ApiResponse(
            200, 
            { profile: user, history: historyData }, 
            "User profile and detailed history fetched successfully"
        )
    );
});

// ==========================================
// ADMIN: CANCEL A TASK (False Alarms / Duplicates)
// ==========================================
export const cancelTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { reason } = req.body; // Optional: Why was it cancelled?

    // 1. Find the task
    const task = await Task.findById(taskId);

    if (!task) {
        throw new ApiError(404, "Task not found.");
    }

    // 2. Prevent cancelling if already finished
    if (task.status === "Completed") {
        throw new ApiError(400, "Cannot cancel a task that is already completed.");
    }

    // 3. Update status and add a note
    task.status = "Cancelled";
    if (reason) {
        task.completionNote = `[CANCELLED BY ADMIN]: ${reason}`;
    }

    // If there was a volunteer assigned, we should unassign them too
    task.assignedVolunteer = null;

    await task.save();

    // 🟢 --- SOCKET.IO REAL-TIME REMOVAL ---
    const io = req.app.get("io");
    if (io) {
        // We tell the frontend exactly which ID to remove from the list
        io.emit("taskCancelled", {
            taskId: task._id,
            title: task.title,
            cancelledBy: req.user.name 
        });
        console.log(`📡 Task ${taskId} cancelled and broadcasted.`);
    }

    return res.status(200).json(
        new ApiResponse(200, task, "Task has been successfully cancelled and removed from active lists.")
    );
});

// ==========================================
// ADMIN: MANUAL TASK CORRECTION (Edit Task)
// ==========================================
export const updateTaskDetails = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    
    // 1. Get the fields the Admin wants to fix
    const { 
        title, 
        category, 
        severity, 
        locationDescription, 
        requiredSkills 
    } = req.body;

    // 2. Find the task in the database
    const task = await Task.findById(taskId);

    if (!task) {
        throw new ApiError(404, "Task not found in the system.");
    }

    // 3. Update only the fields that were actually sent in the request
    if (title) task.title = title;
    if (category) task.category = category;
    if (severity) task.severity = Number(severity);
    if (locationDescription) task.locationDescription = locationDescription;
    if (requiredSkills) task.requiredSkills = requiredSkills;

    // 4. Save the corrected task
    await task.save();

    // 🟢 --- SOCKET.IO REAL-TIME UPDATE ---
    const io = req.app.get("io");
    if (io) {
        // We broadcast the updated task so ALL Admin dashboards 
        // update the UI instantly without a refresh.
        io.emit("taskUpdatedByAdmin", {
            taskId: task._id,
            updatedData: { 
                title: task.title, 
                category: task.category, 
                severity: task.severity 
            },
            adminName: req.user.name // Using .name as per your model
        });
        console.log(`📡 Task ${taskId} corrected by ${req.user.name}`);
    }

    return res.status(200).json(
        new ApiResponse(200, task, "Task details have been manually corrected by Admin.")
    );
})

const ALLOWED_CATEGORIES = [
    'Medical', 'Rescue', 'Food & Water', 'Shelter', 
    'Sanitation', 'Labor', 'Transport', 'Supplies', 
    'Animal Rescue', 'Infrastructure', 'Other'
];

export const createNewTask = asyncHandler(async (req, res) => {
    const { 
        title, 
        rawReportText, 
        category, 
        severity, 
        locationDescription, 
        longitude, 
        latitude, 
        requiredSkills 
    } = req.body;

    // 1. Basic Field Validation
    if (!title || !rawReportText || !category || !severity || !longitude || !latitude) {
        throw new ApiError(400, "All required fields must be provided, including coordinates.");
    }

    // 2. STRICT CATEGORY VALIDATION (Crucial for the matching engine)
    if (!ALLOWED_CATEGORIES.includes(category)) {
        throw new ApiError(400, `Invalid category '${category}'. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
    }

    // 3. Create the Task
    const newTask = await Task.create({
        title,
        rawReportText,
        category,
        severity,
        requiredSkills: requiredSkills || [],
        locationDescription,
        location: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)] 
        },
        reportedBy: req.user._id, // Set the Admin as the reporter
        status: "Pending" // Starts as pending until the matching engine picks it up
    });

    // 4. Send Response
    return res.status(201).json(
        new ApiResponse(201, newTask, "Task successfully created and is ready for matching.")
    );
});

export const updateUserRole = asyncHandler(async(req, res) => {
    const { userId } = req.params;
    const { adminKey, role, category, skills, location } = req.body;

    // 1. Security Check
    if (adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
        throw new ApiError(403, "Admin Key incorrect or missing");
    }

    // 2. Strict Role Restriction: Only Worker <-> Volunteer
    if (!["Worker", "Volunteer"].includes(role)) {
        throw new ApiError(400, "This route is only for switching between Worker and Volunteer");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // 3. Admin Protection: Cannot touch Admin accounts here
    if (user.role === "Admin") {
        throw new ApiError(403, "Admin roles cannot be modified through this route");
    }

    // 4. Redundancy Check: Don't update if already in that role
    if (user.role === role) {
        throw new ApiError(400, `User is already registered as a ${role}`);
    }

    // 5. Data Handling for Transitions
    if (role === "Volunteer") {
        // Use the global ALLOWED_CATEGORIES constant for validation
        if (!category) {
            throw new ApiError(400, "Category is required to register as a Volunteer");
        }

        if (!ALLOWED_CATEGORIES.includes(category)) {
            throw new ApiError(400, `Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(", ")}`);
        }

        user.category = category;
        user.skills = skills || [];
        
        // Handle GeoJSON Location structure
        if (location && location.coordinates) {
            user.location = {
                type: "Point",
                coordinates: location.coordinates 
            };
        }
        user.isAvailable = true;
    } else {
        // Transition to Worker: Clean up all Volunteer-specific fields
        user.category = undefined;
        user.skills = [];
        user.location = undefined;
    }

    // Apply role change
    user.role = role;

    // 6. Save and Return
    await user.save();

    const updatedUser = await User.findById(userId).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, updatedUser, `User successfully transitioned to ${role}`)
    );
});