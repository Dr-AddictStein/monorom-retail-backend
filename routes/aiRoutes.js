import express from "express";
import {
  generateCategorySeo,
  generateProductSeo,
} from "../controllers/aiController.js";

const router = express.Router();

// /api/ai/product/...
router.post("/product/generateSeo", generateProductSeo);

// /api/ai/category/...
router.post("/category/generateSeo", generateCategorySeo);

// Future: /api/ai/home/generateSeo, /api/ai/page/generateSeo, etc.

export default router;
