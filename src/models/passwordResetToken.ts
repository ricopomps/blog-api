import { InferSchemaType, Schema, model } from "mongoose";

const passwordResetTokenTokenSchema = new Schema({
  email: { type: String, required: true },
  verificationCode: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "10m" },
});

export type PasswordResetToken = InferSchemaType<
  typeof passwordResetTokenTokenSchema
>;

export default model<PasswordResetToken>(
  "PasswordResetToken",
  passwordResetTokenTokenSchema
);
