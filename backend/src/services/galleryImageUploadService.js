import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.resolve(here, "../../../frontend/public/uploads/gallery-images");

function imageExtension(buffer) {
  if (buffer?.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer?.[0] === 0xff && buffer?.[1] === 0xd8 && buffer?.[2] === 0xff) return "jpg";
  if (buffer?.subarray(0, 4).toString("ascii") === "RIFF" && buffer?.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return "";
}

export async function storeGalleryImage(file) {
  const extension = imageExtension(file?.buffer);
  if (!extension) {
    const error = new Error("Choose a real PNG, JPEG or WebP gallery image.");
    error.status = 400;
    throw error;
  }
  await fs.mkdir(uploadDirectory, { recursive: true });
  const filename = `${crypto.randomUUID()}.${extension}`;
  await fs.writeFile(path.join(uploadDirectory, filename), file.buffer, { flag: "wx" });
  return `/uploads/gallery-images/${filename}`;
}
