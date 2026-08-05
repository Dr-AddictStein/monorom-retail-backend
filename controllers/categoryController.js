import mongoose from "mongoose";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import { ensureUniqueSlug, slugify } from "../utils/slugify.js";

const findCategoryBySlugOrId = async (param) => {
  if (mongoose.Types.ObjectId.isValid(param)) {
    const byId = await categoryModel.findById(param);
    if (byId) return byId;
  }
  return categoryModel.findOne({ slug: String(param).toLowerCase() });
};

export const getAllCategory = async (req, res) => {
  const categories = await categoryModel.find({});
  res.status(200).json(categories);
};

export const getSingleCategory = async (req, res) => {
  const { id } = req.params;
  const category = await findCategoryBySlugOrId(id);

  if (category) {
    res.status(200).json(category);
  } else {
    return res.status(400).json({ error: "No Such Category Found.!." });
  }
};

export const createCategory = async (req, res) => {
  try {
    const rawSlug = req.body.slug || req.body.name;
    if (!rawSlug) {
      return res.status(400).json({ message: "Slug is required." });
    }

    const baseSlug = slugify(rawSlug);
    if (!baseSlug) {
      return res
        .status(400)
        .json({ message: "Slug must contain letters or numbers." });
    }

    const slug = await ensureUniqueSlug(categoryModel, baseSlug);
    const newCategory = new categoryModel({
      ...req.body,
      slug,
    });
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error("Error saving category:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }

  try {
    const updates = { ...req.body };

    if (updates.slug != null || updates.name) {
      const baseSlug = slugify(updates.slug || updates.name);
      if (!baseSlug) {
        return res
          .status(400)
          .json({ message: "Slug must contain letters or numbers." });
      }
      updates.slug = await ensureUniqueSlug(categoryModel, baseSlug, id);
    }

    const category = await categoryModel.findOneAndUpdate(
      { _id: id },
      updates,
      { new: true }
    );

    if (category) {
      res.status(200).json(category);
    } else {
      return res.status(400).json({ error: "No Such Category Found.!." });
    }
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }

  const category = await categoryModel.findOneAndDelete({ _id: id });

  if (category) {
    res.status(200).json(category);
  } else {
    return res.status(400).json({ error: "No Such category Found.!." });
  }
};

export const homePageData = async (req, res) => {
  const categories = await categoryModel.find({});
  const toSend = await Promise.all(
    categories.map(async (category) => {
      const products = await productModel
        .find({ category: category._id.toString() })
        .sort({ createdAt: -1 })
        .limit(12);
      return {
        ...category.toObject(),
        productsData: products,
      };
    })
  );
  res.status(200).json(toSend);
};
