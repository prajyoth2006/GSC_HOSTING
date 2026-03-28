import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Task } from "../models/task.model.js";

// 1. TOGGLE AVAILABILITY (Upgraded with Socket)
export const toggleAvailability = asyncHandler(async (req, res) => {
    // 1. Get the new status from the button press (true or false)
    const { isAvailable, coordinates } = req.body;

    if (typeof isAvailable !== "boolean") {
        throw new ApiError(400, "Invalid availability status.");
    }

    let updateFields = { isAvailable };

    // 2. If they are turning the button ON, we need their GPS
    if (isAvailable) {
        if (!coordinates || coordinates.length !== 2) {
            throw new ApiError(400, "GPS location is required to go online.");
        }
        updateFields.location = { 
            type: "Point", 
            coordinates: [coordinates[0], coordinates[1]] // [lng, lat]
        };
    }

    // 3. Update the database
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true, select: "-password" }
    );

    // 🟢 --- THE REAL-TIME SYNC ---
    // This tells the Admin Dashboard to move this user from "Offline" to "Online" 
    // or vice-versa the moment the button is pressed.
    const io = req.app.get("io");
    if (io) {
        io.emit("volunteerStatusChanged", {
            userId: updatedUser._id,
            fullName: updatedUser.fullName,
            isAvailable: updatedUser.isAvailable,
            location: updatedUser.location,
            skills: updatedUser.skills // Helpful for the Admin to see who just became available
        });
    }

    return res.status(200).json(
        new ApiResponse(200, updatedUser, `Status manually set to ${isAvailable ? "Available" : "Unavailable"}`)
    );
});

// 2. GET ASSIGNED TASKS (No Socket needed - Read only)
export const getAssignedTasks = asyncHandler(async (req, res) => {
    const tasks = await Task.find({ assignedVolunteer: req.user._id })
        .sort({ createdAt: -1 });

    const message = tasks.length > 0 
        ? "Assigned tasks fetched successfully" 
        : "You currently have no active assignments.";

    return res.status(200).json(
        new ApiResponse(200, tasks, message)
    );
});

// 3. UPDATE TASK STATUS (Upgraded with Socket)
export const updateTaskStatus = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["In Progress", "Completed"];
    if (!allowedStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status.");
    }

    const task = await Task.findOne({
        _id: taskId,
        assignedVolunteer: req.user._id
    });

    if (!task) {
        throw new ApiError(404, "Task not found or unauthorized.");
    }

    task.status = status;
    await task.save();

    // 🟢 SOCKET: Alert Admin that a task has moved from 'Assigned' to 'In Progress' or 'Completed'
    const io = req.app.get("io");
    if (io) {
        io.emit("taskStatusUpdated", {
            taskId: task._id,
            newStatus: status,
            volunteerName: req.user.fullName
        });
    }

    return res.status(200).json(
        new ApiResponse(200, task, `Status updated to: ${status}`)
    );
});

// 4. GET VOLUNTEER HISTORY (No Socket needed)
export const getVolunteerHistory = asyncHandler(async (req, res) => {
    const completedTasks = await Task.find({ 
        assignedVolunteer: req.user._id,
        status: "Completed" 
    }).sort({ updatedAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, completedTasks, "History fetched.")
    );
});

// 5. ADD COMPLETION NOTE (Upgraded with Socket)
export const addCompletionNote = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { note } = req.body;

    if (!note || note.trim() === "") {
        throw new ApiError(400, "Please provide a note.");
    }

    const task = await Task.findOne({
        _id: taskId,
        assignedVolunteer: req.user._id
    });

    if (!task || task.status !== "Completed") {
        throw new ApiError(400, "Unauthorized or task not completed.");
    }

    task.completionNote = note;
    await task.save();

    // 🟢 SOCKET: Send the final closing note to Admin dashboard instantly
    const io = req.app.get("io");
    if (io) {
        io.emit("taskNoteAdded", {
            taskId: task._id,
            completionNote: note
        });
    }

    return res.status(200).json(
        new ApiResponse(200, task, "Note added.")
    );
});

// 6. SOS / ESCALATE TASK (Critical Upgrade with Socket)
export const escalateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { reason } = req.body;

    const task = await Task.findOne({
        _id: taskId,
        assignedVolunteer: req.user._id
    });

    if (!task) throw new ApiError(404, "Task not found or unauthorized.");
    if (task.status === "Completed") throw new ApiError(400, "Cannot escalate completed task.");

    task.status = "Pending";
    task.severity = 5; 
    task.assignedVolunteer = null; 

    const timestamp = new Date().toLocaleString();
    task.rawReportText += `\n\n[🚨 ESCALATED ${timestamp}]: ${reason || "No reason provided"}`;

    await task.save();

    // 🟢 SOCKET: THE MOST CRITICAL ALERT
    // Moves the task back to the 'Pending' queue with max severity instantly
    const io = req.app.get("io");
    if (io) {
        io.emit("taskEscalated", {
            task: task,
            reason: reason,
            volunteerName: req.user.fullName
        });
    }

    return res.status(200).json(
        new ApiResponse(200, task, "Escalated successfully.")
    );
});