import { RequestHandler } from "express";
import createHttpError from "http-errors";
import CommentModel from "../models/comment";
import assertIsDefined from "../utils/assertIsDefined";
import {
  CreateCommentBody,
  CreateCommentParams,
  DeleteCommentParams,
  GetCommentsParams,
  GetCommentsQuery,
  GetCommentsRepliesParams,
  GetCommentsRepliesQuery,
  UpdateCommentBody,
  UpdateCommentParams,
} from "../validation/comments";

export const getCommentsForBlogPost: RequestHandler<
  GetCommentsParams,
  unknown,
  unknown,
  GetCommentsQuery
> = async (req, res, next) => {
  const { blogPostId } = req.params;
  const { continueAfterId } = req.query;

  const pageSize = 3;
  try {
    const query = CommentModel.find({
      blogPostId,
      parentCommentId: undefined,
    }).sort({ _id: -1 });

    if (continueAfterId) {
      query.lt("_id", continueAfterId);
    }

    const result = await query
      .limit(pageSize + 1)
      .populate("author")
      .exec();

    const comments = result.slice(0, pageSize);
    const endOfPaginationReached = result.length <= pageSize;

    const commentsWithRepliesCounts = await Promise.all(
      comments.map(async (comment) => {
        const repliesCount = await CommentModel.countDocuments({
          parentCommentId: comment._id,
        }).exec();
        return { ...comment.toObject(), repliesCount };
      })
    );

    res.status(200).json({
      comments: commentsWithRepliesCounts,
      endOfPaginationReached,
    });
  } catch (error) {
    next(error);
  }
};

export const getCommentReplies: RequestHandler<
  GetCommentsRepliesParams,
  unknown,
  unknown,
  GetCommentsRepliesQuery
> = async (req, res, next) => {
  const { commentId: parentCommentId } = req.params;
  const { continueAfterId } = req.query;

  const pageSize = 2;
  try {
    const query = CommentModel.find({ parentCommentId });

    if (continueAfterId) {
      query.gt("_id", continueAfterId);
    }

    const result = await query
      .limit(pageSize + 1)
      .populate("author")
      .exec();

    const comments = result.slice(0, pageSize);
    const endOfPaginationReached = result.length <= pageSize;

    res.status(200).json({
      comments,
      endOfPaginationReached,
    });
  } catch (error) {
    next(error);
  }
};

export const createComment: RequestHandler<
  CreateCommentParams,
  unknown,
  CreateCommentBody,
  unknown
> = async (req, res, next) => {
  const { blogPostId } = req.params;
  const { text, parentCommentId } = req.body;
  const authenticatedUser = req.user;
  try {
    assertIsDefined(authenticatedUser);

    const newComment = await CommentModel.create({
      blogPostId,
      text,
      author: authenticatedUser._id,
      parentCommentId,
    });

    await CommentModel.populate(newComment, { path: "author" });

    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

export const updateComment: RequestHandler<
  UpdateCommentParams,
  unknown,
  UpdateCommentBody,
  unknown
> = async (req, res, next) => {
  const { commentId } = req.params;
  const { newText } = req.body;
  const authenticatedUser = req.user;
  try {
    assertIsDefined(authenticatedUser);

    const commentToUpdate = await CommentModel.findById(commentId)
      .populate("author")
      .exec();

    if (!commentToUpdate) throw createHttpError(404, "Comment not found");

    if (!commentToUpdate.author.equals(authenticatedUser._id))
      throw createHttpError(
        401,
        "You do not have permission to update this comment"
      );

    commentToUpdate.text = newText;
    await commentToUpdate.save();

    res.status(200).json(commentToUpdate);
  } catch (error) {
    next(error);
  }
};

export const deleteComment: RequestHandler<
  DeleteCommentParams,
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  const { commentId } = req.params;
  const authenticatedUser = req.user;
  try {
    assertIsDefined(authenticatedUser);

    const commentToDelete = await CommentModel.findById(commentId).exec();

    if (!commentToDelete) throw createHttpError(404, "Comment not found");

    if (!commentToDelete.author.equals(authenticatedUser._id))
      throw createHttpError(
        401,
        "You do not have permission to delete this comment"
      );

    await commentToDelete.deleteOne();

    await CommentModel.deleteMany({ parentCommentId: commentId }).exec();

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};
