import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  email: string;
  password?: string;
  googleId?: string;
  role: "user" | "vendor" | "admin";
  profile: {
    name: string;
    phone?: string;
    avatar?: string;
  };
  isVerified: boolean;
  isActive: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "user",
    },
    profile: {
      name: { type: String, required: true },
      phone: { type: String },
      avatar: { type: String },
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;
