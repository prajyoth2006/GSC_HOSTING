import { User } from "../models/user.model.js";
import { Task } from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
});