import mongoose from "mongoose";
import { Favorite } from "../models/Favorite.js";
import { MenuItem } from "../models/MenuItem.js";
import { Reservation } from "../models/Reservation.js";
import { Restaurant } from "../models/Restaurant.js";
import { User } from "../models/User.js";
import { getCustomerCart, countCustomerOrderStats } from "./orderService.js";
import { countUnreadNotifications } from "./notificationService.js";

function safeRestaurant(restaurant) {
  if (!restaurant) return null;
  return {
    _id: restaurant._id,
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description,
    coverImageUrl: restaurant.coverImageUrl || "",
    logoUrl: restaurant.logoUrl || "",
    cuisine: restaurant.cuisine,
    location: restaurant.location
  };
}

function safeMenuItem(item) {
  if (!item) return null;
  return {
    _id: item._id,
    name: item.name,
    slug: item.slug,
    description: item.description || "",
    ingredients: item.ingredients || [],
    price: item.price,
    imageUrl: item.imageUrl || "",
    threeD: item.threeD
      ? {
          enabled: Boolean(item.threeD.enabled),
          posterUrl: item.threeD.posterUrl || ""
        }
      : { enabled: false, posterUrl: "" },
    restaurant: item.restaurantId
      ? {
          _id: item.restaurantId._id,
          name: item.restaurantId.name,
          slug: item.restaurantId.slug,
          coverImageUrl: item.restaurantId.coverImageUrl || "",
          cuisine: item.restaurantId.cuisine,
          location: item.restaurantId.location
        }
      : null,
    category: item.categoryId
      ? {
          _id: item.categoryId._id,
          name: item.categoryId.name,
          slug: item.categoryId.slug
        }
      : null
  };
}

export async function listCustomerFavorites(userId) {
  const favorites = await Favorite.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  const restaurantIds = favorites
    .filter((favorite) => favorite.targetType === "restaurant" && favorite.restaurantId)
    .map((favorite) => favorite.restaurantId);
  const menuItemIds = favorites
    .filter((favorite) => favorite.targetType === "menu_item" && favorite.menuItemId)
    .map((favorite) => favorite.menuItemId);

  const [restaurants, menuItems] = await Promise.all([
    Restaurant.find({ _id: { $in: restaurantIds }, isActive: true })
      .select("name slug description coverImageUrl logoUrl cuisine location")
      .lean(),
    MenuItem.find({
      _id: { $in: menuItemIds },
      isActive: true,
      isAvailable: true
    })
      .select("name slug description ingredients price imageUrl threeD restaurantId categoryId")
      .populate("restaurantId", "name slug coverImageUrl cuisine location isActive")
      .populate("categoryId", "name slug")
      .lean()
  ]);

  const restaurantMap = new Map(restaurants.map((item) => [String(item._id), item]));
  const menuItemMap = new Map(
    menuItems
      .filter((item) => item.restaurantId && item.restaurantId.isActive !== false)
      .map((item) => [String(item._id), item])
  );

  const restaurantFavorites = [];
  const dishFavorites = [];

  for (const favorite of favorites) {
    if (favorite.targetType === "restaurant") {
      const restaurant = restaurantMap.get(String(favorite.restaurantId));
      if (restaurant) {
        restaurantFavorites.push({
          favoriteId: favorite._id,
          savedAt: favorite.createdAt,
          restaurant: safeRestaurant(restaurant)
        });
      }
    } else {
      const item = menuItemMap.get(String(favorite.menuItemId));
      if (item) {
        dishFavorites.push({
          favoriteId: favorite._id,
          savedAt: favorite.createdAt,
          item: safeMenuItem(item)
        });
      }
    }
  }

  return {
    restaurants: restaurantFavorites,
    dishes: dishFavorites,
    restaurantIds: restaurantFavorites.map((entry) => String(entry.restaurant._id)),
    menuItemIds: dishFavorites.map((entry) => String(entry.item._id))
  };
}

export async function addCustomerFavorite(userId, targetType, targetId) {
  if (!mongoose.isValidObjectId(targetId)) {
    const error = new Error("Invalid favourite target.");
    error.status = 400;
    throw error;
  }

  if (targetType === "restaurant") {
    const restaurant = await Restaurant.findOne({ _id: targetId, isActive: true })
      .select("_id")
      .lean();
    if (!restaurant) {
      const error = new Error("Restaurant is unavailable.");
      error.status = 404;
      throw error;
    }

    await Favorite.updateOne(
      { userId, targetType: "restaurant", restaurantId: restaurant._id },
      {
        $setOnInsert: {
          userId,
          targetType: "restaurant",
          restaurantId: restaurant._id,
          menuItemId: null
        }
      },
      { upsert: true }
    );
    return;
  }

  if (targetType === "menu_item") {
    const item = await MenuItem.findOne({
      _id: targetId,
      isActive: true,
      isAvailable: true
    })
      .select("_id restaurantId")
      .lean();

    if (!item) {
      const error = new Error("Dish is unavailable.");
      error.status = 404;
      throw error;
    }

    const restaurantExists = await Restaurant.exists({
      _id: item.restaurantId,
      isActive: true
    });
    if (!restaurantExists) {
      const error = new Error("Restaurant is unavailable.");
      error.status = 404;
      throw error;
    }

    await Favorite.updateOne(
      { userId, targetType: "menu_item", menuItemId: item._id },
      {
        $setOnInsert: {
          userId,
          targetType: "menu_item",
          menuItemId: item._id,
          restaurantId: null
        }
      },
      { upsert: true }
    );
    return;
  }

  const error = new Error("Favourite type must be restaurant or menu_item.");
  error.status = 400;
  throw error;
}

export async function removeCustomerFavorite(userId, targetType, targetId) {
  if (!mongoose.isValidObjectId(targetId)) {
    const error = new Error("Invalid favourite target.");
    error.status = 400;
    throw error;
  }

  if (targetType === "restaurant") {
    await Favorite.deleteOne({ userId, targetType, restaurantId: targetId });
    return;
  }

  if (targetType === "menu_item") {
    await Favorite.deleteOne({ userId, targetType, menuItemId: targetId });
    return;
  }

  const error = new Error("Favourite type must be restaurant or menu_item.");
  error.status = 400;
  throw error;
}

export async function updateCustomerProfile(userId, { name, phone, billingAddress = {} }) {
  const nextName = String(name || "").trim();
  const nextPhone = String(phone || "").trim();
  const nextBilling = {
    addressLine1: String(billingAddress.addressLine1 || "").trim(),
    addressLine2: String(billingAddress.addressLine2 || "").trim(),
    city: String(billingAddress.city || "").trim(),
    state: String(billingAddress.state || "").trim(),
    postcode: String(billingAddress.postcode || "").trim(),
    country: String(billingAddress.country || "Bangladesh").trim()
  };

  if (nextName.length < 2 || nextName.length > 80) {
    const error = new Error("Name must be between 2 and 80 characters.");
    error.status = 400;
    throw error;
  }

  if (nextPhone.length > 20) {
    const error = new Error("Phone number is too long.");
    error.status = 400;
    throw error;
  }

  const limits = {
    addressLine1: 50,
    addressLine2: 50,
    city: 50,
    state: 50,
    postcode: 20,
    country: 50
  };
  for (const [field, limit] of Object.entries(limits)) {
    if (nextBilling[field].length > limit) {
      const error = new Error(`Billing ${field} is too long.`);
      error.status = 400;
      throw error;
    }
  }

  const user = await User.findOneAndUpdate(
    { _id: userId, role: "customer", isActive: true },
    { $set: { name: nextName, phone: nextPhone, billingAddress: nextBilling } },
    { new: true, runValidators: true }
  ).select("_id name email role phone billingAddress restaurantId");

  if (!user) {
    const error = new Error("Customer account is unavailable.");
    error.status = 404;
    throw error;
  }

  return user;
}

export async function getCustomerDashboard(userId) {
  const today = new Date().toISOString().slice(0, 10);

  const [user, visibleFavorites, totalReservations, upcomingReservations, nextReservation, cart, orderStats, unreadNotifications] =
    await Promise.all([
      User.findById(userId).select("_id name email role phone billingAddress restaurantId").lean(),
      listCustomerFavorites(userId),
      Reservation.countDocuments({ userId }),
      Reservation.countDocuments({
        userId,
        reservationDate: { $gte: today },
        status: { $in: ["pending", "confirmed"] }
      }),
      Reservation.findOne({
        userId,
        reservationDate: { $gte: today },
        status: { $in: ["pending", "confirmed"] }
      })
        .sort({ reservationDate: 1, timeSlot: 1 })
        .populate("restaurantId", "name slug location coverImageUrl")
        .populate("tableId", "tableNumber capacity area")
        .lean(),
      getCustomerCart(userId),
      countCustomerOrderStats(userId),
      countUnreadNotifications(userId)
    ]);

  return {
    user,
    stats: {
      savedRestaurants: visibleFavorites.restaurants.length,
      savedDishes: visibleFavorites.dishes.length,
      totalReservations,
      upcomingReservations,
      cartItems: cart.itemCount,
      totalOrders: orderStats.totalOrders,
      activeOrders: orderStats.activeOrders,
      unreadNotifications
    },
    nextReservation
  };
}
