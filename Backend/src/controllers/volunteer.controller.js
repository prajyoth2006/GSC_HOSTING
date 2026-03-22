import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Task } from "../models/task.model.js";

// location availablty
export const toggleAvailability = asyncHandler(async (req, res) => {
    // 1. Get the new status and exact GPS coordinates from the frontend
    const { isAvailable, coordinates } = req.body;

    if (typeof isAvailable !== "boolean") {
        throw new ApiError(400, "Please provide a valid true/false for isAvailable");
    }

    // 2. Prepare the update object
    let updateFields = { isAvailable };

    // 3. If they are going on-duty, the frontend will send their current GPS coordinates
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
        updateFields.location = {
            type: "Point",
            coordinates: coordinates // Must be [Longitude, Latitude]
        };
    }

    // 4. Update the user in the database (req.user._id comes from verifyJWT)
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true, select: "-password" } // Return updated user, hide password
    );

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    const message = isAvailable 
        ? "You are now online and your location has been updated." 
        : "You are now offline. Get some rest!";

    return res.status(200).json(
        new ApiResponse(200, updatedUser, message)
    );
});

// get assigned tasks for the volunteer
export const getAssignedTasks = asyncHandler(async (req, res) => {
    // Search the database for any task where this user's ID is the assigned volunteer
    const tasks = await Task.find({ assignedVolunteer: req.user._id })
        .sort({ createdAt: -1 }); // Sort by newest first

    const message = tasks.length > 0 
        ? "Assigned tasks fetched successfully" 
        : "You currently have no active assignments. Stand by.";

    return res.status(200).json(
        new ApiResponse(200, tasks, message)
    );
});

// update task status
export const updateTaskStatus = asyncHandler(async (req, res) => {
    // 1. Get the Task ID from the URL and the new status from the body
    const { taskId } = req.params;
    const { status } = req.body;

    // 2. Security Check: Volunteers should only be able to set these two statuses
    const allowedStatuses = ["In Progress", "Completed"];
    if (!allowedStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status. Volunteers can only set status to 'In Progress' or 'Completed'.");
    }

    // 3. Find the task. CRITICAL: We also check `assignedVolunteer: req.user._id` 
    // to ensure a volunteer cannot hack the URL and close someone else's task!
    const task = await Task.findOne({
        _id: taskId,
        assignedVolunteer: req.user._id
    });

    if (!task) {
        throw new ApiError(404, "Task not found, or you are not authorized to update this task.");
    }

    // 4. Update the status and save it
    task.status = status;
    await task.save();

    // 5. Send success response back to the frontend
    return res.status(200).json(
        new ApiResponse(200, task, `Mission status successfully updated to: ${status}`)
    );
});

//volunteers history
export const getVolunteerHistory = asyncHandler(async (req, res) => {
    // Search for tasks assigned to this user that are ONLY marked as "Completed"
    const completedTasks = await Task.find({ 
        assignedVolunteer: req.user._id,
        status: "Completed" 
    }).sort({ updatedAt: -1 }); // Sort by most recently completed

    const message = completedTasks.length > 0 
        ? `You have successfully completed ${completedTasks.length} missions!` 
        : "You haven't completed any missions yet. Your history will appear here.";

    return res.status(200).json(
        new ApiResponse(200, completedTasks, message)
    );
});

// ADD A FIELD NOTE / CLOSING REPORT
export const addCompletionNote = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { note } = req.body;

    if (!note || note.trim() === "") {
        throw new ApiError(400, "Please provide a note to save.");
    }

    // 1. Find the task assigned to this exact volunteer
    const task = await Task.findOne({
        _id: taskId,
        assignedVolunteer: req.user._id
    });

    // 2. Check if the task exists and belongs to them
    if (!task) {
        throw new ApiError(404, "Task not found or you are not authorized to add a note to it.");
    }

    // 3. THE FIX: Check if the task is actually completed!
    if (task.status !== "Completed") {
        throw new ApiError(400, "You can only add a closing note to a task after it has been marked as 'Completed'.");
    }

    // 4. Add the note and save
    task.completionNote = note;
    await task.save();

    return res.status(200).json(
        new ApiResponse(200, task, "Field note successfully added to the task.")
    );
});

// SOS / ESCALATE TASK
export const escalateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { reason } = req.body; // Optional: Why they are escalating it

    // 1. Find the task assigned to this exact volunteer
    const task = await Task.findOne({
        _id: taskId,
        assignedVolunteer: req.user._id
    });

    if (!task) {
        throw new ApiError(404, "Task not found or you are not authorized to escalate it.");
    }

    // 2. We don't want them escalating a task they already finished!
    if (task.status === "Completed") {
        throw new ApiError(400, "Cannot escalate a completed task.");
    }

    // 3. Perform the Escalation Logic
    task.status = "Pending"; // Send it back to the Admin's queue
    task.severity = 5;       // Bump to maximum Critical severity
    task.assignedVolunteer = null; // Unassign the current volunteer

    // 4. If they provided a reason, prepend it to the raw report text so the Admin sees it immediately
    if (reason) {
        task.rawReportText = `[🚨 ESCALATED SOS]: ${reason}\n\n--- Original Report ---\n${task.rawReportText}`;
    }

    await task.save();

    return res.status(200).json(
        new ApiResponse(200, task, "Task escalated successfully. Admin has been notified and you have been unassigned.")
    );
});