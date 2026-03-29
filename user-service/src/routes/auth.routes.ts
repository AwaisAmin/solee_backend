import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate } from "../validators/auth.validator";
import { registerSchema, loginSchema } from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.get("/me", protect, authController.getMe);

export default router;
