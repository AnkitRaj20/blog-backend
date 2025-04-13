import { Comment } from "../models/comments.model.js";
import ApiError from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import asyncHandler from "../utils/asyncHandler.util.js";
import { Blog } from "../models/blog.model.js";

export const createComment = asyncHandler(async (req, res) => {
  const { content, blogId, parentComment = null } = req.body;
  const userId = req.user._id;

  if (!content || !blogId) {
    throw new ApiError(400, "Content and blogId is required");
  }

  const existBlog = await Blog.findById(blogId);
  if (!existBlog) {
    throw new ApiError(404, "Blog not found");
  }

  if (parentComment) {
    const existComment = await Comment.findById(parentComment);
    if (!existComment) {
      throw new ApiError(404, "No such comment found to reply");
    }
  }

  const comment = await Comment.create({
    content,
    blogId,
    createdBy: userId,
    parentComment,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment created successfully"));
});

export const getAllParentComment = asyncHandler(async (req, res) => {
  const { id: blogId } = req.params;
  const currentUserId = req.user._id.toString();

  if (!blogId) {
    throw new ApiError(400, "Blog ID is required");
  }

  // Fetch the blog to know who the author is
  const blog = await Blog.findById(blogId);
  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }
  const blogOwnerId = blog.author.toString();

  // Fetch parent comments (top-level comments) for the blog
  const parentComments = await Comment.find({
    blogId,
    parentComment: null,
    isDeleted: false,
  })
    .populate("createdBy", "email")
    .populate("blogId", "title")
    .sort({ createdAt: -1 });

  //* Helper function to fetch nested replies for a given comment
  const getNestedReplies = async (commentId) => {
    const childComments = await Comment.find({
      parentComment: commentId,
      isDeleted: false,
    })
      .populate("createdBy", "email");

    //* For every reply,  fetch its child replies
    const nestedReplies = await Promise.all(
      childComments.map(async (child) => {
        const replies = await getNestedReplies(child._id);
        return {
          ...child.toObject(),
          owner:    child.createdBy._id.toString() === currentUserId ||
          blogOwnerId === currentUserId,
          replies,
        };
      })
    );
    return nestedReplies;
  };

  // Attach nested replies to each parent comment
  const parentCommentsWithReplies = await Promise.all(
    parentComments.map(async (comment) => {
      const replies = await getNestedReplies(comment._id);
      return {
        ...comment.toObject(),
        owner:  comment.createdBy._id.toString() === currentUserId ||
        blogOwnerId === currentUserId,
        replies,
      };
    })
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        parentCommentsWithReplies,
        "comments fetched successfully"
      )
    );
});


export const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const comment = await Comment.findOne({_id:id , isDeleted: false});
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  //* Only the person who commented can update the comment
  if (!comment.createdBy.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }

  // Update the content and save the comment
  comment.content = content;
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id; 

  const comment = await Comment.findById(id).populate('blogId', 'author');

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  //* Check if the logged-in user is either the creator of the comment or the person who created the blog
  const isCommentOwner = comment.createdBy.equals(userId);
  const isBlogOwner = comment.blogId && comment.blogId.author.equals(userId);

  if (!isCommentOwner && !isBlogOwner) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  // Perform soft deletion by marking the comment as deleted
  comment.isDeleted = true;
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"));
});

