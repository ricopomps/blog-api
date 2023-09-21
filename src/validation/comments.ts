import * as yup from "yup";
import { objectIdSchema } from "../utils/validations";
const commentTextSchema = yup.string().required().max(600);

export const getCommentsSchema = yup.object({
  params: yup.object({
    blogPostId: objectIdSchema.required(),
  }),
  query: yup.object({
    continueAfterId: objectIdSchema,
  }),
});

export type GetCommentsParams = yup.InferType<
  typeof getCommentsSchema
>["params"];

export type GetCommentsQuery = yup.InferType<typeof getCommentsSchema>["query"];

export const getCommentsRepliesSchema = yup.object({
  params: yup.object({
    commentId: objectIdSchema.required(),
  }),
  query: yup.object({
    continueAfterId: objectIdSchema,
  }),
});

export type GetCommentsRepliesParams = yup.InferType<
  typeof getCommentsRepliesSchema
>["params"];

export type GetCommentsRepliesQuery = yup.InferType<
  typeof getCommentsRepliesSchema
>["query"];

export const createCommentSchema = yup.object({
  body: yup.object({
    text: commentTextSchema,
    parentCommentId: objectIdSchema,
  }),
  params: yup.object({
    blogPostId: objectIdSchema.required(),
  }),
});

export type CreateCommentParams = yup.InferType<
  typeof createCommentSchema
>["params"];

export type CreateCommentBody = yup.InferType<
  typeof createCommentSchema
>["body"];

export const updateCommentSchema = yup.object({
  body: yup.object({
    newText: commentTextSchema,
  }),
  params: yup.object({
    commentId: objectIdSchema.required(),
  }),
});

export type UpdateCommentBody = yup.InferType<
  typeof updateCommentSchema
>["body"];
export type UpdateCommentParams = yup.InferType<
  typeof updateCommentSchema
>["params"];

export const deleteCommentSchema = yup.object({
  params: yup.object({
    commentId: objectIdSchema.required(),
  }),
});

export type DeleteCommentParams = yup.InferType<
  typeof deleteCommentSchema
>["params"];
