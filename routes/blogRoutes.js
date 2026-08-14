import express from "express";
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getPublishedBlogs,
  getSingleBlog,
  updateBlog,
} from "../controllers/blogController.js";

const router = express.Router();

router.get("/", getAllBlogs);
router.get("/public", getPublishedBlogs);
router.get("/:id", getSingleBlog);
router.post("/", createBlog);
router.patch("/:id", updateBlog);
router.delete("/:id", deleteBlog);

export default router;
