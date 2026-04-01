import { Router } from "express";
import { getTriageTasks, getHardFilterCandidates , getSmartSortedCandidates, assignVolunteerToTask, unassignVolunteer} from '../controllers/dispatch.controller.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(verifyJWT);
router.use(authorizeRoles("Admin"));

// Route 1: Get the Triage Queue
// GET /api/v1/dispatch/triage
router.get('/triage', getTriageTasks);

// Route 2: The Hard Filter
// GET /api/v1/dispatch/:taskId/candidates/hard-filter
router.get('/:taskId/candidates/hard-filter', getHardFilterCandidates);

// Route 3: The Smart Sort
router.get('/:taskId/candidates/smart-sort', getSmartSortedCandidates);

// Route 4: Assign
router.patch('/:taskId/assign', assignVolunteerToTask);

// Route 5: Unassign (Undo)
router.patch('/:taskId/unassign', unassignVolunteer);

export default router;