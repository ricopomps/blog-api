import express from "express";
import * as UsersController from "../controllers/user";
import passport from "passport";

const router = express.Router();

router.post("/signup", UsersController.signUp);
router.post("/login", passport.authenticate("local"), (req, res) =>
  res.status(200).json(req.user)
);

export default router;
