import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import path from "path";
import fs from "fs";
import AppError from "../errors/app.error";

/**
 * Middleware to authenticate requests for sensitive documents (reports, registration attachments)
 * Accepts JWT in Authorization header or in 'token' query parameter (for direct browser tab downloads).
 */
export const authenticateFileAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token: string | null = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (typeof req.query.token === "string" && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return next(
      new AppError(
        "Unauthorized: Authentication token required to access confidential files",
        401
      )
    );
  }

  const jwtSecret = process.env.JWT_ACCESS_SECRET_KEY;
  if (!jwtSecret) {
    return next(
      new AppError("Internal server error: JWT secret key not configured", 500)
    );
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    (req as any).user = decoded;
    return next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Authentication token has expired", 401));
    }
    return next(new AppError("Invalid authentication token", 401));
  }
};

/**
 * Controller to securely stream protected files with strict path traversal prevention
 */
export const serveProtectedFile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { type, filename } = req.params;

  // Validate type
  if (type !== "file" && type !== "report") {
    return next(new AppError("Invalid file type specified", 400));
  }

  // Sanitize filename to eliminate any directory traversal attacks (../, null bytes)
  const safeFilename = path.basename(filename);
  if (!safeFilename || safeFilename !== filename) {
    return next(new AppError("Invalid filename provided", 400));
  }

  const baseDir = path.join(__dirname, "../../../../public/files", type);
  const targetPath = path.resolve(baseDir, safeFilename);

  // Ensure resolved path is strictly within baseDir
  if (!targetPath.startsWith(path.resolve(baseDir))) {
    return next(new AppError("Access denied: Invalid file path", 403));
  }

  if (!fs.existsSync(targetPath)) {
    return next(new AppError("The requested file was not found", 404));
  }

  // Prevent MIME-sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  return res.sendFile(targetPath);
};
