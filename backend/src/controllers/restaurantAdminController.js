import { Restaurant } from "../models/Restaurant.js";
import { RestaurantProfile } from "../models/RestaurantProfile.js";
import { Review } from "../models/Review.js";
import { ContactMessage } from "../models/ContactMessage.js";
import { countUnreadNotifications } from "../services/notificationService.js";
import { ListingChangeRequest } from "../models/ListingChangeRequest.js";
import { DiningTable } from "../models/DiningTable.js";
import { Reservation } from "../models/Reservation.js";
import { MenuCategory } from "../models/MenuCategory.js";
import { MenuItem } from "../models/MenuItem.js";
import { GalleryItem } from "../models/GalleryItem.js";
import { countRestaurantOrderStats } from "../services/orderService.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  buildRestaurantProfileUpdate,
  getOrCreateRestaurantProfile
} from "../services/restaurantProfileService.js";
import {
  createListingChangeRequest,
  validateListingChangeInput
} from "../services/listingChangeService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const dashboardRestaurantFields =
  "name slug description coverImageUrl cuisine location openingHours isActive";

async function getAssignedRestaurant(req) {
  return Restaurant.findOne({
    _id: req.managedRestaurantId,
    isActive: true
  })
    .select(dashboardRestaurantFields)
    .lean();
}

export const restaurantAdminSummary = asyncHandler(async (req, res) => {
  const [
    restaurant,
    tables,
    reservations,
    pendingChanges,
    categories,
    dishes,
    galleryItems,
    orderStats,
    reviews,
    newMessages,
    unreadNotifications
  ] = await Promise.all([
    getAssignedRestaurant(req),
    DiningTable.countDocuments({
      restaurantId: req.managedRestaurantId,
      isActive: true
    }),
    Reservation.countDocuments({
      restaurantId: req.managedRestaurantId
    }),
    ListingChangeRequest.countDocuments({
      restaurantId: req.managedRestaurantId,
      status: "pending"
    }),
    MenuCategory.countDocuments({
      restaurantId: req.managedRestaurantId,
      isActive: true
    }),
    MenuItem.countDocuments({
      restaurantId: req.managedRestaurantId,
      isActive: true
    }),
    GalleryItem.countDocuments({
      restaurantId: req.managedRestaurantId,
      isActive: true
    }),
    countRestaurantOrderStats(req.managedRestaurantId),
    Review.countDocuments({ restaurantId: req.managedRestaurantId, status: "published" }),
    ContactMessage.countDocuments({ restaurantId: req.managedRestaurantId, targetType: "restaurant", status: "new" }),
    countUnreadNotifications(req.user._id)
  ]);

  if (!restaurant) {
    return res.status(404).json({
      message: "Assigned restaurant not found."
    });
  }

  res.json({
    restaurant,
    summary: {
      tables,
      reservations,
      pendingChanges,
      categories,
      dishes,
      galleryItems,
      orders: orderStats.orders,
      activeOrders: orderStats.activeOrders,
      reviews,
      newMessages,
      unreadNotifications
    }
  });
});

export const getManagedRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await getAssignedRestaurant(req);

  if (!restaurant) {
    return res.status(404).json({
      message: "Assigned restaurant not found."
    });
  }

  res.json({ restaurant });
});

export const getRestaurantProfile = asyncHandler(async (req, res) => {
  const [restaurant, profile] = await Promise.all([
    getAssignedRestaurant(req),
    getOrCreateRestaurantProfile(req.managedRestaurantId)
  ]);

  if (!restaurant) {
    return res.status(404).json({ message: "Assigned restaurant not found." });
  }

  res.json({
    restaurant,
    profile: profile.toObject()
  });
});

export const updateRestaurantProfile = asyncHandler(async (req, res) => {
  const payload = buildRestaurantProfileUpdate(req.body);

  const profile = await RestaurantProfile.findOneAndUpdate(
    { restaurantId: req.managedRestaurantId },
    {
      $set: payload,
      $setOnInsert: { restaurantId: req.managedRestaurantId }
    },
    { new: true, upsert: true, runValidators: true }
  );

  await writeAuditLog(req, {
    action: "restaurant_profile.update",
    entityType: "RestaurantProfile",
    entityId: profile._id,
    changes: {
      restaurantId: req.managedRestaurantId,
      ...payload
    }
  });

  res.json({
    message: "Restaurant internal profile updated.",
    profile
  });
});

export const listOwnListingChangeRequests = asyncHandler(async (req, res) => {
  const requests = await ListingChangeRequest.find({
    restaurantId: req.managedRestaurantId
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("requestedBy", "name email")
    .populate("reviewedBy", "name email")
    .lean();

  res.json({ requests });
});

export const submitListingChangeRequest = asyncHandler(async (req, res) => {
  const input = validateListingChangeInput(req.body);
  const request = await createListingChangeRequest({
    restaurantId: req.managedRestaurantId,
    requestedBy: req.user._id,
    ...input
  });

  await writeAuditLog(req, {
    action: "listing_change.request",
    entityType: "ListingChangeRequest",
    entityId: request._id,
    changes: {
      restaurantId: req.managedRestaurantId,
      type: request.type,
      currentValue: request.currentValue,
      proposedValue: request.proposedValue
    }
  });

  res.status(201).json({
    message: "Change request sent to Platform Admin.",
    request
  });
});
