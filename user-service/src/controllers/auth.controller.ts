import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { sendSuccess } from "../utils/response";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { user, tokens } = await authService.register(req.body);
    res.cookie("refreshToken", tokens.refreshToken, cookieOptions);
    sendSuccess(
      res,
      "Registered successfully",
      { user, accessToken: tokens.accessToken },
      201,
    );
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { user, tokens } = await authService.login(req.body);
    res.cookie("refreshToken", tokens.refreshToken, cookieOptions);
    sendSuccess(res, "Login successful", {
      user,
      accessToken: tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie("refreshToken");
  sendSuccess(res, "Logged out successfully");
};

export const getMe = (req: Request, res: Response): void => {
  sendSuccess(res, "User fetched", { user: req.user });
};
