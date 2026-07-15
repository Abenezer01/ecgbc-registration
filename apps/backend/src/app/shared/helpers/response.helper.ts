import { Response } from "express";

export interface ApiResponse<T = any> {
  status: "success" | "error";
  data?: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}

export interface PaginatedData<T> {
  data: T;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}

/**
 * Send a success response with standard format
 */
export function sendSuccessResponse<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    status: "success",
    data,
  } as ApiResponse<T>);
}

/**
 * Send a success response with message
 */
export function sendSuccessResponseWithMessage<T>(
  res: Response,
  data: T,
  message: string,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    status: "success",
    message,
    data,
  } as ApiResponse<T>);
}

/**
 * Send a paginated response with standard format
 */
export function sendPaginatedResponse<T>(
  res: Response,
  data: T,
  meta: { page: number; limit: number; total: number; totalPages?: number },
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    status: "success",
    data: Object.assign({}, data, { meta }),
  });
}

/**
 * Send an error response with standard format
 */
export function sendErrorResponse(
  res: Response,
  message: string,
  statusCode: number = 400
): void {
  res.status(statusCode).json({
    status: "error",
    message,
  } as ApiResponse);
}
