import express from "express";
import passport from "passport";
import * as UsersController from "../controllers/user";
import env from "../env";
import { profilePicUpload } from "../middlewares/image-upload";
import {
  loginRateLimit,
  requestVerificationCodeRateLimit,
} from "../middlewares/rateLimit";
import requiresAuth from "../middlewares/requiresAuth";
import setSessionReturnTo from "../middlewares/setSessionReturnTo";
import validateRequestSchema from "../middlewares/validateRequestSchema";
import {
  requestVerificationCodeSchema,
  resetPasswordSchema,
  signUpSchema,
  updateUserSchema,
} from "../validation/users";

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

router.post(
  "/verificationcode",
  requestVerificationCodeRateLimit,
  validateRequestSchema(requestVerificationCodeSchema),
  UsersController.requestEmailVerificationCode
);

router.post(
  "/resetpasswordcode",
  requestVerificationCodeRateLimit,
  validateRequestSchema(requestVerificationCodeSchema),
  UsersController.requestResetPasswordCode
);

router.post(
  "/resetpassword",
  validateRequestSchema(resetPasswordSchema),
  UsersController.resetPassword
);

router.get(
  "/login/google",
  setSessionReturnTo,
  passport.authenticate("google")
);
router.get(
  "/oauth2/redirect/google",
  passport.authenticate("google", {
    successReturnToOrRedirect: env.FRONT_URL,
    keepSessionInfo: true,
  })
);

router.get(
  "/login/github",
  setSessionReturnTo,
  passport.authenticate("github")
);
router.get(
  "/oauth2/redirect/github",
  passport.authenticate("github", {
    successReturnToOrRedirect: env.FRONT_URL,
    keepSessionInfo: true,
  })
);

router.post("/logout", UsersController.logOut);

router.post(
  "/login",
  loginRateLimit,
  passport.authenticate("local"),
  (req, res) => res.status(200).json(req.user)
);

export default router;
