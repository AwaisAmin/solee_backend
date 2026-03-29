import User, { IUser } from "../models/User.model";

export const createUser = async (data: {
  email: string;
  password?: string;
  googleId?: string;
  profile: { name: string; phone?: string; avatar?: string };
}): Promise<IUser> => {
  return User.create(data);
};

export const findUserById = async (id: string): Promise<IUser | null> => {
  return User.findById(id);
};

export const findUserByEmail = async (
  email: string,
  withPassword = false,
): Promise<IUser | null> => {
  if (withPassword) {
    return User.findOne({ email }).select("+password");
  }
  return User.findOne({ email });
};

export const findUserByGoogleId = async (
  googleId: string,
): Promise<IUser | null> => {
  return User.findOne({ googleId });
};

export const updateUserById = async (
  id: string,
  data: Partial<IUser>,
): Promise<IUser | null> => {
  return User.findByIdAndUpdate(id, data, { new: true });
};

export const existsByEmail = async (email: string): Promise<boolean> => {
  const user = await User.findOne({ email }).select("_id");
  return !!user;
};
