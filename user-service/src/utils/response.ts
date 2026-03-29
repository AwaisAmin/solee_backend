import { Response } from "express";

export const sendSuccess = (
  res: Response,
  message: string,
  data: unknown = null,
  statusCode: number = 200,
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errors: unknown = null,
) => {
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
