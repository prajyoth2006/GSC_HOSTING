import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { 
    toggleAvailability, 
    getAssignedTasks, 
    updateTaskStatus,
    getVolunteerHistory,
    addCompletionNote,
    escalateTask
} from "../controllers/volunteer.controller.js"; 

const router = Router();

router.use(verifyJWT);
router.use(authorizeRoles("Volunteer", "Admin")); 

// Route 1: Toggle availability
router.route("/availability").patch(toggleAvailability);

// Route 2: Get assigned tasks
router.route("/my-assignments").get(getAssignedTasks); 

// Route 3: Update task status 
// Notice the :taskId in the URL! This is a dynamic parameter.
router.route("/tasks/:taskId/status").patch(updateTaskStatus);

// Route 4: Get completed missions (History)
router.route("/history").get(getVolunteerHistory);

// Route 5: Add a field note to a task
router.route("/tasks/:taskId/note").patch(addCompletionNote);

// Route 6: SOS / Escalate a task back to the Admin
router.route("/tasks/:taskId/escalate").patch(escalateTask);

export default router;