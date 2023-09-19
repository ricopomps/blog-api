import express from "express";
import * as UsersController from "../controllers/user";
import passport from "passport";

const router = express.Router();

router.get("/me", UsersController.getAuthenticatedUser);
router.post("/signup", UsersController.signUp);
router.post("/logout", UsersController.logOut);
router.post("/login", passport.authenticate("local"), (req, res) =>
  res.status(200).json(req.user)
);

export default router;
