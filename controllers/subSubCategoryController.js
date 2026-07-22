import mongoose from "mongoose";
import subCategoryModel from "../models/subCategoryModel.js";
import subSubCategoryModel from "../models/subSubCategoryModel.js";
import categoryModel from "../models/categoryModel.js";

export const getAllSubSubCategory = async (req, res) => {
  const subSubCategories = await subSubCategoryModel.find({});
  res.status(200).json(subSubCategories);
};
export const subSubCategoryBySubCategoryID = async (req, res) => {
  const { id } = req.params;
  const subSubCategories = await subSubCategoryModel.find({ subCategory: id });
  res.status(200).json(subSubCategories);
};
export const getSingleSubSubCategory = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }
  const subSubCategory = await subSubCategoryModel.findById(id);

  if (subSubCategory) {
    res.status(200).json(subSubCategory);
  } else {
    return res.status(400).json({ error: "No Such SubCategory Found.!." });
  }
};

export const createSubSubCategory = async (req, res) => {
  console.log("AAAA", req.body)
  try {
    let data = {
      ...req.body,
    };
    // data.remquestion=req.body.totalquestion;
    const newSubSubCategory = new subSubCategoryModel(data);
    const savedSubSubCategory = await newSubSubCategory.save();


    let ddex = await subCategoryModel.findById(req.body.subCategory);
    ddex.subSubCategories.push(savedSubSubCategory._id);
    await subCategoryModel.findByIdAndUpdate({ _id: req.body.subCategory }, { ...ddex });
    res.status(201).json(savedSubSubCategory);
  } catch (error) {
    console.error('Error saving subCategory:', error); // Log the error details
    res.status(500).json({ message: error.message });
  }
};

export const deleteSubSubCategory = async (req, res) => {
  const { id } = req.params;

  const subsub = await subSubCategoryModel.findById(id);

  let subDex = await subCategoryModel.findById(subsub.subCategory);

  if (subDex) {
    let v = [];
    for (let i = 0; i < subDex.subSubCategories.length; i++) {
      if (subDex.subSubCategories[i] !== id) {
        v.push(subDex.subSubCategories[i]);
      }
    }
    subDex.subSubCategories = v;

    await subCategoryModel.findByIdAndUpdate({ _id: subsub.subCategory }, { ...subDex });
  }

  await subSubCategoryModel.findByIdAndDelete({ _id: id });

  return res.status(201).json(subDex);

}


export const updateSubSubCategory = async (req, res) => {
  const { id } = req.params;

  const subsub = await subSubCategoryModel.findById(id);

  let subDex = await subCategoryModel.findById(subsub.subCategory);

  let v = [];
  for (let i = 0; i < subDex.subSubCategories.length; i++) {
    if (subDex.subSubCategories[i] !== id) {
      v.push(subDex.subSubCategories[i]);
    }
  }
  subDex.subSubCategories = v;

  await subCategoryModel.findByIdAndUpdate({ _id: subsub.subCategory }, { ...subDex });

  // new 
  subDex = await subCategoryModel.findById(req.body.subCategory);
  subDex.subSubCategories.push(id);

  await subCategoryModel.findByIdAndUpdate({ _id: req.body.subCategory }, { ...subDex });

  await subSubCategoryModel.findByIdAndUpdate({ _id: id }, { ...req.body });

  return res.status(201).json(subDex);

}


