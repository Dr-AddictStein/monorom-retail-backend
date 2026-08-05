/**
 * Turn free text into a URL-safe slug.
 * e.g. "24555 GD" → "24555-gd", "Living Room" → "living-room"
 */
export function slugify(text) {
  return String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Return a slug that is unique on the given model.
 * If `baseSlug` is taken, appends -2, -3, …
 */
export async function ensureUniqueSlug(Model, baseSlug, excludeId = null) {
  const root = baseSlug || "item";
  let candidate = root;
  let n = 2;

  while (true) {
    const query = { slug: candidate };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const exists = await Model.findOne(query).select("_id").lean();
    if (!exists) return candidate;
    candidate = `${root}-${n++}`;
  }
}
