import bcrypt from "bcrypt";
import crypto from "crypto";
import { RequestHandler } from "express";
import createHttpError from "http-errors";
import sharp from "sharp";
import env from "../env";
import EmailVerificationToken from "../models/emailVerificationToken";
import PasswordResetToken from "../models/passwordResetToken";
import UserModel from "../models/user";
import assertIsDefined from "../utils/assertIsDefined";
import { destroyAllActiveSesionsForUser } from "../utils/auth";
import * as Email from "../utils/email";
import {
  ResetPasswordBody,
  SignUpBody,
  UpdateUserBody,
  requestVerificationCodeBody,
} from "../validation/users";

export const getAuthenticatedUser: RequestHandler = async (req, res, next) => {
  const authenticatedUser = req.user;
  try {
    assertIsDefined(authenticatedUser);

    const user = await UserModel.findById(authenticatedUser._id)
      .select("+email")
      .exec();

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const signUp: RequestHandler<
  unknown,
  unknown,
  SignUpBody,
  unknown
> = async (req, res, next) => {
  const { username, email, password: passwordRaw, verificationCode } = req.body;
  try {
    const existingUsername = await UserModel.findOne({ username })
      .collation({
        locale: "en",
        strength: 2,
      })
      .exec();

    if (existingUsername) throw createHttpError(409, "Username already taken");

    const emailVerificationToken = await EmailVerificationToken.findOne({
      email,
      verificationCode,
    }).exec();

    if (!emailVerificationToken)
      throw createHttpError(400, "Verification code incorrect or expired.");
    else await emailVerificationToken.deleteOne();

    const passwordHashed = await bcrypt.hash(passwordRaw, 10);

    const result = await UserModel.create({
      username,
      displayName: username,
      email,
      password: passwordHashed,
    });

    const newUser = result.toObject();

    delete newUser.password;

    req.logIn(newUser, (error) => {
      if (error) throw error;
      res.status(201).json(newUser);
    });
  } catch (error) {
    next(error);
  }
};

export const logOut: RequestHandler = (req, res) => {
  req.logOut((error) => {
    if (error) throw error;
    res.sendStatus(200);
  });
};

export const getUserByUsername: RequestHandler = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await UserModel.findOne({ username }).exec();

    if (!user) throw createHttpError(404, "User not found");

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser: RequestHandler<
  unknown,
  unknown,
  UpdateUserBody,
  unknown
> = async (req, res, next) => {
  const { username, displayName, about } = req.body;
  const profilePic = req.file;
  const authenticatedUser = req.user;
  try {
    assertIsDefined(authenticatedUser);

    if (username) {
      const existingUsername = await UserModel.findOne({ username })
        .collation({
          locale: "en",
          strength: 2,
        })
        .exec();

      if (existingUsername)
        throw createHttpError(409, "Username already taken");
    }

    let profilePicDestinationPath: string | undefined = undefined;
    console.log("profilePic", profilePic);
    if (profilePic) {
      profilePicDestinationPath = `/uploads/profile-pictures/${authenticatedUser._id}.png`;

      await sharp(profilePic.buffer)
        .resize(500, 500, {
          withoutEnlargement: true,
        })
        .toFile(`./${profilePicDestinationPath}`);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      authenticatedUser._id,
      {
        $set: {
          ...(username && { username }),
          ...(displayName && { displayName }),
          ...(about && { about }),
          ...(profilePic && {
            profilePicUrl: `${
              env.SERVER_URL
            }${profilePicDestinationPath}?lastupdated=${Date.now()}`,
          }),
        },
      },
      { new: true }
    ).exec();

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const requestEmailVerificationCode: RequestHandler<
  unknown,
  unknown,
  requestVerificationCodeBody,
  unknown
> = async (req, res, next) => {
  const { email } = req.body;
  try {
    const existingEmail = await UserModel.findOne({ email })
      .collation({
        locale: "en",
        strength: 2,
      })
      .exec();

    if (existingEmail) throw createHttpError(409, "Email already in use");

    const verificationCode = crypto.randomInt(100000, 999999).toString();

    await EmailVerificationToken.create({
      email,
      verificationCode,
    });

    await Email.sendVerificationCode(email, verificationCode);

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const requestResetPasswordCode: RequestHandler<
  unknown,
  unknown,
  requestVerificationCodeBody,
  unknown
> = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await UserModel.findOne({ email })
      .collation({
        locale: "en",
        strength: 2,
      })
      .exec();

    if (!user) throw createHttpError(404, "User does not exist");

    const verificationCode = crypto.randomInt(100000, 999999).toString();

    await PasswordResetToken.create({
      email,
      verificationCode,
    });

    await Email.sendPasswordResetCode(email, verificationCode);

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const resetPassword: RequestHandler<
  unknown,
  unknown,
  ResetPasswordBody,
  unknown
> = async (req, res, next) => {
  const { email, password: newPasswordRaw, verificationCode } = req.body;
  try {
    const existingUser = await UserModel.findOne({ email })
      .select("+email")
      .collation({
        locale: "en",
        strength: 2,
      })
      .exec();
    if (!existingUser) throw createHttpError(404, "User not found");

    const passwordResetToken = await PasswordResetToken.findOne({
      email,
      verificationCode,
    }).exec();

    if (!passwordResetToken)
      throw createHttpError(400, "Verification code incorrect or expired.");
    else await passwordResetToken.deleteOne();

    await destroyAllActiveSesionsForUser(existingUser._id.toString());

    const newPasswordHashed = await bcrypt.hash(newPasswordRaw, 10);

    existingUser.password = newPasswordHashed;

    await existingUser.save();

    const user = existingUser.toObject();

    delete user.password;

    req.logIn(user, (error) => {
      if (error) throw error;
      res.status(200).json(user);
    });
  } catch (error) {
    next(error);
  }
};
