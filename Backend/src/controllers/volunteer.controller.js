import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Task } from "../models/task.model.js";

// location availablty
export const toggleAvailability = asyncHandler(async (req, res) => {
    const { isAvailable, coordinates } = req.body;

    if (typeof isAvailable !== "boolean") {
        throw new ApiError(400, "Please provide a valid true/false status");
    }

    let updateFields = { isAvailable };

    if (isAvailable) {
        // Validation: Must have coordinates to go online
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
            throw new ApiError(400, "GPS coordinates are required to go online.");
        }

        // GIS Validation: Ensure numbers are within global bounds
        const [lng, lat] = coordinates;
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
            throw new ApiError(400, "Invalid GPS coordinates provided.");
        }

        updateFields.location = { type: "Point", coordinates: [lng, lat] };
    } else {
        // Optional: If offline, we might want to keep the last known location
        // or set it to null so they disappear from "Live Maps" entirely.
        // updateFields.location = null; 
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true, select: "-password" }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedUser, isAvailable ? "Online" : "Offline")
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
    const { reason } = req.body;

    const task = await Task.findOne({
        _id: taskId,
        assignedVolunteer: req.user._id
    });

    if (!task) throw new ApiError(404, "Task not found or unauthorized.");
    if (task.status === "Completed") throw new ApiError(400, "Cannot escalate a finished task.");

    // Resetting for the next volunteer
    task.status = "Pending";
    task.severity = 5; 
    task.assignedVolunteer = null; 

    // Use a specific field for escalation notes if you have it, 
    // otherwise, your prepending method is fine but let's make it cleaner:
    const timestamp = new Date().toLocaleString();
    task.rawReportText += `\n\n[🚨 ESCALATED ${timestamp}]: ${reason || "No reason provided"}`;

    await task.save();

    return res.status(200).json(
        new ApiResponse(200, task, "Task escalated to Admin.")
    );
});