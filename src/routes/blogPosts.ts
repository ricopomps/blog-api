import express from "express";
import * as BlogPostsController from "../controllers/blogPosts";
import { featuredImageUpload } from "../middlewares/image-upload";

const router = express.Router();

router.get("/", BlogPostsController.getBlogPosts);
router.get("/slugs", BlogPostsController.getAllBlogPostsSlugs);
router.get("/post/:slug", BlogPostsController.getBlogPostBySlug);
router.post(
  "/",
  featuredImageUpload.single("featuredImage"),
  BlogPostsController.createBlogPost
);

export default router;
