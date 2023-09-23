import axios from "axios";
import { RequestHandler } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import env from "../env";
import BlogPostModel from "../models/blogPost";
import FileService, { IFileService } from "../services/file";
import assertIsDefined from "../utils/assertIsDefined";
import {
  BlogPostBody,
  DeleteBlogPostParams,
  GetBlogPostsQuery,
  UpodateBlogPostParams,
} from "../validation/blogPosts";

const fileService: IFileService = new FileService();

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

    const file = await fileService.saveFeaturedImage(featuredImage, blogPostId);

    const newPost = await BlogPostModel.create({
      _id: blogPostId,
      body,
      slug,
      summary,
      title,
      featuredImageUrl: file.url,
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
      const { url: imageUrl } = await fileService.saveFeaturedImage(
        featuredImage,
        postToEdit._id
      );

      postToEdit.featuredImageUrl = `${imageUrl}?lastupdated${Date.now}`;
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

    await fileService.removeFile(postToDelete.featuredImageUrl);

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

    const { url: imageUrl } = await fileService.saveInPostImage(image);

    res.status(201).json({ imageUrl });
  } catch (error) {
    next(error);
  }
};
