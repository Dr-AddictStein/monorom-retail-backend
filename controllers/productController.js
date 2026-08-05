import mongoose from "mongoose";
import productModel from "../models/productModel.js";
import { ensureUniqueSlug, slugify } from "../utils/slugify.js";

const findProductBySlugOrId = async (param) => {
  if (mongoose.Types.ObjectId.isValid(param)) {
    const byId = await productModel.findById(param);
    if (byId) return byId;
  }
  return productModel.findOne({ slug: String(param).toLowerCase() });
};

export const getAllProduct = async (req, res) => {
  const products = await productModel.find({}).sort({ createdAt: -1 });
  res.status(200).json(products);
};

export const getSingleProduct = async (req, res) => {
  const { id } = req.params;
  const product = await findProductBySlugOrId(id);

  if (product) {
    res.status(200).json(product);
  } else {
    return res.status(400).json({ error: "No Such Product Found.!." });
  }
};

export const getProductsByCategoryId = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }
  const products = await productModel.find({ category: id });

  if (products) {
    res.status(200).json(products);
  } else {
    return res.status(400).json({ error: "No Such Product Found.!." });
  }
};

export const createProduct = async (req, res) => {
  try {
    const baseSlug =
      slugify(req.body.slug) || slugify(req.body.name) || "product";
    const slug = await ensureUniqueSlug(productModel, baseSlug);

    const newProduct = new productModel({
      ...req.body,
      slug,
    });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }

  try {
    const updates = { ...req.body };

    if (updates.slug != null || updates.name != null) {
      const baseSlug =
        slugify(updates.slug) ||
        slugify(updates.name) ||
        "product";
      updates.slug = await ensureUniqueSlug(productModel, baseSlug, id);
    }

    const product = await productModel.findOneAndUpdate(
      { _id: id },
      updates,
      { new: true }
    );

    if (product) {
      res.status(200).json(product);
    } else {
      return res.status(400).json({ error: "No Such Product Found.!." });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }

  const product = await productModel.findOneAndDelete({ _id: id });

  if (product) {
    res.status(200).json(product);
  } else {
    return res.status(400).json({ error: "No Such product Found.!." });
  }
};

export const bulkUpdate = async (req, res) => {
  const ids = req.body.productIds;
  for (let i = 0; i < ids.length; i++) {
    let dex = await productModel.findById(ids[i]);
    dex.price = req.body.price;
    dex.stock = req.body.stock;
    await productModel.findByIdAndUpdate({ _id: ids[i] }, { ...dex });
  }
  return res.status(200).json(req.body);
};
