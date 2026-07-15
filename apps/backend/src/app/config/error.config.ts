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
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  // console.log('err.code');
  // console.log(err.code);
  // console.log(err)
  if (err.name == "TokenExpiredError") {
    err = new AppError("The token has expired", 401);
  } else if (err.name == "JsonWebTokenError") {
    err = new AppError("The token is invalid", 401);
  } else if (err.code === "P2025") {
    err = new AppError(`${err.meta.modelName} not found`, 400);
  } else if (err.code === "P2002") {
    err = new AppError(`${err.meta.modelName} already exists`, 400);
  }
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.log(err);
    res.status(err.statusCode).json({
      status: err.status,
      message: "Oops, something went wrong!",
      err,
    });
  }

  next();
};
