import { Blog } from "../models/blog.model.js";
import ApiError from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import asyncHandler from "../utils/asyncHandler.util.js";
import { uploadOnCloudinary } from "../utils/cloudinary.util.js";

export const createBlog = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // Check all fields are present - validation
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const author = req.user._id;

  // Check if the  avatar file is present or not

  let imageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.image) &&
    req.files.image.length > 0
  ) {
    imageLocalPath = req.files.image[0].path;
  }

  if (!imageLocalPath) {
    throw new ApiError(400, "Image file is required");
  }

  // Upload to cloudinary
  const image = await uploadOnCloudinary(imageLocalPath);

  if (!image) {
    throw new ApiError(400, "Image file is required");
  }

  const blog = await Blog.create({
    title,
    description,
    image: image.url,
    author,
  });

  const createdBlog = await Blog.findById(blog._id).populate("author", "email");
  if (!createdBlog) {
    throw new ApiError(500, "Blog creation failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdBlog, "Blog created successfully"));
});

export const getAllBlogs = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get a single blog if ID is provided
  if (id) {
    const blog = await Blog.findOne({ _id: id, isDeleted: false }).populate(
      "author",
      "email"
    );
    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, blog, "Blog fetched successfully"));
  }

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const search = req.query.search || "";

  // Build filter with optional search
  const filter = {
    isDeleted: false,
    ...(search && {
      $or: [
        { title: { $regex: search, $options: "i" } }, // case-insensitive partial match
        { description: { $regex: search, $options: "i" } },
      ],
    }),
  };

  // Fetch total count for pagination metadata
  const totalBlogs = await Blog.countDocuments(filter);

  // Fetch paginated blogs
  const blogs = await Blog.find(filter)
    .populate("author", "email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const blogWithOwnerKey = blogs.map((blog) => {
    const blogObj = blog.toObject(); // Convert Mongoose document to plain object
    blogObj.owner = blog.author._id.equals(req.user._id) ? true : false; // Add owner key
    return blogObj;
  });

  if (!blogs) {
    throw new ApiError(500, "Blogs not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        blogs: blogWithOwnerKey,
        pagination: {
          total: totalBlogs,
          page,
          limit,
          totalPages: Math.ceil(totalBlogs / limit),
        },
      },
      "Blogs fetched successfully"
    )
  );
});

export const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  // Check all fields are present - validation
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if the blog exists
  const existBlog = await Blog.findById(id);

  if (!existBlog) {
    throw new ApiError(404, "Blog not found");
  }

  const author = req.user._id;

  if (!existBlog.author.equals(author)) {
    throw new ApiError(403, "You are not authorized to edit this blog");
  }

  // Check if the  avatar file is present or not
  let imageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.image) &&
    req.files.image.length > 0
  ) {
    imageLocalPath = req.files.image[0].path;
  }

  let image = existBlog.image; // Default to existing image URL
  if (imageLocalPath) {
    // If a new image is provided, upload it to Cloudinary
    image = await uploadOnCloudinary(imageLocalPath);
  }

  if (!image) {
    throw new ApiError(400, "Image file is required");
  }

  const blog = await Blog.findByIdAndUpdate(
    id,
    {
      title,
      description,
      image: image.url,
      author,
    },
    { new: true }
  );
  const updatedBlog = await Blog.findById(blog._id).populate("author", "email");
  if (!updatedBlog) {
    throw new ApiError(500, "Blog creation failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedBlog, "Blog updated successfully"));
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if the blog exists
  const existBlog = await Blog.findById(id);

  if (!existBlog) {
    throw new ApiError(404, "Blog not found");
  }

  if (!existBlog.author.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to delete this blog");
  }

  //* Soft delete the blog by marking it as deleted
  existBlog.isDeleted = true;
  existBlog.deletedAt = new Date();
  await existBlog.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Blog deleted successfully"));
});
