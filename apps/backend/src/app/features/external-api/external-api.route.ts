import express from "express";
import path from "path";
import fs from "fs";
import {
  verifyApiKey,
  requireScope,
} from "./middlewares/api-key.middleware";
import { createExternalRateLimiter } from "./middlewares/rate-limiter.middleware";
import * as ExternalMemberController from "./controllers/external-member.controller";
import * as ExternalLookupController from "./controllers/external-lookup.controller";

const router = express.Router();

// Initialize rate limiter
const rateLimiter = createExternalRateLimiter();

// -------------------------------------------------------------
// Public Documentation & Schema (No API Key Required)
// -------------------------------------------------------------
router.get("/docs/spec.json", (req, res) => {
  const specPath = path.join(__dirname, "docs", "openapi.json");
  if (fs.existsSync(specPath)) {
    const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
    return res.status(200).json(spec);
  }
  return res.status(404).json({ status: "error", message: "OpenAPI specification not found." });
});

router.get("/docs", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html>
  <head>
    <title>ECGBC External API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <redoc spec-url='/api/v1/external/docs/spec.json'></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc@2.1.5/bundles/redoc.standalone.js"> </script>
  </body>
</html>`);
});

// -------------------------------------------------------------
// Authenticated & Rate-Limited External Endpoints
// -------------------------------------------------------------
router.use(verifyApiKey);
router.use(rateLimiter);

// Lookup metadata
router.get(
  "/metadata/lookups",
  requireScope("members:read"),
  ExternalLookupController.getMetadataLookups
);

// Member endpoints
router.get(
  "/members",
  requireScope("members:read"),
  ExternalMemberController.listMembers
);

router.get(
  "/members/verify/:certificateNo",
  requireScope("members:verify"),
  ExternalMemberController.verifyCertificate
);

router.get(
  "/members/by-certificate/:certificateNo",
  requireScope("members:read"),
  ExternalMemberController.getMemberByCertificate
);

router.get(
  "/members/:id",
  requireScope("members:read"),
  ExternalMemberController.getMemberById
);

export default router;
