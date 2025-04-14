import { Reaction } from "../models/reaction.model.js";
import ApiError from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import asyncHandler from "../utils/asyncHandler.util.js";

export const createReaction = asyncHandler(async (req, res) => {
  const { blogId, type } = req.body;
  const userId = req.user._id;

  if (!blogId || !type) {
    return res
      .status(400)
      .json({ message: "Blog ID and reaction type are required" });
  }

  // Check if the reaction already exists
  const existingReaction = await Reaction.findOne({
    blogId,
    userId,
  });
  console.log("existingReaction", existingReaction);

  if(existingReaction && existingReaction.isDeleted) {
    // If the reaction exists but is marked as deleted, update it instead of creating a new one
    existingReaction.type = type;
    existingReaction.isDeleted = false;
    await existingReaction.save();
    return res
      .status(200)
      .json(new ApiResponse(200, existingReaction, "reaction updated successfully"));
  }

  if (existingReaction) {
    throw new ApiError(404, "You have already reacted to this blog");
  }

  // Create a new reaction
  const reaction = await Reaction.create({ blogId, userId, type });

  return res
    .status(200)
    .json(new ApiResponse(200, reaction, "reaction created successfully"));
});

export const updateReaction = asyncHandler(async (req, res) => {
  const { id: blogId } = req.params;
  const userId = req.user._id;
  const { type } = req.body;

  if (!type) {
    return res.status(400).json({ message: "Reaction type is required" });
  }

  // Find the reaction and update it
  const reaction = await Reaction.findOneAndUpdate(
    { blogId, userId }, // Find reaction by blogId and userId
    { isDeleted: false, type }, // Update isDeleted and type
    { new: true } // Return the updated document
  );

  if (!reaction) {
    return res.status(404).json({ message: "Reaction not found" });
  }

  return res
    .status(200)
    .json({ message: "Reaction updated successfully", reaction });
});

export const getAllReactions = asyncHandler(async (req, res) => {
  const { id: blogId } = req.params;
  const userId = req.user._id;

  if (!blogId) {
    throw new ApiError(400, "Blog ID is required");
  }

  const filter = {
    blogId,
    isDeleted: false,
  };

  // Fetch all reactions for the specified blog
  const reactions = await Reaction.find(filter).populate("userId", "email");

  const totalCount = {
    like: await Reaction.countDocuments({ ...filter, type: "like" }),
    love: await Reaction.countDocuments({ ...filter, type: "love" }),
    haha: await Reaction.countDocuments({ ...filter, type: "haha" }),
    sad: await Reaction.countDocuments({ ...filter, type: "sad" }),
    angry: await Reaction.countDocuments({ ...filter, type: "angry" }),
  };

  // Check if current user has reacted
  const userReaction = await Reaction.findOne({
    blogId,
    userId,
    isDeleted: false,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reactions,
        totalCount,
        isReacted: userReaction
          ? {
              _id: userReaction._id,
              type: userReaction.type,
            }
          : null,
      },
      "Reactions fetched successfully"
    )
  );
});

export const deleteReaction = asyncHandler(async (req, res) => {
  const { id: blogId } = req.params;
  const userId = req.user._id;

  if (!blogId) {
    throw new ApiError(400, "Blog ID is required");
  }

  // Find the reaction and delete it
  const reaction = await Reaction.findOneAndUpdate(
    { blogId, userId },
    { isDeleted: true, deletedAt: Date.now() },
    { new: true }
  );

  if (!reaction) {
    throw new ApiError(404, "Reaction not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, reaction, "Reaction deleted successfully"));
});
