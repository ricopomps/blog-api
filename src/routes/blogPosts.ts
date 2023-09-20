import express from "express";
import * as BlogPostsController from "../controllers/blogPosts";
import { featuredImageUpload } from "../middlewares/image-upload";
import requiresAuth from "../middlewares/requiresAuth";
import validateRequestSchema from "../middlewares/validateRequestSchema";
import {
  createBlogPostSchema,
  deleteBlogPostSchema,
  getBlogPostsSchema,
  updateBlogPostSchema,
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
  featuredImageUpload.single("featuredImage"),
  validateRequestSchema(createBlogPostSchema),
  BlogPostsController.createBlogPost
);

router.patch(
  "/:blogPostId",
  requiresAuth,
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

export default router;
