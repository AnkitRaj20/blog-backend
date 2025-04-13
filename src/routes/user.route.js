import { Router } from "express";
import {
  getUserData,
  loginUser,
  logoutUser,
  registerUser,
  updateProfileDetails,
  updateProfilePictureFile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "profilePicture",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//! Secured routes
router.route("/").get(verifyToken, getUserData)
router.route("/logout").post(verifyToken, logoutUser);

router.route("/update-profile").patch(verifyToken, updateProfileDetails);

router
  .route("/update-profile-picture")
  .patch(verifyToken, upload.single("profilePicture"), updateProfilePictureFile);

export default router;
