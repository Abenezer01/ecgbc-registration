import { Request, Response, NextFunction, RequestHandler } from "express";
import AppError from "../shared/errors/app.error";

export const catchAsync =
  (controller: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(controller(req, res, next)).catch(next);

export const errorController = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (err.name === "TokenExpiredError") {
    err = new AppError("The token has expired", 401);
  } else if (err.name === "JsonWebTokenError") {
    err = new AppError("The token is invalid", 401);
  } else if (err.code === "P2025") {
    err = new AppError(`${err.meta?.modelName || "Record"} not found`, 404);
  } else if (err.code === "P2002") {
    err = new AppError(`${err.meta?.modelName || "Record"} already exists`, 409);
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Internal / Unhandled Server Error
  console.error("Unhandled Application Error:", err);
  const isDev = process.env.NODE_ENV === "development";

  return res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: "An unexpected error occurred. Please contact the administrator.",
    ...(isDev ? { stack: err.stack, details: err.message || err } : {}),
  });
};
