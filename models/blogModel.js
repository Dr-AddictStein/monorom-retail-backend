import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const blog = mongoose.model("BlogCollection", blogSchema);

export default blog;
