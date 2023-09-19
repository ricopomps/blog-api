import express from "express";
import * as UsersController from "../controllers/user";
import passport from "passport";
import requiresAuth from "../middlewares/requiresAuth";
import validateRequestSchema from "../middlewares/validateRequestSchema";
import { signUpSchema, updateUserSchema } from "../validation/users";
import { profilePicUpload } from "../middlewares/image-upload";

const router = express.Router();

router.get("/me", requiresAuth, UsersController.getAuthenticatedUser);

router.patch(
  "/me",
  requiresAuth,
  profilePicUpload.single("profilePic"),
  validateRequestSchema(updateUserSchema),
  UsersController.updateUser
);

router.get("/profile/:username", UsersController.getUserByUsername);

router.post(
  "/signup",
  validateRequestSchema(signUpSchema),
  UsersController.signUp
);

router.post("/logout", UsersController.logOut);

router.post("/login", passport.authenticate("local"), (req, res) =>
  res.status(200).json(req.user)
);

export default router;
