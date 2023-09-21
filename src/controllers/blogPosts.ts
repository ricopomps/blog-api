import axios from "axios";
import crypto from "crypto";
import { RequestHandler } from "express";
import fs from "fs";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import path from "path";
import sharp from "sharp";
import env from "../env";
import BlogPostModel from "../models/blogPost";
import assertIsDefined from "../utils/assertIsDefined";
import {
  BlogPostBody,
  DeleteBlogPostParams,
  GetBlogPostsQuery,
  UpodateBlogPostParams,
} from "../validation/blogPosts";

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

export const updateBlogPost: RequestHandler<
  UpodateBlogPostParams,
  unknown,
  BlogPostBody,
  unknown
> = async (req, res, next) => {
  const { blogPostId } = req.params;
  const { slug, title, summary, body } = req.body;
  const featuredImage = req.file;
  const authenticatedUser = req.user;
  try {
    assertIsDefined(authenticatedUser);

    const existingSlug = await BlogPostModel.findOne({ slug }).exec();

    if (existingSlug && !existingSlug._id.equals(blogPostId))
      throw createHttpError(
        409,
        "Slug already taken, Please choose a different slug"
      );

    const postToEdit = await BlogPostModel.findById(blogPostId).exec();
    if (!postToEdit) throw createHttpError(404);

    if (!postToEdit.author.equals(authenticatedUser._id)) {
      throw createHttpError(401);
    }

    postToEdit.slug = slug;
    postToEdit.title = title;
    postToEdit.summary = summary;
    postToEdit.body = body;

    if (featuredImage) {
      const featuredImageDestinationPath = `/uploads/featured-images/${blogPostId}.png`;

      await sharp(featuredImage.buffer)
        .resize(700, 450)
        .toFile(`./${featuredImageDestinationPath}`);

      postToEdit.featuredImageUrl = `${env.SERVER_URL}${featuredImageDestinationPath}?lastupdated${Date.now}`;
    }

    await postToEdit.save();

    await axios.get(
      `${env.FRONT_URL}/api/revalidate-post/${slug}?secret=${env.POST_REVALIDATION_KEY}`
    );

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const deleteBlogPost: RequestHandler<
  DeleteBlogPostParams,
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  const { blogPostId } = req.params;
  const authenticatedUser = req.user;

  try {
    assertIsDefined(authenticatedUser);

    const postToDelete = await BlogPostModel.findById(blogPostId).exec();

    if (!postToDelete) throw createHttpError(404);

    if (!postToDelete.author.equals(authenticatedUser._id)) {
      throw createHttpError(401);
    }

    if (postToDelete.featuredImageUrl.startsWith(env.SERVER_URL)) {
      const imagePath = postToDelete.featuredImageUrl
        .split(env.SERVER_URL)[1]
        .split("?")[0];

      fs.unlinkSync(`.${imagePath}`); //check how to make sure both file and post were deleted
    }

    await postToDelete.deleteOne();

    await axios.get(
      `${env.FRONT_URL}/api/revalidate-post/${postToDelete.slug}?secret=${env.POST_REVALIDATION_KEY}`
    );

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export const uploadInPostImage: RequestHandler = async (req, res, next) => {
  const image = req.file;

  try {
    assertIsDefined(image);

    const fileName = crypto.randomBytes(20).toString("hex");

    const imageDestinationPath = `/uploads/in-post-images/${fileName}${path.extname(
      image.originalname
    )}`;

    await sharp(image.buffer)
      .resize(1920, undefined, {
        withoutEnlargement: true,
      })
      .toFile(`./${imageDestinationPath}`);

    res
      .status(201)
      .json({ imageUrl: `${env.SERVER_URL}${imageDestinationPath}` });
  } catch (error) {
    next(error);
  }
};
