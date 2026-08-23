import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Restaurant } from "../models/Restaurant.js";
import { DiningTable } from "../models/DiningTable.js";
import { Reservation } from "../models/Reservation.js";
import { SiteContent } from "../models/SiteContent.js";
import { AuditLog } from "../models/AuditLog.js";
import { RestaurantProfile } from "../models/RestaurantProfile.js";
import { ListingChangeRequest } from "../models/ListingChangeRequest.js";
import { MenuCategory } from "../models/MenuCategory.js";
import { MenuItem } from "../models/MenuItem.js";
import { GalleryItem } from "../models/GalleryItem.js";
import { Favorite } from "../models/Favorite.js";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { PaymentAttempt } from "../models/PaymentAttempt.js";
import { Review } from "../models/Review.js";
import { ContactMessage } from "../models/ContactMessage.js";
import { Notification } from "../models/Notification.js";
import { DEFAULT_SITE_CONTENT } from "../config/defaultSiteContent.js";
import { PHASE7_THREE_D_CONFIGS } from "../config/phase7ThreeDConfigs.js";
import { applyPhase7ThreeDConfigToDish } from "../services/phase7SetupService.js";

const restaurants = [
  {
    name: "Ember House",
    slug: "ember-house",
    description:
      "A fire-led contemporary dining room built around smoke, texture and seasonal ingredients. Ember House is designed as a warm, cinematic evening experience.",
    coverImageUrl: "/images/ember.svg",
    cuisine: "Contemporary European",
    location: "Gulshan 2, Dhaka",
    phone: "+880 1700 000001",
    email: "hello@ember.example",
    openingHours: "Daily · 6:00 PM – 11:30 PM",
    theme: "ember",
    isFeatured: true,
    featuredOrder: 1,
    listingOrder: 1,
    isActive: true
  },
  {
    name: "Kori",
    slug: "kori",
    description:
      "A restrained Japanese-inspired restaurant focused on precision, seasonal produce and clean presentation. Kori uses a calm, minimal dining atmosphere.",
    coverImageUrl: "/images/kori.svg",
    cuisine: "Modern Japanese",
    location: "Banani, Dhaka",
    phone: "+880 1700 000002",
    email: "hello@kori.example",
    openingHours: "Daily · 6:00 PM – 11:00 PM",
    theme: "kori",
    isFeatured: true,
    featuredOrder: 2,
    listingOrder: 2,
    isActive: true
  },
  {
    name: "Verde",
    slug: "verde",
    description:
      "A modern garden dining concept with Mediterranean flavours, fresh herbs and a lighter visual identity while retaining the platform's premium structure.",
    coverImageUrl: "/images/verde.svg",
    cuisine: "Mediterranean",
    location: "Dhanmondi, Dhaka",
    phone: "+880 1700 000003",
    email: "hello@verde.example",
    openingHours: "Daily · 5:30 PM – 11:00 PM",
    theme: "verde",
    isFeatured: true,
    featuredOrder: 3,
    listingOrder: 3,
    isActive: true
  }
];

const tablePlan = [
  ["T01", 2, "Window"],
  ["T02", 2, "Window"],
  ["T03", 4, "Main Dining"],
  ["T04", 4, "Main Dining"],
  ["T05", 4, "Main Dining"],
  ["T06", 6, "Main Dining"],
  ["T07", 6, "Private Corner"],
  ["T08", 8, "Private Corner"],
  ["T09", 12, "Private Dining"]
];

async function upsertRoleAccount({
  email,
  password,
  name,
  role,
  restaurantId = null
}) {
  const passwordHash = await bcrypt.hash(password, 12);
  let user = await User.findOne({ email }).select("+passwordHash +authVersion");

  if (!user) {
    user = new User({
      name,
      email,
      passwordHash,
      role,
      restaurantId,
      isActive: true,
      isVerified: true,
      authVersion: 0
    });
  } else {
    user.name = name;
    user.email = email;
    user.passwordHash = passwordHash;
    user.role = role;
    user.restaurantId = restaurantId;
    user.isActive = true;
    user.isVerified = true;
    user.authVersion = Number(user.authVersion || 0) + 1;
  }

  await user.save();
  return user;
}

async function seed() {
  await connectDB();

  const reset = String(process.env.SEED_RESET).toLowerCase() === "true";

  if (reset) {
    console.log("SEED_RESET=true: clearing development data...");
    await Promise.all([
      Reservation.deleteMany({}),
      DiningTable.deleteMany({}),
      Restaurant.deleteMany({}),
      User.deleteMany({}),
      SiteContent.deleteMany({}),
      AuditLog.deleteMany({}),
      RestaurantProfile.deleteMany({}),
      ListingChangeRequest.deleteMany({}),
      MenuItem.deleteMany({}),
      MenuCategory.deleteMany({}),
      GalleryItem.deleteMany({}),
      Favorite.deleteMany({}),
      Cart.deleteMany({}),
      PaymentAttempt.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      ContactMessage.deleteMany({}),
      Notification.deleteMany({})
    ]);
  } else {
    const migration = await User.updateMany(
      { role: "admin" },
      { $set: { role: "platform_admin", restaurantId: null } }
    );

    if (migration.modifiedCount > 0) {
      console.log(
        `Migrated ${migration.modifiedCount} legacy admin account(s) to platform_admin.`
      );
    }
  }

  const platformAdminEmail = (
    process.env.PLATFORM_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "platform@reserveurtime.local"
  )
    .trim()
    .toLowerCase();

  const platformAdminPassword =
    process.env.PLATFORM_ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    "ChangeMe123!";

  const platformAdmin = await upsertRoleAccount({
    email: platformAdminEmail,
    password: platformAdminPassword,
    name: "Platform Admin",
    role: "platform_admin"
  });

  await SiteContent.findOneAndUpdate(
    { siteKey: "homepage" },
    {
      $setOnInsert: {
        ...DEFAULT_SITE_CONTENT,
        updatedBy: platformAdmin._id
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true
    }
  );

  const restaurantBySlug = new Map();

  for (const data of restaurants) {
    const restaurant = await Restaurant.findOneAndUpdate(
      { slug: data.slug },
      { $set: data },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );

    restaurantBySlug.set(restaurant.slug, restaurant);

    await RestaurantProfile.findOneAndUpdate(
      { restaurantId: restaurant._id },
      {
        $setOnInsert: {
          restaurantId: restaurant._id,
          tagline: "",
          aboutTitle: "Our story",
          aboutBody: "",
          reservationNote: "",
          internalPhone: restaurant.phone || "",
          internalEmail: restaurant.email || "",
          internalOpeningHours: restaurant.openingHours || "",
          websiteUrl: ""
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    for (const [tableNumber, capacity, area] of tablePlan) {
      await DiningTable.findOneAndUpdate(
        {
          restaurantId: restaurant._id,
          tableNumber
        },
        {
          $set: {
            restaurantId: restaurant._id,
            tableNumber,
            capacity,
            area,
            status: "available",
            isActive: true
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true
        }
      );
    }

    const categorySeeds = [
      ["Starters", "starters", 1],
      ["Mains", "mains", 2],
      ["Desserts", "desserts", 3],
      ["Drinks", "drinks", 4]
    ];
    const categoryBySlug = new Map();

    for (const [name, slug, displayOrder] of categorySeeds) {
      const category = await MenuCategory.findOneAndUpdate(
        { restaurantId: restaurant._id, slug },
        {
          $set: { isActive: true },
          $setOnInsert: {
            restaurantId: restaurant._id,
            name,
            slug,
            description: "",
            displayOrder
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
      categoryBySlug.set(slug, category);
    }

    const publicMenuSeeds =
      restaurant.slug === "ember-house"
        ? [
            {
              category: "starters",
              name: "Coal-Roasted Pumpkin",
              slug: "coal-roasted-pumpkin",
              description: "Roasted pumpkin, cultured cream and smoked seed crumb.",
              ingredients: ["Pumpkin", "Cultured cream", "Seeds"],
              price: 720,
              displayOrder: 1
            },
            {
              category: "mains",
              name: "Ember Signature Plate",
              slug: "signature-main",
              description: "Fire-led seasonal protein with charred vegetables and house jus.",
              ingredients: ["Seasonal protein", "Charred vegetables", "House jus"],
              price: 1650,
              displayOrder: 1
            },
            {
              category: "desserts",
              name: "Burnt Honey Custard",
              slug: "burnt-honey-custard",
              description: "Silky custard, burnt honey and toasted grains.",
              ingredients: ["Custard", "Burnt honey", "Toasted grains"],
              price: 620,
              displayOrder: 1
            },
            {
              category: "drinks",
              name: "Smoked Citrus Fizz",
              slug: "smoked-citrus-fizz",
              description: "Citrus, smoke tea and sparkling water.",
              ingredients: ["Citrus", "Smoke tea", "Sparkling water"],
              price: 390,
              displayOrder: 1
            }
          ]
        : restaurant.slug === "kori"
          ? [
              {
                category: "starters",
                name: "Miso Cucumber",
                slug: "miso-cucumber",
                description: "Chilled cucumber, white miso and sesame.",
                ingredients: ["Cucumber", "White miso", "Sesame"],
                price: 560,
                displayOrder: 1
              },
              {
                category: "mains",
                name: "Kori Seasonal Main",
                slug: "signature-main",
                description: "Seasonal main inspired by Japanese restraint and clean flavours.",
                ingredients: ["Seasonal produce", "Dashi", "Rice"],
                price: 1550,
                displayOrder: 1
              },
              {
                category: "desserts",
                name: "Matcha Cloud",
                slug: "matcha-cloud",
                description: "Matcha cream, soft sponge and toasted rice.",
                ingredients: ["Matcha", "Cream", "Toasted rice"],
                price: 650,
                displayOrder: 1
              },
              {
                category: "drinks",
                name: "Yuzu Tonic",
                slug: "yuzu-tonic",
                description: "Bright yuzu, tonic and shiso aroma.",
                ingredients: ["Yuzu", "Tonic", "Shiso"],
                price: 420,
                displayOrder: 1
              }
            ]
          : [
              {
                category: "starters",
                name: "Herb Garden Flatbread",
                slug: "herb-garden-flatbread",
                description: "Warm flatbread, herb oil and whipped feta.",
                ingredients: ["Flatbread", "Herbs", "Feta"],
                price: 580,
                displayOrder: 1
              },
              {
                category: "mains",
                name: "Verde Garden Main",
                slug: "signature-main",
                description: "Mediterranean vegetables, grains and bright herb dressing.",
                ingredients: ["Garden vegetables", "Grains", "Fresh herbs"],
                price: 1320,
                displayOrder: 1
              },
              {
                category: "desserts",
                name: "Olive Oil Citrus Cake",
                slug: "olive-oil-citrus-cake",
                description: "Citrus cake, olive oil cream and seasonal fruit.",
                ingredients: ["Citrus", "Olive oil", "Seasonal fruit"],
                price: 590,
                displayOrder: 1
              },
              {
                category: "drinks",
                name: "Basil Lemon Cooler",
                slug: "basil-lemon-cooler",
                description: "Fresh lemon, basil and sparkling water.",
                ingredients: ["Lemon", "Basil", "Sparkling water"],
                price: 360,
                displayOrder: 1
              }
            ];

    for (const dish of publicMenuSeeds) {
      await MenuItem.findOneAndUpdate(
        { restaurantId: restaurant._id, slug: dish.slug },
        {
          $set: {
            categoryId: categoryBySlug.get(dish.category)._id,
            isAvailable: true,
            isActive: true
          },
          $setOnInsert: {
            restaurantId: restaurant._id,
            name: dish.name,
            slug: dish.slug,
            description: dish.description,
            ingredients: dish.ingredients,
            price: dish.price,
            imageUrl: restaurant.coverImageUrl || "",
            displayOrder: dish.displayOrder
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
    }

    if (restaurant.slug === "ember-house") {

      for (const [dishSlug, config] of Object.entries(PHASE7_THREE_D_CONFIGS)) {
        const phase7Dish = await MenuItem.findOne({ restaurantId: restaurant._id, slug: dishSlug });
        if (!phase7Dish) {
          throw new Error(`Phase 7 3D dish '${dishSlug}' could not be found during seed.`);
        }

        await applyPhase7ThreeDConfigToDish(
          phase7Dish,
          config,
          restaurant.coverImageUrl || "/images/ember.svg"
        );
      }
    }

    await GalleryItem.findOneAndUpdate(
      { restaurantId: restaurant._id, title: "Restaurant atmosphere" },
      {
        $setOnInsert: {
          restaurantId: restaurant._id,
          title: "Restaurant atmosphere",
          imageUrl: restaurant.coverImageUrl || "/images/ember.svg",
          altText: `${restaurant.name} atmosphere`,
          caption: "Sample internal gallery item. Restaurant Admin may edit or replace it.",
          displayOrder: 1,
          isPublished: true,
          isActive: true
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
  }

  const restaurantAdminEmail = (
    process.env.RESTAURANT_ADMIN_EMAIL || "manager.ember@reserveurtime.local"
  )
    .trim()
    .toLowerCase();

  const restaurantAdminPassword =
    process.env.RESTAURANT_ADMIN_PASSWORD || "ChangeMe123!";

  const restaurantAdminSlug = (
    process.env.RESTAURANT_ADMIN_RESTAURANT_SLUG || "ember-house"
  )
    .trim()
    .toLowerCase();

  const assignedRestaurant = restaurantBySlug.get(restaurantAdminSlug);

  if (!assignedRestaurant) {
    throw new Error(
      `RESTAURANT_ADMIN_RESTAURANT_SLUG '${restaurantAdminSlug}' does not match a seeded restaurant.`
    );
  }

  await upsertRoleAccount({
    email: restaurantAdminEmail,
    password: restaurantAdminPassword,
    name: `${assignedRestaurant.name} Manager`,
    role: "restaurant_admin",
    restaurantId: assignedRestaurant._id
  });

  console.log("Seed complete.");
  console.log(`Platform Admin: ${platformAdminEmail}`);
  console.log(
    "Platform Admin password is the PLATFORM_ADMIN_PASSWORD (or legacy ADMIN_PASSWORD fallback) value in backend/.env"
  );
  console.log(
    `Restaurant Admin: ${restaurantAdminEmail} -> ${assignedRestaurant.name}`
  );
  console.log(
    "Restaurant Admin password is the RESTAURANT_ADMIN_PASSWORD value in backend/.env"
  );

  await mongoose.connection.close();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
