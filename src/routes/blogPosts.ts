import express from "express";
import * as BlogPostsController from "../controllers/blogPosts";
import { featuredImageUpload } from "../middlewares/image-upload";
import requiresAuth from "../middlewares/requiresAuth";
import validateRequestSchema from "../middlewares/validateRequestSchema";
import { createBlogPostSchema } from "../validation/blogPosts";

const router = express.Router();

router.get("/", BlogPostsController.getBlogPosts);
router.get("/slugs", BlogPostsController.getAllBlogPostsSlugs);
router.get("/post/:slug", BlogPostsController.getBlogPostBySlug);
router.post(
  "/",
  requiresAuth,
  featuredImageUpload.single("featuredImage"),
  validateRequestSchema(createBlogPostSchema),
  BlogPostsController.createBlogPost
);

export default router;
