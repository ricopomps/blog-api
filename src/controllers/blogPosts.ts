import { RequestHandler } from "express";
import BlogPostModel from "../models/blogPost";
import assertIsDefined from "../utils/assertIsDefined";
import mongoose from "mongoose";
import sharp from "sharp";
import env from "../env";
import createHttpError from "http-errors";
import { BlogPostBody, GetBlogPostsQuery } from "../validation/blogPosts";

export const getBlogPosts: RequestHandler<
  unknown,
  unknown,
  unknown,
  GetBlogPostsQuery
> = async (req, res, next) => {
  const authorId = req.query.authorId;
  const page = parseInt(req.query.page || "1");
  const pageSize = 6;

  const filter = authorId ? { author: authorId } : {};

  try {
    const getBlogPostQuery = BlogPostModel.find(filter)
      .sort({ _id: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize)
      .populate("author")
      .exec();

    const countDocumentsQuery = BlogPostModel.countDocuments(filter).exec();

    const [blogPosts, totalResults] = await Promise.all([
      getBlogPostQuery,
      countDocumentsQuery,
    ]);

    const totalPages = Math.ceil(totalResults / pageSize);

    res.status(200).json({ blogPosts, page, totalPages });
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
