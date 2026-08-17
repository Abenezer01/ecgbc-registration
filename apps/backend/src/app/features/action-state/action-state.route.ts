import { Router } from "express";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";
import { getActionStates, createActionState } from "./action-state.controller";

const router = Router();

router.use(StaffAuthMiddleware.verifyStaff);

// GET /api/v1/action-states?entityType=MEMBER&entityId=xxx
router.get("/", getActionStates);

// POST /api/v1/action-states
router.post("/", createActionState);

export default router;
