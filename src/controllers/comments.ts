import { RequestHandler } from "express";
import CommentModel from "../models/comment";
import assertIsDefined from "../utils/assertIsDefined";
import {
  CreateCommentBody,
  CreateCommentParams,
  GetCommentsParams,
  GetCommentsQuery,
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
