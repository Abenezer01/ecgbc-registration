import express, { NextFunction, Request, Response } from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import consola from "consola";
import path from "path";
import { cleanEnv, port, str } from "envalid";
import "dotenv/config";

import { errorController } from "./app/config/error.config";
import AppError from "./app/shared/errors/app.error";

/* Middlewares */
import { publicRegistrationRateLimiter } from "./app/shared/middlewares/rate-limit.middleware";
import {
  authenticateFileAccess,
  serveProtectedFile,
} from "./app/shared/middlewares/file-auth.middleware";

/* Routes */
import authRouter from "./app/features/auth/auth.route";
import permissionRouter from "./app/features/permission/permission.route";
import roleRouter from "./app/features/role/role.route";
import staffRouter from "./app/features/staff/staff.route";
import dataLookupRouter from "./app/features/data-lookup/data-lookup.route";
import councilFellowshipRouter from "./app/features/council-fellowship/fellowship.route";
import councilFellowshipListRouter from "./app/features/council-fellowship/fellowship-list.route";
import membersRouter from "./app/features/member/member.route";
import reportsRouter from "./app/features/report/report.route";
import reportRequestsRouter from "./app/features/report/report-request.route";
import filesRouter from "./app/features/file/file.route";
import analyticsRouter from "./app/features/analytics/analytics.route";
import churchAuthRouter from "./app/features/church-auth/church-auth.route";
import churchUserRouter from "./app/features/church-user/church-user.route";
import churchPortalRouter from "./app/features/church-portal/church-portal.route";
import financeRouter from "./app/features/finance/finance.route";
import activityRouter from "./app/features/activity/activity.route";
import actionStateRouter from "./app/features/action-state/action-state.route";
import nameReservationRouter from "./app/features/name-reservation/name-reservation.route";
import registrationRequestRouter from "./app/features/registration-request/registration-request.route";
import externalApiRouter from "./app/features/external-api/external-api.route";
import apiKeyRouter from "./app/features/api-key/api-key.route";

const env = cleanEnv(process.env, {
  PORT: port(),
  NODE_ENV: str(),
});

const app = express();
app.set("trust proxy", 1);

/**
 * 1. Security Headers (Helmet)
 */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // APIs return JSON / ReDoc docs
    frameguard: { action: "deny" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

/**
 * 2. Logging & Compression
 */
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(compression());

/**
 * 3. Strict CORS Configuration
 */
const defaultAllowedOrigins = [
  "https://registration.ecgbc.org",
  "https://mychurch.ecgbc.org",
  "https://staging-registration.ecgbc.org",
  "https://staging-mychurch.ecgbc.org",
  ...(env.NODE_ENV === "development"
    ? [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
      ]
    : []),
];

const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

const allowedOriginsSet = new Set([...defaultAllowedOrigins, ...envAllowedOrigins]);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser agents (cURL, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOriginsSet.has(origin)) {
      return callback(null, true);
    }
    return callback(
      new AppError(`CORS policy violation: Origin '${origin}' is not allowed.`, 403)
    );
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-API-Key",
    "X-Requested-With",
    "Accept",
  ],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// External API CORS (Accessible with API Key, without credentials)
const externalCorsOptions: cors.CorsOptions = {
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  credentials: false,
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
};
app.use("/api/v1/external", cors(externalCorsOptions));
app.options("/api/v1/external/*", cors(externalCorsOptions));

/**
 * 4. Body Parsers
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * 5. Static Assets & Confidential File Access Control
 */
// Public non-sensitive assets (logos, certificate templates, public fonts, avatars)
app.use("/images", express.static(path.join(__dirname, "../public/images")));
app.use("/fonts", express.static(path.join(__dirname, "../public/fonts")));

// Protected Confidential Files (requires Bearer token in header or 'token' query param)
app.get("/files/:type/:filename", authenticateFileAccess, serveProtectedFile);
app.get("/uploads/:type/:filename", authenticateFileAccess, (req, res, next) => {
  // Normalize types: 'files' -> 'file', 'reports' -> 'report'
  const normalizedType = req.params.type.replace(/s$/, "");
  req.params.type = normalizedType;
  return serveProtectedFile(req, res, next);
});

/**
 * 6. REST API Routes
 */
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/permission", permissionRouter);
app.use("/api/v1/role", roleRouter);
app.use("/api/v1/staff", staffRouter);
app.use("/api/v1/data-lookups", dataLookupRouter);
app.use("/api/v1/council-fellowship", councilFellowshipRouter);
app.use("/api/v1/council-fellowship-list", councilFellowshipListRouter);
app.use("/api/v1/members", membersRouter);
app.use("/api/v1/reports", reportsRouter);
app.use("/api/v1/report-requests", reportRequestsRouter);
app.use("/api/v1/files", filesRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/church-auth", churchAuthRouter);
app.use("/api/v1/church-users", churchUserRouter);
app.use("/api/v1/church-portal", churchPortalRouter);
app.use("/api/v1/finance", financeRouter);
app.use("/api/v1/logs", activityRouter);
app.use(
  "/api/v1/name-reservations",
  nameReservationRouter
);
app.use(
  "/api/v1/registration-requests",
  registrationRequestRouter
);
app.use("/api/v1/action-states", actionStateRouter);
app.use("/api/v1/external", externalApiRouter);
app.use("/api/v1/api-keys", apiKeyRouter);

/**
 * 7. Non-existing URL middleware
 */
app.use("*", (req: Request, res: Response, next: NextFunction) => {
  return next(new AppError(`Can't find ${req.originalUrl} on the server!`, 404));
});

/**
 * 8. Central Error Handling Controller
 */
app.use(errorController);

/**
 * 9. Server Initialization & Cron
 */
import cron from "node-cron";
import { runExpiringFilesNotificationJob } from "./scripts/notify-expiring-files";

const PORT = env.PORT;
app.listen(PORT, "0.0.0.0", () => {
  consola.success(`Server running on port ${PORT} and listening on 0.0.0.0`);

  // Expiring files notification job runs daily at 8:00 AM
  cron.schedule("0 8 * * *", () => {
    consola.info("Cron Triggered: Running expiring files notification job...");
    runExpiringFilesNotificationJob().catch((err) => {
      consola.error("Error running expiring files notification job:", err);
    });
  });
  consola.info("Cron scheduled: Expiring files notification job will run daily at 8:00 AM.");
});
