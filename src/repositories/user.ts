import createHttpError from "http-errors";
import mongoose from "mongoose";
import UserModel, { User } from "../models/user";

export interface IUserRepository {
  findUserById(
    userId: mongoose.Types.ObjectId,
    extraFields?: string
  ): Promise<User>;
  findUserByUsername(username: string): Promise<User | null>;
  createUser(
    username: string,
    email: string,
    passwordHashed: string
  ): Promise<User>;
}

export default class UserRepository implements IUserRepository {
  async findUserById(userId: mongoose.Types.ObjectId, extraFields?: string) {
    const user = await UserModel.findById(userId)
      .select(extraFields || "")
      .exec();

    if (!user) throw createHttpError(404, "User not found");

    return user;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    const user = await UserModel.findOne({ username })
      .collation({
        locale: "en",
        strength: 2,
      })
      .exec();

    return user;
  }

  async createUser(username: string, email: string, passwordHashed: string) {
    const result = await UserModel.create({
      username,
      displayName: username,
      email,
      password: passwordHashed,
    });

    const userWithoutPassword = result.toObject();
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }
}
