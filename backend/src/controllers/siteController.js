import { SiteContent } from "../models/SiteContent.js";
import { DEFAULT_SITE_CONTENT } from "../config/defaultSiteContent.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function mergeDefaults(content) {
  if (!content) return structuredClone(DEFAULT_SITE_CONTENT);

  return {
    ...structuredClone(DEFAULT_SITE_CONTENT),
    ...content,
    brand: {
      ...DEFAULT_SITE_CONTENT.brand,
      ...(content.brand || {})
    },
    hero: {
      ...DEFAULT_SITE_CONTENT.hero,
      ...(content.hero || {}),
      enabled: true
    },
    restaurantsSection: {
      ...DEFAULT_SITE_CONTENT.restaurantsSection,
      ...(content.restaurantsSection || {})
    },
    footer: {
      ...DEFAULT_SITE_CONTENT.footer,
      ...(content.footer || {})
    },
    galaxy: {
      ...DEFAULT_SITE_CONTENT.galaxy,
      ...(content.galaxy || {})
    },
    sectionOrder: [...DEFAULT_SITE_CONTENT.sectionOrder]
  };
}

export const getPublicHomepageContent = asyncHandler(async (req, res) => {
  const content = await SiteContent.findOne({ siteKey: "homepage" })
    .select("-updatedBy")
    .lean();

  res.json({
    content: mergeDefaults(content)
  });
});
