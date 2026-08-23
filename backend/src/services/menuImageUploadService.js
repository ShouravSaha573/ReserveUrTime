import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { MenuItem } from "../models/MenuItem.js";
import { defaultPhotoExplodeForImage } from "./photoExplodeService.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../../..");
const uploadDirectory = path.join(
  projectRoot,
  "frontend",
  "public",
  "uploads",
  "menu-images"
);

function detectImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { extension: "png", mime: "image/png" };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: "jpg", mime: "image/jpeg" };
  }
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { extension: "webp", mime: "image/webp" };
  }
  return null;
}

function ownedQuery(restaurantId, itemId) {
  if (!mongoose.isValidObjectId(itemId)) {
    const error = new Error("Invalid dish id.");
    error.status = 400;
    throw error;
  }
  return {
    _id: new mongoose.Types.ObjectId(itemId),
    restaurantId: mongoose.isValidObjectId(restaurantId)
      ? new mongoose.Types.ObjectId(String(restaurantId))
      : restaurantId
  };
}

async function removePreviousLocalImage(value) {
  const prefix = "/uploads/menu-images/";
  if (!String(value || "").startsWith(prefix)) return;
  const filename = path.basename(value);
  const absolute = path.join(uploadDirectory, filename);
  try {
    await fs.unlink(absolute);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export async function storeOwnedMenuImage(restaurantId, itemId, file) {
  const query = ownedQuery(restaurantId, itemId);
  const item = await MenuItem.collection.findOne(query);
  if (!item) return null;
  if (!file?.buffer) {
    const error = new Error("Choose a PNG, JPEG or WebP dish image.");
    error.status = 400;
    throw error;
  }

  const detected = detectImage(file.buffer);
  if (!detected) {
    const error = new Error("Dish image must be a real PNG, JPEG or WebP file. SVG and other formats are not accepted.");
    error.status = 400;
    throw error;
  }

  await fs.mkdir(uploadDirectory, { recursive: true });
  const filename = `${crypto.randomUUID()}.${detected.extension}`;
  const absolutePath = path.join(uploadDirectory, filename);
  await fs.writeFile(absolutePath, file.buffer, { flag: "wx" });

  const previous = item.imageUrl;
  const publicPath = `/uploads/menu-images/${filename}`;
  const photoExplode = {
    ...defaultPhotoExplodeForImage(publicPath),
    ...(item.photoExplode || {}),
    enabled: true,
    sourceImageUrl: publicPath
  };
  try {
    await MenuItem.collection.updateOne(query, {
      $set: {
        imageUrl: publicPath,
        photoExplode,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    await fs.unlink(absolutePath).catch(() => {});
    throw error;
  }
  await removePreviousLocalImage(previous);
  const updated = await MenuItem.collection.findOne(query);

  return {
    item: updated,
    imageUrl: publicPath,
    photoExplode
  };
}
