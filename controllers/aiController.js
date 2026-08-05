import productModel from "../models/productModel.js";
import { generateSeoField, SEO_AI_FIELDS } from "../services/seoAiService.js";

const validateField = (field, res) => {
  if (!field || !SEO_AI_FIELDS.includes(field)) {
    res.status(400).json({
      error: `Invalid field. Allowed: ${SEO_AI_FIELDS.join(", ")}`,
    });
    return false;
  }
  return true;
};

/**
 * POST /api/ai/product/generateSeo
 */
export const generateProductSeo = async (req, res) => {
  try {
    const { field } = req.body || {};
    if (!validateField(field, res)) return;

    if (!req.body?.name?.trim()) {
      return res.status(400).json({
        error: "Product name is required before generating SEO with AI.",
      });
    }

    const value = await generateSeoField("product", field, req.body);
    return res.status(200).json({ field, value });
  } catch (error) {
    console.error("Error generating product SEO with AI:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate SEO with AI",
    });
  }
};

/**
 * POST /api/ai/category/generateSeo
 */
export const generateCategorySeo = async (req, res) => {
  try {
    const { field } = req.body || {};
    if (!validateField(field, res)) return;

    if (!req.body?.name?.trim()) {
      return res.status(400).json({
        error: "Category name is required before generating SEO with AI.",
      });
    }

    let sampleProductNames = req.body.sampleProductNames || [];
    let productCount = req.body.productCount;

    // Enrich from DB when categoryId is provided
    if (req.body.categoryId) {
      const products = await productModel
        .find({ category: String(req.body.categoryId) })
        .select("name")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();
      sampleProductNames = products.map((p) => p.name).filter(Boolean);
      if (productCount == null) {
        productCount = await productModel.countDocuments({
          category: String(req.body.categoryId),
        });
      }
    }

    const value = await generateSeoField("category", field, {
      ...req.body,
      sampleProductNames,
      productCount,
    });
    return res.status(200).json({ field, value });
  } catch (error) {
    console.error("Error generating category SEO with AI:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate SEO with AI",
    });
  }
};
