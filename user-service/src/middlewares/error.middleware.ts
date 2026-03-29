import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

interface AppError extends Error {
  statusCode?: number;
  code?: number;
}

export const errorMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(`${req.method} ${req.path} — ${err.message}`);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = "Email already exists";
  }

  // MongoDB validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  const isDev = process.env.NODE_ENV === "development";

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
};
