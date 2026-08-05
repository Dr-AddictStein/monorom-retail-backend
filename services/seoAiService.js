import OpenAI from "openai";
import { stripHtml } from "../utils/html.js";

const SHARED_FIELDS = ["seoFocusKeyword", "seoTitle", "seoDescription", "seoKeywords"];

const PRODUCT_FIELD_CONFIG = {
  seoFocusKeyword: {
    label: "Focus Keyword",
    instructions: `Return ONE primary search phrase (2–6 words) a Bangladesh shopper would type in Google to find this exact product.
Prefer commercial/local intent when natural (e.g. ceramic dinner set, handmade tea cup Bangladesh).
No quotes. No brand stuffing. Do not invent sizes/materials not supported by the product data.`,
  },
  seoTitle: {
    label: "SEO Title (Meta Title)",
    instructions: `Return ONE Google meta title, 50–60 characters ideal (hard max 65).
Pattern preference: [Primary benefit/product type] [key detail] | Monorom
Must include the focus keyword if provided. Include brand "Monorom" once near the end.
No clickbait. No ALL CAPS. No keyword stuffing.`,
  },
  seoDescription: {
    label: "Meta Description",
    instructions: `Return ONE Google meta description, 145–160 characters ideal (hard max 165).
Include the focus keyword once naturally. Mention a concrete benefit (quality, design, set size, durability, gift-worthy, etc.) only if supported by product data.
End with a soft CTA (e.g. Shop now, Order online). Write for Bangladesh retail shoppers. No fake claims.`,
  },
  seoKeywords: {
    label: "SEO Keywords",
    instructions: `Return 5–8 related keywords/phrases as a single comma-separated list.
Mix: product type, material/style cues from data, use-case, and 1–2 Bangladesh/local variants if natural.
Do not repeat the exact focus keyword more than once. No hashtags. No trailing period.`,
  },
};

const CATEGORY_FIELD_CONFIG = {
  seoFocusKeyword: {
    label: "Focus Keyword",
    instructions: `Return ONE primary search phrase (2–6 words) for this CATEGORY listing page (not a single SKU).
Think collection intent: e.g. ceramic dinner set, dinnerware Bangladesh, tea cups online.
No quotes. No brand stuffing. Stay true to the category name/slogan.`,
  },
  seoTitle: {
    label: "SEO Title (Meta Title)",
    instructions: `Return ONE Google meta title for a category/collection page, 50–60 characters ideal (hard max 65).
Pattern preference: [Category / collection phrase] | Monorom
Must include the focus keyword if provided. Include brand "Monorom" once near the end.
Emphasize browsing/shopping the collection. No clickbait. No ALL CAPS.`,
  },
  seoDescription: {
    label: "Meta Description",
    instructions: `Return ONE Google meta description for a category page, 145–160 characters ideal (hard max 165).
Include the focus keyword once. Invite shoppers to explore the collection (variety, quality, Monorom ceramics).
Soft CTA (Browse collection, Shop now). Bangladesh retail tone. No fake claims or invented product counts.`,
  },
  seoKeywords: {
    label: "SEO Keywords",
    instructions: `Return 5–8 related category/collection keywords as a comma-separated list.
Mix: category type, related product types, use-cases, and 1–2 Bangladesh/local variants if natural.
Do not repeat the exact focus keyword more than once. No hashtags. No trailing period.`,
  },
};

const SYSTEM_PROMPT = `You are an expert ecommerce SEO copywriter for Monorom, a ceramics and homeware retail brand selling in Bangladesh (currency BDT / Tk).

Goals:
- Help pages rank for buyer-intent searches
- Sound premium, trustworthy, and local-friendly (Bangladesh market)
- Never invent specs, materials, sizes, counts, or certifications not present in the provided data
- Prefer clear commercial language over fluffy marketing fluff
- Output ONLY the requested field value — no labels, no markdown, no quotes around the whole answer, no explanations`;

function buildProductContext(product = {}) {
  const description = stripHtml(product.desc || "").slice(0, 1200);
  const specialLines = Array.isArray(product.specialLines)
    ? product.specialLines.filter(Boolean).join(" | ")
    : "";

  return [
    `Entity type: Product page`,
    `Brand: Monorom`,
    `Market: Bangladesh ecommerce / ceramics & homeware retail`,
    `Product name: ${product.name || "N/A"}`,
    `Product code / SKU: ${product.productCode || "N/A"}`,
    `Category: ${product.categoryName || "N/A"}`,
    `Price (Tk): ${product.price ?? "N/A"}`,
    `Special lines / specs: ${specialLines || "N/A"}`,
    `Product description: ${description || "N/A"}`,
    `Existing focus keyword: ${product.seoFocusKeyword || "N/A"}`,
    `Existing SEO title: ${product.seoTitle || "N/A"}`,
    `Existing meta description: ${product.seoDescription || "N/A"}`,
    `Existing SEO keywords: ${product.seoKeywords || "N/A"}`,
  ].join("\n");
}

function buildCategoryContext(category = {}) {
  const sampleProducts = Array.isArray(category.sampleProductNames)
    ? category.sampleProductNames.filter(Boolean).slice(0, 8).join(", ")
    : "";

  return [
    `Entity type: Category / collection page`,
    `Brand: Monorom`,
    `Market: Bangladesh ecommerce / ceramics & homeware retail`,
    `Category name: ${category.name || "N/A"}`,
    `Category slug / URL path: /category/${category.slug || "N/A"}`,
    `Category slogan: ${category.slogan || "N/A"}`,
    `Products in category (sample names): ${sampleProducts || "N/A"}`,
    `Product count (if known): ${category.productCount ?? "N/A"}`,
    `Existing focus keyword: ${category.seoFocusKeyword || "N/A"}`,
    `Existing SEO title: ${category.seoTitle || "N/A"}`,
    `Existing meta description: ${category.seoDescription || "N/A"}`,
    `Existing SEO keywords: ${category.seoKeywords || "N/A"}`,
  ].join("\n");
}

function getConfig(entityType, field) {
  const map =
    entityType === "category" ? CATEGORY_FIELD_CONFIG : PRODUCT_FIELD_CONFIG;
  return map[field] || null;
}

function cleanSeoOutput(field, text) {
  let value = String(text || "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^\*\*?|\*\*?$/g, "")
    .trim();

  value = value.replace(
    /^(focus keyword|seo title|meta title|meta description|seo keywords)\s*:\s*/i,
    ""
  );

  if (field === "seoTitle") {
    value = value.slice(0, 70);
  } else if (field === "seoDescription") {
    value = value.slice(0, 180);
  } else if (field === "seoFocusKeyword") {
    value = value.split("\n")[0].replace(/,/g, " ").replace(/\s+/g, " ").trim();
  } else if (field === "seoKeywords") {
    value = value
      .replace(/\n/g, ", ")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
      .join(", ");
  }

  return value;
}

/**
 * @param {"product"|"category"} entityType
 * @param {string} field
 * @param {object} context
 */
export async function generateSeoField(entityType, field, context) {
  const config = getConfig(entityType, field);
  if (!config) {
    throw new Error(`Unsupported SEO field: ${field}`);
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured on the server");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const dataBlock =
    entityType === "category"
      ? buildCategoryContext(context)
      : buildProductContext(context);

  const entityLabel =
    entityType === "category" ? "category collection page" : "product";

  const userPrompt = `Generate the best "${config.label}" for this Monorom ${entityLabel}.

DATA:
${dataBlock}

FIELD RULES:
${config.instructions}

Return only the final ${config.label} text.`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_SEO_MODEL || "gpt-4o-mini",
    temperature: 0.5,
    max_tokens: 220,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content?.trim() || "";
  return cleanSeoOutput(field, raw);
}

export const SEO_AI_FIELDS = SHARED_FIELDS;
