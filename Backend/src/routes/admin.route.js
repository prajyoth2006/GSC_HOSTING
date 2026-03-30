import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { getSystemDashboard , getUsersByRole, getUserProfileWithDetails, cancelTask, updateTaskDetails} from "../controllers/admin.controller.js";

const router = Router();

// Secure all admin routes
router.use(verifyJWT);
router.use(authorizeRoles("Admin"));

// GET: /api/v1/admin/dashboard-stats
router.route("/dashboard-stats").get(getSystemDashboard);

// GET: /api/v1/admin/users?role=Volunteer
// How to test this:

// To see all Volunteers: GET /api/v1/admin/users?role=Volunteer

// To see only the Workers: GET /api/v1/admin/users?role=Worker

// To see "Available" Volunteers: GET /api/v1/admin/users?role=Volunteer&isAvailable=true
router.route("/users").get(getUsersByRole)

// GET: /api/v1/admin/users/userID...
router.route("/users/:userId").get(getUserProfileWithDetails);

//cancel task
router.route("/tasks/:taskId/cancel").patch(cancelTask);

// PATCH: /api/v1/admin/tasks/:taskId/update
router.route("/tasks/:taskId/update").patch(updateTaskDetails);


export default router;