import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
   
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "love", "haha", "sad", "angry"],
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to ensure that a user can only react once per blog
reactionSchema.index({ blogId: 1, userId: 1 }, { unique: true });

export const Reaction = mongoose.model("Reaction", reactionSchema);
