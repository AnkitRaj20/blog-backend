import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  createReaction,
  deleteReaction,
  getAllReactions,
  updateReaction,
} from "../controllers/reaction.controller.js";

const ReactionRoute = Router();

ReactionRoute.use(verifyToken);

ReactionRoute.post("/", createReaction);
ReactionRoute.get("/:id", getAllReactions);
ReactionRoute.put("/:id", updateReaction);
ReactionRoute.delete("/:id", deleteReaction);

export default ReactionRoute;
