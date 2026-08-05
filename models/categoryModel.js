import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    slogan: {
      type: String,
    },
    bannerImage: {
      type: String,
    },
    categoryThumbnail: {
      type: String,
    },
    seoTitle: {
      type: String,
    },
    seoDescription: {
      type: String,
    },
    seoKeywords: {
      type: String,
    },
    seoFocusKeyword: {
      type: String,
    },
  },
  { timestamps: true }
);

const category = mongoose.model("CategoryCollection", categorySchema);

export default category;
