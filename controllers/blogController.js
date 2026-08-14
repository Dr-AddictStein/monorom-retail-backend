import mongoose from "mongoose";
import blogModel from "../models/blogModel.js";
import { ensureUniqueSlug, slugify } from "../utils/slugify.js";
import { stripHtml } from "../utils/html.js";

const excerptFromContent = (excerpt, content) => {
  const provided = String(excerpt ?? "").trim();
  if (provided) return provided.slice(0, 280);
  const plain = stripHtml(content);
  if (!plain) return "";
  return plain.length > 180 ? `${plain.slice(0, 180).trim()}…` : plain;
};

const findBlogBySlugOrId = async (param) => {
  if (mongoose.Types.ObjectId.isValid(param)) {
    const byId = await blogModel.findById(param);
    if (byId) return byId;
  }
  return blogModel.findOne({ slug: String(param).toLowerCase() });
};

export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await blogModel.find({}).sort({ createdAt: -1 });
    return res.status(200).json(blogs);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching blogs", error });
  }
};

export const getPublishedBlogs = async (req, res) => {
  try {
    const blogs = await blogModel
      .find({ published: true })
      .sort({ createdAt: -1 });
    return res.status(200).json(blogs);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching blogs", error });
  }
};

export const getSingleBlog = async (req, res) => {
  try {
    const blog = await findBlogBySlugOrId(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found." });
    }
    return res.status(200).json(blog);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching blog", error });
  }
};

export const createBlog = async (req, res) => {
  try {
    const { title, slug, excerpt, coverImage, content, published } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required." });
    }

    const baseSlug = slugify(slug) || slugify(title) || "blog";
    const uniqueSlug = await ensureUniqueSlug(blogModel, baseSlug);

    const saved = await blogModel.create({
      title: String(title).trim(),
      slug: uniqueSlug,
      excerpt: excerptFromContent(excerpt, content),
      coverImage: coverImage || "",
      content: content || "",
      published: published !== false,
    });

    return res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating blog:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateBlog = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID." });
  }

  try {
    const existing = await blogModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Blog not found." });
    }

    const updates = { ...req.body };
    if (updates.title != null) {
      updates.title = String(updates.title).trim();
      if (!updates.title) {
        return res.status(400).json({ message: "Title is required." });
      }
    }

    if (updates.slug != null || updates.title != null) {
      const baseSlug =
        slugify(updates.slug) ||
        slugify(updates.title) ||
        slugify(existing.title) ||
        "blog";
      updates.slug = await ensureUniqueSlug(blogModel, baseSlug, id);
    }

    if (updates.excerpt != null || updates.content != null) {
      updates.excerpt = excerptFromContent(
        updates.excerpt ?? existing.excerpt,
        updates.content ?? existing.content
      );
    }

    const blog = await blogModel.findByIdAndUpdate(id, updates, { new: true });
    return res.status(200).json(blog);
  } catch (error) {
    console.error("Error updating blog:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteBlog = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID." });
  }

  try {
    const blog = await blogModel.findByIdAndDelete(id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found." });
    }
    return res.status(200).json({ message: "Blog deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting blog", error });
  }
};
