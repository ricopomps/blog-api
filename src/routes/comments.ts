import express from "express";
import * as CommentsController from "../controllers/comments";
import { commentPostRateLimit } from "../middlewares/rateLimit";
import requiresAuth from "../middlewares/requiresAuth";
import validateRequestSchema from "../middlewares/validateRequestSchema";
import {
  createCommentSchema,
  deleteCommentSchema,
  getCommentsRepliesSchema,
  getCommentsSchema,
  updateCommentSchema,
} from "../validation/comments";

const router = express.Router();

router.get(
  "/blog/:blogPostId",
  validateRequestSchema(getCommentsSchema),
  CommentsController.getCommentsForBlogPost
);

router.post(
  "/blog/:blogPostId",
  requiresAuth,
  commentPostRateLimit,
  validateRequestSchema(createCommentSchema),
  CommentsController.createComment
);

router.get(
  "/:commentId/replies",
  validateRequestSchema(getCommentsRepliesSchema),
  CommentsController.getCommentReplies
);

router.patch(
  "/:commentId",
  requiresAuth,
  validateRequestSchema(updateCommentSchema),
  CommentsController.updateComment
);

router.delete(
  "/:commentId",
  requiresAuth,
  validateRequestSchema(deleteCommentSchema),
  CommentsController.deleteComment
);

export default router;
