import { RequestHandler } from "express";
import BlogPostModel from "../models/blogPost";
import assertIsDefined from "../utils/assertIsDefined";
import mongoose from "mongoose";
import sharp from "sharp";
import env from "../env";
import createHttpError from "http-errors";
import { BlogPostBody } from "../validation/blogPosts";

export const getBlogPosts: RequestHandler = async (req, res, next) => {
  try {
    const allBlogPosts = await BlogPostModel.find()
      .sort({ _id: -1 })
      .populate("author")
      .exec();

    res.status(200).json(allBlogPosts);
  } catch (error) {
    next(error);
  }
};

export const createBlogPost: RequestHandler<
  unknown,
  unknown,
  BlogPostBody,
  unknown
> = async (req, res, next) => {
  const { body, slug, summary, title } = req.body;
  const featuredImage = req.file;
  const authenticatedUser = req.user;
  try {
    assertIsDefined(featuredImage);
    assertIsDefined(authenticatedUser);

    const existingSlug = await BlogPostModel.findOne({ slug }).exec();

    if (existingSlug)
      throw createHttpError(
        409,
        "Slug already taken, Please choose a different slug"
      );

    const blogPostId = new mongoose.Types.ObjectId();

    const featuredImageDestinationPath = `/uploads/featured-images/${blogPostId}.png`;

    await sharp(featuredImage.buffer)
      .resize(700, 450)
      .toFile(`./${featuredImageDestinationPath}`);

    const newPost = await BlogPostModel.create({
      _id: blogPostId,
      body,
      slug,
      summary,
      title,
      featuredImageUrl: `${env.SERVER_URL}${featuredImageDestinationPath}`,
      author: authenticatedUser._id,
    });

    res.status(200).json(newPost);
  } catch (error) {
    next(error);
  }
};

export const getBlogPostBySlug: RequestHandler = async (req, res, next) => {
  try {
    const blogPost = await BlogPostModel.findOne({
      slug: req.params.slug,
    })
      .populate("author")
      .exec();

    if (!blogPost)
      throw createHttpError(404, "No blog post found for this slug");

    res.status(200).json(blogPost);
  } catch (error) {
    next(error);
  }
};

export const getAllBlogPostsSlugs: RequestHandler = async (req, res, next) => {
  try {
    const results = await BlogPostModel.find().select("slug").exec();
    const slugs = results.map((post) => post.slug);
    res.status(200).json(slugs);
  } catch (error) {
    next(error);
  }
};
