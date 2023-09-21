import express from "express";
import * as CommentsController from "../controllers/comments";
import requiresAuth from "../middlewares/requiresAuth";
import validateRequestSchema from "../middlewares/validateRequestSchema";
import { createCommentSchema, getCommentsSchema } from "../validation/comments";

const router = express.Router();

router.get(
  "/:blogPostId",
  validateRequestSchema(getCommentsSchema),
  CommentsController.getCommentsForBlogPost
);

router.post(
  "/:blogPostId",
  requiresAuth,
  validateRequestSchema(createCommentSchema),
  CommentsController.createComment
);

export default router;
