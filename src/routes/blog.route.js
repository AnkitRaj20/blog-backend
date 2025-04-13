import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  updateBlog,
} from "../controllers/blog.controller.js";

const blogRouter = Router();

blogRouter.route("/").post(
  verifyToken,
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  createBlog
);

blogRouter.route("/").get(verifyToken, getAllBlogs);
blogRouter.route("/:id").get(verifyToken, getAllBlogs);
blogRouter.route("/:id").put(
  verifyToken,
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  updateBlog
);
blogRouter.route("/:id").delete(verifyToken, deleteBlog);

export default blogRouter;
