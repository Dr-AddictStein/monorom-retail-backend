import mongoose from "mongoose";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";

export const getAllCategory = async (req, res) => {
  const categories = await categoryModel.find({});
  res.status(200).json(categories);
};
export const getSingleCategory = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }
  const category = await categoryModel.findById(id);

  if (category) {
    res.status(200).json(category);
  } else {
    return res.status(400).json({ error: "No Such Category Found.!." });
  }
};
export const createCategory = async (req, res) => {
  console.log("AAAA",req.body)
  try {
    let data={
      ...req.body,
    };
    const newCategory = new categoryModel(data);
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Error saving category:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }
  const category = await categoryModel.findOneAndUpdate({ _id: id }, { ...req.body });

  if (category) {
    const toSend = await categoryModel.findById(id);
    res.status(200).json(toSend);
  } else {
    return res.status(400).json({ error: "No Such Category Found.!." });
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


export const homePageData = async(req,res)=>{
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
}
