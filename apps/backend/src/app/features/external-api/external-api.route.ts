import express from "express";
import {
  verifyApiKey,
  requireScope,
} from "./middlewares/api-key.middleware";
import { createExternalRateLimiter } from "./middlewares/rate-limiter.middleware";
import * as ExternalMemberController from "./controllers/external-member.controller";
import * as ExternalLookupController from "./controllers/external-lookup.controller";
import { openapiSpec } from "./docs/openapi.spec";

const router = express.Router();

// Initialize rate limiter
const rateLimiter = createExternalRateLimiter();

// -------------------------------------------------------------
// Public Documentation & Schema (No API Key Required)
// -------------------------------------------------------------
router.get("/docs/spec.json", (req, res) => {
  return res.status(200).json(openapiSpec);
});

// Interactive Swagger UI (Default)
router.get("/docs", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  const specJson = JSON.stringify(openapiSpec);
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ECGBC External API Documentation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/favicon-32x32.png" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .topbar { display: none !important; }
    .custom-header {
      background: #0f172a;
      color: #ffffff;
      padding: 0.875rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .custom-header h1 { margin: 0; font-size: 1.15rem; font-weight: 700; letter-spacing: -0.01em; }
    .custom-header a {
      color: #60a5fa;
      text-decoration: none;
      font-size: 0.8125rem;
      margin-left: 1.25rem;
      font-weight: 500;
      transition: color 0.15s ease;
    }
    .custom-header a:hover { color: #93c5fd; text-decoration: underline; }
    .swagger-ui .wrapper { max-width: 1200px; padding: 0 1.5rem; }
  </style>
</head>
<body>
  <div class="custom-header">
    <div>
      <h1>ECGBC Members External REST API</h1>
      <span style="font-size: 0.75rem; color: #94a3b8;">Interactive Developer Console & Specification</span>
    </div>
    <div>
      <a href="/api/v1/external/docs/spec.json" target="_blank" download="openapi.json">Raw JSON Spec</a>
      <a href="/api/v1/external/docs/redoc">Redoc View</a>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const spec = ${specJson};
      window.ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        docExpansion: "list",
        defaultModelsExpandDepth: 2,
      });
    };
  </script>
</body>
</html>`);
});

// Redoc Layout View
router.get("/docs/redoc", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  const specJson = JSON.stringify(openapiSpec);
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
    <div id="redoc-container"></div>
    <script src="https://cdn.jsdelivr.net/npm/redoc@2.1.5/bundles/redoc.standalone.js"></script>
    <script>
      const spec = ${specJson};
      Redoc.init(spec, {
        scrollYOffset: 0,
        expandResponses: "200,201",
        theme: {
          colors: {
            primary: { main: '#2563eb' }
          }
        }
      }, document.getElementById('redoc-container'));
    </script>
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
