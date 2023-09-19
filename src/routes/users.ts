import express from "express";
import * as UsersController from "../controllers/user";
import passport from "passport";
import requiresAuth from "../middlewares/requiresAuth";

const router = express.Router();

router.get("/me", requiresAuth, UsersController.getAuthenticatedUser);
router.post("/signup", UsersController.signUp);
router.post("/logout", UsersController.logOut);
router.post("/login", passport.authenticate("local"), (req, res) =>
  res.status(200).json(req.user)
);

export default router;
