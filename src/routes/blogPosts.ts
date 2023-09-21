import express from "express";
import * as BlogPostsController from "../controllers/blogPosts";
import {
  featuredImageUpload,
  inPostImageUpload,
} from "../middlewares/image-upload";
import {
  createPostRateLimit,
  updatePostRateLimit,
  uploadImageRateLimit,
} from "../middlewares/rateLimit";
import requiresAuth from "../middlewares/requiresAuth";
import validateRequestSchema from "../middlewares/validateRequestSchema";
import {
  createBlogPostSchema,
  deleteBlogPostSchema,
  getBlogPostsSchema,
  updateBlogPostSchema,
  uploadInPostImageSchema,
} from "../validation/blogPosts";

const router = express.Router();

router.get(
  "/",
  validateRequestSchema(getBlogPostsSchema),
  BlogPostsController.getBlogPosts
);

router.get("/slugs", BlogPostsController.getAllBlogPostsSlugs);

router.get("/post/:slug", BlogPostsController.getBlogPostBySlug);

router.post(
  "/",
  requiresAuth,
  createPostRateLimit,
  featuredImageUpload.single("featuredImage"),
  validateRequestSchema(createBlogPostSchema),
  BlogPostsController.createBlogPost
);

router.patch(
  "/:blogPostId",
  requiresAuth,
  updatePostRateLimit,
  featuredImageUpload.single("featuredImage"),
  validateRequestSchema(updateBlogPostSchema),
  BlogPostsController.updateBlogPost
);

router.delete(
  "/:blogPostId",
  requiresAuth,
  validateRequestSchema(deleteBlogPostSchema),
  BlogPostsController.deleteBlogPost
);

router.post(
  "/images",
  requiresAuth,
  uploadImageRateLimit,
  inPostImageUpload.single("inPostImage"),
  validateRequestSchema(uploadInPostImageSchema),
  BlogPostsController.uploadInPostImage
);

export default router;
