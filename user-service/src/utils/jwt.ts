import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string): jwt.JwtPayload => {
  return jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;
};

export const verifyRefreshToken = (token: string): jwt.JwtPayload => {
  return jwt.verify(token, REFRESH_SECRET) as jwt.JwtPayload;
};
