import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { sendError } from "../utils/response";

export const protect = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(res, "Not authenticated", 401);
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch {
    sendError(res, "Invalid or expired token", 401);
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, "You do not have permission", 403);
      return;
    }
    next();
  };
};
