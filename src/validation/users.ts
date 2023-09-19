import * as yup from "yup";

const usernameSchema = yup
  .string()
  .max(20, "Must be 20 characters or less")
  .matches(
    /^[a-zA-Z0-9_]*$/,
    "Only letters, numbers and underscores are allowed"
  );

const emailSchema = yup.string().email("Please enter a valid email address");

const passwordSchema = yup
  .string()
  .matches(/^(?!.* )/, "Must not contain any whitespaces")
  .min(6, "Must be at least 6 characters long");

export const signUpSchema = yup.object({
  body: yup.object({
    username: usernameSchema.required(),
    email: emailSchema.required(),
    password: passwordSchema.required(),
  }),
});

export type SignUpBody = yup.InferType<typeof signUpSchema>["body"];
