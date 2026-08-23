import { GalleryItem } from "../models/GalleryItem.js";
import { MenuCategory } from "../models/MenuCategory.js";
import { MenuItem } from "../models/MenuItem.js";
import { Restaurant } from "../models/Restaurant.js";
import { RestaurantProfile } from "../models/RestaurantProfile.js";
import {
  PHASE7_THREE_D_CONFIGS,
  buildPhase7RuntimeAsset
} from "../config/phase7ThreeDConfigs.js";

const restaurantPublicFields =
  "name slug description logoUrl coverImageUrl cuisine location phone email openingHours theme";

const PUBLIC_MENU_PROJECTION = {
  _id: 1,
  restaurantId: 1,
  categoryId: 1,
  name: 1,
  slug: 1,
  description: 1,
  ingredients: 1,
  price: 1,
  imageUrl: 1,
  displayOrder: 1,
  isActive: 1,
  isAvailable: 1,
  threeD: 1,
  photoExplode: 1
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function categoryMap(categories = []) {
  const lookup = new Map();
  for (const category of categories) {
    lookup.set(String(category._id), category);
    if (category.slug) lookup.set(String(category.slug), category);
  }
  return lookup;
}

function attachSafeCategory(items = [], categories = []) {
  const lookup = categoryMap(categories);
  return items.map((item) => ({
    ...item,
    // categoryId is legacy-sensitive. Raw Mongo reads intentionally bypass
    // Mongoose hydration so old slug/string values can never trigger CastError.
    categoryId: lookup.get(String(item.categoryId || "")) || null
  }));
}

function runtimeThreeDAsset(item, restaurant) {
  const existing = item?.threeD || {};
  const canonical = restaurant?.slug === "ember-house"
    ? PHASE7_THREE_D_CONFIGS[item?.slug]
    : null;

  if (canonical) {
    return buildPhase7RuntimeAsset(
      canonical,
      existing,
      existing.posterUrl || item?.imageUrl || restaurant?.coverImageUrl || ""
    );
  }
  return existing;
}

function attachRuntimeThreeD(items = [], restaurant) {
  return items.map((item) => ({
    ...item,
    threeD: runtimeThreeDAsset(item, restaurant)
  }));
}

function restaurantIdVariants(restaurantId) {
  // Some very old development documents stored foreign keys as strings.
  // Reading both representations keeps public browse/3D routes tolerant while
  // the repair command normalizes the Atlas data in the background.
  return [restaurantId, String(restaurantId)];
}

async function getActiveCategories(restaurantId) {
  return MenuCategory.collection
    .find(
      {
        restaurantId: { $in: restaurantIdVariants(restaurantId) },
        isActive: true
      },
      {
        projection: {
          _id: 1,
          restaurantId: 1,
          name: 1,
          slug: 1,
          description: 1,
          displayOrder: 1
        }
      }
    )
    .sort({ displayOrder: 1, name: 1 })
    .toArray();
}

async function rawMenuFind(filter, { limit = 100, sort = { displayOrder: 1, name: 1 } } = {}) {
  // Deliberately use the native collection for public reads. This is a
  // compatibility boundary for legacy Atlas documents whose categoryId was
  // historically stored as a slug/string even though the current schema is ObjectId.
  return MenuItem.collection
    .find(filter, { projection: PUBLIC_MENU_PROJECTION })
    .sort(sort)
    .limit(limit)
    .toArray();
}

export async function findPublicRestaurantBySlug(slug) {
  const projection = Object.fromEntries(
    restaurantPublicFields.split(/\s+/).filter(Boolean).map((field) => [field, 1])
  );
  projection._id = 1;

  // Raw collection read makes the entire public Restaurant/menu/3D path
  // independent of Mongoose casting of historical development documents.
  return Restaurant.collection.findOne(
    {
      slug: String(slug || "").trim().toLowerCase().slice(0, 160),
      isActive: true
    },
    { projection }
  );
}

export async function getPublicExperience(slug) {
  const restaurant = await findPublicRestaurantBySlug(slug);
  if (!restaurant) return null;

  const [profile, categories, rawMenuPreview, gallery] = await Promise.all([
    RestaurantProfile.collection.findOne(
      { restaurantId: { $in: restaurantIdVariants(restaurant._id) } },
      {
        projection: {
          tagline: 1,
          aboutTitle: 1,
          aboutBody: 1,
          reservationNote: 1,
          internalPhone: 1,
          internalEmail: 1,
          internalOpeningHours: 1,
          websiteUrl: 1
        }
      }
    ),
    getActiveCategories(restaurant._id),
    rawMenuFind(
      {
        restaurantId: { $in: restaurantIdVariants(restaurant._id) },
        isActive: true,
        isAvailable: true
      },
      { limit: 6 }
    ),
    GalleryItem.collection
      .find(
        {
          restaurantId: { $in: restaurantIdVariants(restaurant._id) },
          isActive: true,
          isPublished: true
        },
        {
          projection: {
            title: 1,
            imageUrl: 1,
            altText: 1,
            caption: 1,
            displayOrder: 1,
            createdAt: 1
          }
        }
      )
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(8)
      .toArray()
  ]);

  const preview = attachRuntimeThreeD(rawMenuPreview, restaurant);
  return {
    restaurant,
    profile: profile || null,
    categories,
    menuPreview: attachSafeCategory(preview, categories),
    gallery
  };
}

export async function getPublicMenu({ slug, rawQuery = "", rawCategory = "" }) {
  const restaurant = await findPublicRestaurantBySlug(slug);
  if (!restaurant) return null;

  const query = String(rawQuery || "").trim().slice(0, 80);
  const categorySlug = String(rawCategory || "").trim().toLowerCase().slice(0, 120);
  const categories = await getActiveCategories(restaurant._id);

  const filter = {
    restaurantId: { $in: restaurantIdVariants(restaurant._id) },
    isActive: true,
    isAvailable: true
  };

  let selectedCategory = null;
  if (categorySlug) {
    selectedCategory = categories.find((item) => item.slug === categorySlug) || null;
    if (!selectedCategory) {
      return {
        restaurant,
        categories,
        items: [],
        search: query || null,
        category: categorySlug,
        invalidCategory: true
      };
    }
    // Accept both the current ObjectId and the historical slug representation.
    filter.categoryId = { $in: [selectedCategory._id, selectedCategory.slug] };
  }

  if (query) {
    const matcher = new RegExp(escapeRegExp(query), "i");
    filter.$or = [{ name: matcher }, { description: matcher }, { ingredients: matcher }];
  }

  const rawItems = await rawMenuFind(filter, { limit: 100 });
  const items = attachRuntimeThreeD(rawItems, restaurant);

  return {
    restaurant,
    categories,
    items: attachSafeCategory(items, categories),
    search: query || null,
    category: selectedCategory?.slug || null,
    invalidCategory: false
  };
}

export async function getPublicDish3D({ restaurantSlug, dishSlug }) {
  const restaurant = await findPublicRestaurantBySlug(restaurantSlug);
  if (!restaurant) return null;

  const slug = String(dishSlug || "").trim().toLowerCase().slice(0, 160);
  const [rawItem, categories] = await Promise.all([
    MenuItem.collection.findOne(
      {
        restaurantId: { $in: restaurantIdVariants(restaurant._id) },
        slug,
        isActive: true,
        isAvailable: true
      },
      { projection: PUBLIC_MENU_PROJECTION }
    ),
    getActiveCategories(restaurant._id)
  ]);

  if (!rawItem) return { restaurant, item: null };
  const item = attachRuntimeThreeD([rawItem], restaurant)[0];
  if (!item.threeD?.enabled || !item.threeD?.modelUrl || !item.threeD?.layers?.length) {
    return { restaurant, item: null };
  }

  return { restaurant, item: attachSafeCategory([item], categories)[0] };
}

export async function getPublicThreeDMenu({ restaurantSlug }) {
  const restaurant = await findPublicRestaurantBySlug(restaurantSlug);
  if (!restaurant) return null;

  const [rawItems, categories] = await Promise.all([
    rawMenuFind(
      {
        restaurantId: { $in: restaurantIdVariants(restaurant._id) },
        isActive: true,
        isAvailable: true
      },
      { limit: 60 }
    ),
    getActiveCategories(restaurant._id)
  ]);

  const items = attachRuntimeThreeD(rawItems, restaurant).filter(
    (item) => item.threeD?.enabled && item.threeD?.modelUrl && item.threeD?.layers?.length
  );

  return { restaurant, items: attachSafeCategory(items, categories) };
}
