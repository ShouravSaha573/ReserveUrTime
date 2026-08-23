import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../../..");
const uploadDirectory = path.join(projectRoot, "frontend", "public", "uploads", "listing-images");

function detectImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { extension: "png" };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: "jpg" };
  }
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return { extension: "webp" };
  }
  return null;
}

export async function storeListingRequestImage(file) {
  if (!file?.buffer) {
    const error = new Error("Choose a PNG, JPEG or WebP listing image.");
    error.status = 400;
    throw error;
  }
  const detected = detectImage(file.buffer);
  if (!detected) {
    const error = new Error("Listing image must be a real PNG, JPEG or WebP file.");
    error.status = 400;
    throw error;
  }
  await fs.mkdir(uploadDirectory, { recursive: true });
  const filename = `${crypto.randomUUID()}.${detected.extension}`;
  await fs.writeFile(path.join(uploadDirectory, filename), file.buffer, { flag: "wx" });
  return `/uploads/listing-images/${filename}`;
}
