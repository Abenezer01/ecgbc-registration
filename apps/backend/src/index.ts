import express, { NextFunction, Request, Response } from "express";
import http from "http";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import consola from "consola";
import path from "path";
import { cleanEnv, port, str } from "envalid";
import "dotenv/config";
// import "reflect-metadata";

import { errorController } from "./app/config/error.config";
import AppError from "./app/shared/errors/app.error";

/*Routes */
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

const env = cleanEnv(process.env, {
  PORT: port(),
  NODE_ENV: str(),
});

/**
 * Connect to database
 */

const app = express();

/**
 * Global Middlewares
 */

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// --- PUBLIC ROUTES (Bypass strict global CORS) ---
const publicCorsOptions = { origin: "*", methods: ["GET", "POST", "OPTIONS"] };
app.use("/api/v1/name-reservations/public", cors(publicCorsOptions));
app.options("/api/v1/name-reservations/public/*", cors(publicCorsOptions));
// We map the actual routes for this inside the router later, but doing this applies the open CORS headers first

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
};
app.use(cors(corsOptions));
// Handle all OPTIONS preflight requests globally (required for CORS to work)
app.options("*", cors(corsOptions));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

/**
 * REST API Route Middleware
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
app.use("/api/v1/action-states", actionStateRouter);
app.use("/api/v1/name-reservations", nameReservationRouter);

/**
 * Non existing url middleware
 */

app.use("*", (req: Request, res: Response, next: NextFunction) => {
  return next(
    new AppError(`Can't find ${req.originalUrl} on the server!!`, 404)
  );
});

/**
 * Error middleware controller
 */
app.use(errorController);

/**
 * Start the server
 */

const PORT = env.PORT;
app.listen(PORT, '0.0.0.0', () => {
  consola.success(`Server running on port ${PORT} and listening on 0.0.0.0`);
});
