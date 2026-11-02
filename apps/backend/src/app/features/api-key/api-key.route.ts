import express from "express";
import * as ApiKeyController from "./controllers/api-key.controller";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";

const router = express.Router();

router.use(StaffAuthMiddleware.verifyStaff);

router
  .route("/")
  .get(ApiKeyController.listApiKeys)
  .post(ApiKeyController.createApiKey);

router
  .route("/:id")
  .patch(ApiKeyController.updateApiKey)
  .delete(ApiKeyController.deleteApiKey);

router.post("/:id/regenerate", ApiKeyController.regenerateApiKey);

export default router;
