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

export class SlugConflictError extends Error {
  constructor(entityLabel, slug, existingName = "") {
    const who = existingName
      ? `A ${entityLabel} named "${existingName}"`
      : `Another ${entityLabel}`;
    super(
      `${who} already uses the slug "${slug}". Please choose a different slug.`
    );
    this.name = "SlugConflictError";
    this.code = "SLUG_CONFLICT";
    this.status = 409;
    this.slug = slug;
  }
}

/**
 * Reject the slug when another document on this model already uses it.
 * `excludeId` skips the record being edited so saving the same slug is allowed.
 */
export async function assertSlugAvailable(
  Model,
  slug,
  excludeId = null,
  entityLabel = "item"
) {
  const query = { slug };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await Model.findOne(query).select("name title").lean();
  if (!existing) return slug;

  const existingName = existing.name || existing.title || "";
  throw new SlugConflictError(entityLabel, slug, existingName);
}

/** 409 body for an explicit conflict or a Mongo duplicate-key race. */
export function slugConflictBody(error, entityLabel = "item") {
  if (error instanceof SlugConflictError || error?.code === "SLUG_CONFLICT") {
    return {
      message: error.message,
      code: "SLUG_CONFLICT",
      slug: error.slug || "",
    };
  }

  const duplicateSlug =
    error?.code === 11000 &&
    (error.keyPattern?.slug != null || error.keyValue?.slug != null);

  if (!duplicateSlug) return null;

  const slug = error.keyValue?.slug || "";
  return {
    message: slug
      ? `Another ${entityLabel} already uses the slug "${slug}". Please choose a different slug.`
      : `Another ${entityLabel} already uses this slug. Please choose a different slug.`,
    code: "SLUG_CONFLICT",
    slug,
  };
}
