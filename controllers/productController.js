import mongoose from "mongoose";
import productModel from "../models/productModel.js";

export const getAllProduct = async (req, res) => {
  const products = await productModel.find({}).sort({ createdAt: -1 });
  res.status(200).json(products);
};
export const getSingleProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }
  const product = await productModel.findById(id);

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
    let data = {
      ...req.body,
    };
    // data.remquestion=req.body.totalquestion;
    const newProduct = new productModel(data);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error saving product:', error); // Log the error details
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }
  const product = await productModel.findOneAndUpdate({ _id: id }, { ...req.body });

  if (product) {
    const toSend = await productModel.findById(id);
    res.status(200).json(toSend);
  } else {
    return res.status(400).json({ error: "No Such Product Found.!." });
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
    dex.priceBC = req.body.priceBC;
    dex.priceMC = req.body.priceMC;
    dex.priceSC = req.body.priceSC;
    dex.priceFC = req.body.priceFC;
    dex.stock = req.body.stock;
    await productModel.findByIdAndUpdate({ _id: ids[i] }, { ...dex });
  }
  return res.status(200).json(req.body);
};