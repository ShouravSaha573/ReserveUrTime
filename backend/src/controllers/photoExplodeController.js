import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  getOwnedPhotoExplode,
  updateOwnedPhotoExplode
} from "../services/photoExplodeService.js";
import { storeOwnedMenuImage } from "../services/menuImageUploadService.js";
import { storeListingRequestImage } from "../services/listingImageUploadService.js";
import { storeGalleryImage } from "../services/galleryImageUploadService.js";

export const menuImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 6 * 1024 * 1024,
    fields: 4,
    parts: 6,
    fieldNestingDepth: 1
  }
});

export const getRestaurantAdminPhotoExplode = asyncHandler(async (req, res) => {
  const payload = await getOwnedPhotoExplode(
    req.managedRestaurantId,
    req.params.itemId
  );
  if (!payload) {
    return res.status(404).json({ message: "Dish not found." });
  }
  res.json(payload);
});

export const updateRestaurantAdminPhotoExplode = asyncHandler(async (req, res) => {
  const payload = await updateOwnedPhotoExplode(
    req.managedRestaurantId,
    req.params.itemId,
    req.body || {}
  );
  if (!payload) {
    return res.status(404).json({ message: "Dish not found." });
  }

  await writeAuditLog(req, {
    action: "menu_item.photo_explode_update",
    entityType: "MenuItem",
    entityId: payload.item._id,
    changes: { photoExplode: payload.photoExplode }
  });

  res.json({
    message: "Photo Explode animation saved.",
    ...payload
  });
});

export const uploadRestaurantAdminDishImage = asyncHandler(async (req, res) => {
  const payload = await storeOwnedMenuImage(
    req.managedRestaurantId,
    req.params.itemId,
    req.file
  );
  if (!payload) {
    return res.status(404).json({ message: "Dish not found." });
  }

  await writeAuditLog(req, {
    action: "menu_item.image_upload",
    entityType: "MenuItem",
    entityId: payload.item._id,
    changes: {
      imageUrl: payload.imageUrl,
      photoExplodeEnabled: true
    }
  });

  res.json({
    message: "Dish image uploaded and Photo Explode enabled.",
    ...payload
  });
});

export const uploadRestaurantAdminListingImage = asyncHandler(async (req, res) => {
  const imageUrl = await storeListingRequestImage(req.file);
  await writeAuditLog(req, {
    action: "restaurant.listing_image_staged",
    entityType: "Restaurant",
    entityId: req.managedRestaurantId,
    changes: { imageUrl }
  });
  res.json({ message: "Listing image ready for approval request.", imageUrl });
});

export const uploadRestaurantAdminGalleryImage = asyncHandler(async (req, res) => {
  const imageUrl = await storeGalleryImage(req.file);
  await writeAuditLog(req, {
    action: "gallery.image_upload",
    entityType: "GalleryItem",
    entityId: req.managedRestaurantId,
    changes: { imageUrl }
  });
  res.json({ message: "Gallery image uploaded.", imageUrl });
});
