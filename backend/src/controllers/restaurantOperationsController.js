import mongoose from "mongoose";
import { MenuCategory } from "../models/MenuCategory.js";
import { MenuItem } from "../models/MenuItem.js";
import { DiningTable } from "../models/DiningTable.js";
import { Reservation } from "../models/Reservation.js";
import { GalleryItem } from "../models/GalleryItem.js";
import { Restaurant } from "../models/Restaurant.js";
import { PHASE7_THREE_D_CONFIGS, buildPhase7RuntimeAsset } from "../config/phase7ThreeDConfigs.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  assertObjectId,
  diningTablePayload,
  ensureOwnedCategory,
  galleryItemPayload,
  menuCategoryPayload,
  menuItemPayload
} from "../services/restaurantOperationsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";
import { defaultPhotoExplodeForImage } from "../services/photoExplodeService.js";

function scopedIdQuery(req, id) {
  assertObjectId(id);
  return {
    _id: id,
    restaurantId: req.managedRestaurantId
  };
}

async function hasFutureReservation(tableId) {
  const today = new Date().toISOString().slice(0, 10);
  return Reservation.exists({
    tableId,
    reservationDate: { $gte: today },
    status: { $in: ["pending", "confirmed"] }
  });
}

export const listMenuCategories = asyncHandler(async (req, res) => {
  const categories = await MenuCategory.find({
    restaurantId: req.managedRestaurantId
  })
    .sort({ isActive: -1, displayOrder: 1, name: 1 })
    .lean();

  res.json({ categories });
});

export const createMenuCategory = asyncHandler(async (req, res) => {
  const payload = menuCategoryPayload(req.body);
  const category = await MenuCategory.create({
    restaurantId: req.managedRestaurantId,
    ...payload
  });

  await writeAuditLog(req, {
    action: "menu_category.create",
    entityType: "MenuCategory",
    entityId: category._id,
    changes: payload
  });

  res.status(201).json({ message: "Menu category created.", category });
});

export const updateMenuCategory = asyncHandler(async (req, res) => {
  const query = scopedIdQuery(req, req.params.categoryId);
  const payload = menuCategoryPayload(req.body, { partial: true });

  const category = await MenuCategory.findOneAndUpdate(
    query,
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!category) {
    return res.status(404).json({ message: "Menu category not found." });
  }

  await writeAuditLog(req, {
    action: "menu_category.update",
    entityType: "MenuCategory",
    entityId: category._id,
    changes: payload
  });

  res.json({ message: "Menu category updated.", category });
});

export const removeMenuCategory = asyncHandler(async (req, res) => {
  const query = scopedIdQuery(req, req.params.categoryId);
  const category = await MenuCategory.findOneAndUpdate(
    query,
    { $set: { isActive: false } },
    { new: true }
  );

  if (!category) {
    return res.status(404).json({ message: "Menu category not found." });
  }

  await writeAuditLog(req, {
    action: "menu_category.remove",
    entityType: "MenuCategory",
    entityId: category._id,
    changes: { isActive: false }
  });

  res.json({
    message: "Menu category removed from the active menu. Existing dish data is preserved.",
    category
  });
});

export const listMenuItems = asyncHandler(async (req, res) => {
  const query = { restaurantId: req.managedRestaurantId };

  if (req.query.categoryId) {
    assertObjectId(req.query.categoryId, "category id");
    query.categoryId = new mongoose.Types.ObjectId(req.query.categoryId);
  }

  const restaurantQueryId = mongoose.isValidObjectId(req.managedRestaurantId)
    ? new mongoose.Types.ObjectId(String(req.managedRestaurantId))
    : req.managedRestaurantId;

  const [rawItems, categories, restaurant] = await Promise.all([
    MenuItem.collection
      .find(query)
      .sort({ isActive: -1, displayOrder: 1, name: 1 })
      .toArray(),
    MenuCategory.find({ restaurantId: req.managedRestaurantId })
      .select("name slug isActive")
      .lean(),
    Restaurant.collection.findOne(
      { _id: restaurantQueryId },
      { projection: { slug: 1, coverImageUrl: 1 } }
    )
  ]);

  const categoryById = new Map();
  for (const category of categories) {
    categoryById.set(String(category._id), category);
    if (category.slug) categoryById.set(String(category.slug), category);
  }

  const items = rawItems.map((item) => {
    const canonical = restaurant?.slug === "ember-house"
      ? PHASE7_THREE_D_CONFIGS[item.slug]
      : null;
    const threeD = canonical
      ? buildPhase7RuntimeAsset(
          canonical,
          item.threeD || {},
          item.threeD?.posterUrl || item.imageUrl || restaurant?.coverImageUrl || ""
        )
      : item.threeD;

    return {
      ...item,
      threeD,
      categoryId: categoryById.get(String(item.categoryId || "")) || null
    };
  });

  res.json({ items });
});

export const createMenuItem = asyncHandler(async (req, res) => {
  const payload = menuItemPayload(req.body);
  await ensureOwnedCategory(req.managedRestaurantId, payload.categoryId);

  const item = await MenuItem.create({
    restaurantId: req.managedRestaurantId,
    ...payload,
    ...(payload.imageUrl
      ? { photoExplode: defaultPhotoExplodeForImage(payload.imageUrl) }
      : {})
  });

  await writeAuditLog(req, {
    action: "menu_item.create",
    entityType: "MenuItem",
    entityId: item._id,
    changes: payload
  });

  const populated = await MenuItem.findById(item._id)
    .populate("categoryId", "name slug isActive")
    .lean();

  res.status(201).json({ message: "Dish created.", item: populated });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const query = scopedIdQuery(req, req.params.itemId);
  const payload = menuItemPayload(req.body, { partial: true });

  if (payload.categoryId) {
    await ensureOwnedCategory(req.managedRestaurantId, payload.categoryId);
  }

  const item = await MenuItem.findOneAndUpdate(
    query,
    { $set: payload },
    { new: true, runValidators: true }
  ).populate("categoryId", "name slug isActive");

  if (!item) {
    return res.status(404).json({ message: "Dish not found." });
  }

  if (payload.imageUrl) {
    const existing = item.photoExplode?.toObject?.() || item.photoExplode || {};
    item.photoExplode = {
      ...defaultPhotoExplodeForImage(payload.imageUrl),
      ...existing,
      enabled: true,
      sourceImageUrl: payload.imageUrl
    };
    await item.save();
  }

  await writeAuditLog(req, {
    action: "menu_item.update",
    entityType: "MenuItem",
    entityId: item._id,
    changes: payload
  });

  res.json({ message: "Dish updated.", item });
});

export const removeMenuItem = asyncHandler(async (req, res) => {
  const query = scopedIdQuery(req, req.params.itemId);
  const item = await MenuItem.findOneAndUpdate(
    query,
    { $set: { isActive: false, isAvailable: false } },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ message: "Dish not found." });
  }

  await writeAuditLog(req, {
    action: "menu_item.remove",
    entityType: "MenuItem",
    entityId: item._id,
    changes: { isActive: false, isAvailable: false }
  });

  res.json({ message: "Dish removed from the active menu.", item });
});

export const listDiningTables = asyncHandler(async (req, res) => {
  const tables = await DiningTable.find({
    restaurantId: req.managedRestaurantId
  })
    .sort({ isActive: -1, area: 1, tableNumber: 1 })
    .lean();

  res.json({ tables });
});

export const createDiningTable = asyncHandler(async (req, res) => {
  const payload = diningTablePayload(req.body);
  const table = await DiningTable.create({
    restaurantId: req.managedRestaurantId,
    ...payload
  });

  await writeAuditLog(req, {
    action: "dining_table.create",
    entityType: "DiningTable",
    entityId: table._id,
    changes: payload
  });

  res.status(201).json({ message: "Dining table created.", table });
});

export const updateDiningTable = asyncHandler(async (req, res) => {
  const query = scopedIdQuery(req, req.params.tableId);
  const payload = diningTablePayload(req.body, { partial: true });
  const table = await DiningTable.findOne(query);

  if (!table) {
    return res.status(404).json({ message: "Dining table not found." });
  }

  const disabling = payload.isActive === false || payload.status === "maintenance";
  if (disabling && (await hasFutureReservation(table._id))) {
    return res.status(409).json({
      message: "This table has an upcoming active reservation. Cancel or complete the relevant reservation before disabling the table."
    });
  }

  Object.assign(table, payload);
  await table.save();

  await writeAuditLog(req, {
    action: "dining_table.update",
    entityType: "DiningTable",
    entityId: table._id,
    changes: payload
  });

  res.json({ message: "Dining table updated.", table });
});

export const removeDiningTable = asyncHandler(async (req, res) => {
  const query = scopedIdQuery(req, req.params.tableId);
  const table = await DiningTable.findOne(query);

  if (!table) {
    return res.status(404).json({ message: "Dining table not found." });
  }

  if (await hasFutureReservation(table._id)) {
    return res.status(409).json({
      message: "This table has an upcoming active reservation and cannot be removed yet."
    });
  }

  table.isActive = false;
  table.status = "maintenance";
  await table.save();

  await writeAuditLog(req, {
    action: "dining_table.remove",
    entityType: "DiningTable",
    entityId: table._id,
    changes: { isActive: false, status: "maintenance" }
  });

  res.json({ message: "Dining table removed from active service.", table });
});

export const listRestaurantReservations = asyncHandler(async (req, res) => {
  const query = { restaurantId: req.managedRestaurantId };
  const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];

  if (req.query.status && req.query.status !== "all") {
    if (!allowedStatuses.includes(req.query.status)) {
      return res.status(400).json({ message: "Invalid reservation status filter." });
    }
    query.status = req.query.status;
  }

  if (req.query.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
      return res.status(400).json({ message: "Invalid reservation date filter." });
    }
    query.reservationDate = req.query.date;
  }

  const reservations = await Reservation.find(query)
    .populate("userId", "name email phone")
    .populate("tableId", "tableNumber capacity area isActive status")
    .sort({ reservationDate: -1, timeSlot: -1, createdAt: -1 })
    .limit(250)
    .lean();

  res.json({ reservations });
});

export const updateRestaurantReservationStatus = asyncHandler(async (req, res) => {
  assertObjectId(req.params.reservationId, "reservation id");
  const nextStatus = String(req.body.status || "").trim().toLowerCase();
  const transitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled"],
    completed: [],
    cancelled: []
  };

  const current = await Reservation.findOne({
    _id: req.params.reservationId,
    restaurantId: req.managedRestaurantId
  })
    .select("_id status")
    .lean();

  if (!current) {
    return res.status(404).json({ message: "Reservation not found." });
  }

  if (!transitions[current.status]?.includes(nextStatus)) {
    return res.status(409).json({
      message: `Reservation cannot move from ${current.status} to ${nextStatus || "that status"}.`
    });
  }

  const update = {
    $set: { status: nextStatus }
  };
  if (nextStatus === "cancelled") {
    update.$unset = { reservationKey: 1, customerSlotKey: 1 };
  }

  const reservation = await Reservation.findOneAndUpdate(
    {
      _id: current._id,
      restaurantId: req.managedRestaurantId,
      status: current.status
    },
    update,
    { new: true, runValidators: true }
  );

  if (!reservation) {
    return res.status(409).json({
      message: "The reservation changed while you were updating it. Refresh and try again."
    });
  }

  await writeAuditLog(req, {
    action: "reservation.status_update",
    entityType: "Reservation",
    entityId: reservation._id,
    changes: { status: nextStatus }
  });

  await createNotification({
    recipientUserId: reservation.userId,
    restaurantId: reservation.restaurantId,
    type: "reservation_status",
    title: `Reservation ${nextStatus}`,
    message: `Your reservation is now ${nextStatus}.`,
    href: "/dashboard/reservations"
  });

  const populated = await Reservation.findById(reservation._id)
    .populate("userId", "name email phone")
    .populate("tableId", "tableNumber capacity area isActive status")
    .lean();

  res.json({ message: `Reservation marked ${nextStatus}.`, reservation: populated });
});

export const listGalleryItems = asyncHandler(async (req, res) => {
  const items = await GalleryItem.find({
    restaurantId: req.managedRestaurantId
  })
    .sort({ isActive: -1, displayOrder: 1, createdAt: -1 })
    .lean();

  res.json({ items });
});

export const createGalleryItem = asyncHandler(async (req, res) => {
  const payload = galleryItemPayload(req.body);
  const item = await GalleryItem.create({
    restaurantId: req.managedRestaurantId,
    ...payload
  });

  await writeAuditLog(req, {
    action: "gallery_item.create",
    entityType: "GalleryItem",
    entityId: item._id,
    changes: payload
  });

  res.status(201).json({ message: "Gallery item created.", item });
});

export const updateGalleryItem = asyncHandler(async (req, res) => {
  const query = scopedIdQuery(req, req.params.galleryItemId);
  const payload = galleryItemPayload(req.body, { partial: true });

  const item = await GalleryItem.findOneAndUpdate(
    query,
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!item) {
    return res.status(404).json({ message: "Gallery item not found." });
  }

  await writeAuditLog(req, {
    action: "gallery_item.update",
    entityType: "GalleryItem",
    entityId: item._id,
    changes: payload
  });

  res.json({ message: "Gallery item updated.", item });
});

export const removeGalleryItem = asyncHandler(async (req, res) => {
  const query = scopedIdQuery(req, req.params.galleryItemId);
  const item = await GalleryItem.findOneAndUpdate(
    query,
    { $set: { isActive: false, isPublished: false } },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ message: "Gallery item not found." });
  }

  await writeAuditLog(req, {
    action: "gallery_item.remove",
    entityType: "GalleryItem",
    entityId: item._id,
    changes: { isActive: false, isPublished: false }
  });

  res.json({ message: "Gallery item removed from active use.", item });
});
