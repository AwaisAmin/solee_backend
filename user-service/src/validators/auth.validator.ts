import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";

export const registerSchema = z.object({
  email: z.email({ message: "Invalid email" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .refine((val) => /[A-Z]/.test(val), {
      message: "Password must contain at least one uppercase letter",
    })
    .refine((val) => /[0-9]/.test(val), {
      message: "Password must contain at least one number",
    }),
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50),
});

export const loginSchema = z.object({
  email: z.email({ message: "Invalid email" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      sendError(res, "Validation failed", 400, errors);
      return;
    }

    req.body = result.data;
    next();
  };
};
