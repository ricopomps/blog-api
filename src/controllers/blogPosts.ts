import { RequestHandler } from "express";
import BlogPostModel from "../models/blogPost";

export const getBlogPosts: RequestHandler = async (req, res, next) => {
  try {
    const allBlogPosts = await BlogPostModel.find().sort({ _id: -1 }).exec();

    res.status(200).json(allBlogPosts);
  } catch (error) {
    next(error);
  }
};

interface BlogPostBody {
  slug: string;
  title: string;
  summary: string;
  body: string;
}

export const createBlogPost: RequestHandler<
  unknown,
  unknown,
  BlogPostBody,
  unknown
> = async (req, res, next) => {
  const { body, slug, summary, title } = req.body;

  try {
    const newPost = await BlogPostModel.create({
      body,
      slug,
      summary,
      title,
    });

    res.status(200).json(newPost);
  } catch (error) {
    next(error);
  }
};
