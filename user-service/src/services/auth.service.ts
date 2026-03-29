import * as userRepo from "../repositories/user.repository";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { IUser } from "../models/User.model";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const generateTokens = (user: IUser): AuthTokens => {
  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());
  return { accessToken, refreshToken };
};

export const register = async (
  input: RegisterInput,
): Promise<{ user: IUser; tokens: AuthTokens }> => {
  const exists = await userRepo.existsByEmail(input.email);
  if (exists) {
    throw new Error("Email already registered");
  }

  const user = await userRepo.createUser({
    email: input.email,
    password: input.password,
    profile: { name: input.name },
  });

  const tokens = generateTokens(user);
  return { user, tokens };
};

export const login = async (
  input: LoginInput,
): Promise<{ user: IUser; tokens: AuthTokens }> => {
  const user = await userRepo.findUserByEmail(input.email, true);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Account is disabled");
  }

  const isMatch = await user.comparePassword(input.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const tokens = generateTokens(user);
  return { user, tokens };
};

export const handleGoogleLogin = async (profile: {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}): Promise<{ user: IUser; tokens: AuthTokens }> => {
  let user = await userRepo.findUserByGoogleId(profile.googleId);

  if (!user) {
    user = await userRepo.createUser({
      email: profile.email,
      googleId: profile.googleId,
      profile: { name: profile.name, avatar: profile.avatar },
    });
  }

  const tokens = generateTokens(user);
  return { user, tokens };
};
