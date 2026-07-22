import mongoose from "mongoose";
import subCategoryModel from "../models/subCategoryModel.js";
import categoryModel from "../models/categoryModel.js";

export const getAllSubCategory = async (req, res) => {
  const subSubCategories = await subCategoryModel.find({});
  res.status(200).json(subSubCategories);
};
export const getSingleSubCategory = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }
  const subCategory = await subCategoryModel.findById(id);

  if (subCategory) {
    res.status(200).json(subCategory);
  } else {
    return res.status(400).json({ error: "No Such SubCategory Found.!." });
  }
};
export const getSubCategoriesByCategoryId = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }
  console.log("ASDASD", id)
  const subCategory = await subCategoryModel.find({ category: id });
  if (subCategory) {
    res.status(200).json(subCategory);
  } else {
    return res.status(400).json({ error: "No Such SubCategory Found.!." });
  }
};
export const createSubCategory = async (req, res) => {
  console.log("AAAA", req.body)
  try {
    let data = {
      ...req.body,
    };
    // data.remquestion=req.body.totalquestion;
    const newSubCategory = new subCategoryModel(data);
    const savedSubCategory = await newSubCategory.save();

    let cdex = await categoryModel.findById(req.body.category);
    cdex.subCategories.push(savedSubCategory._id);
    await categoryModel.findByIdAndUpdate({ _id: req.body.category }, { ...cdex });
    res.status(201).json(savedSubCategory);
  } catch (error) {
    console.error('Error saving subCategory:', error); // Log the error details
    res.status(500).json({ message: error.message });
  }
};

export const updateSubCategory = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }

  const prevSub = await subCategoryModel.findById(id);

  const subCategory = await subCategoryModel.findOneAndUpdate({ _id: id }, { ...req.body });

  let dex = await categoryModel.findById(prevSub.category);
  if (dex) {
    let vdex = [];
    for (let i = 0; i < dex.subCategories.length; i++) {
      if (dex.subCategories[i] !== id) {
        vdex.push(dex.subCategories[i]);
      }
    }
    dex.subCategories = vdex;
    await categoryModel.findByIdAndUpdate({ _id: prevSub.category }, { ...dex });
  }


  dex = await categoryModel.findById(req.body.category);
  dex.subCategories.push(id);

  await categoryModel.findByIdAndUpdate({ _id: req.body.category }, { subCategories: dex.subCategories });


  if (subCategory) {
    const toSend = await subCategoryModel.findById(id);
    res.status(200).json(toSend);
  } else {
    return res.status(400).json({ error: "No Such SubCategory Found.!." });
  }
};

export const deleteSubCategory = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }
  const subCat = await subCategoryModel.findById(id);
  let dex = await categoryModel.findById(subCat.category);
  if (dex) {
    let vdex = [];
    for (let i = 0; i < dex.subCategories.length; i++) {
      if (dex.subCategories[i] !== id) {
        vdex.push(dex.subCategories[i]);
      }
    }
    dex.subCategories = vdex;

    await categoryModel.findByIdAndUpdate({ _id: subCat.category }, { ...dex });
  }


  const subCategory = await subCategoryModel.findOneAndDelete({ _id: id });

  if (subCategory) {
    res.status(200).json(subCategory);
  } else {
    return res.status(400).json({ error: "No Such subCategory Found.!." });
  }
};
