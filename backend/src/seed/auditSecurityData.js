import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Restaurant } from "../models/Restaurant.js";
import { MenuItem } from "../models/MenuItem.js";
import { GalleryItem } from "../models/GalleryItem.js";
import { SiteContent } from "../models/SiteContent.js";
import { ListingChangeRequest } from "../models/ListingChangeRequest.js";
import { User } from "../models/User.js";
import { publicMediaUrl } from "../utils/mediaUrl.js";

function safe(value, label) {
  if (!value) return true;
  try {
    publicMediaUrl(value, label);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await connectDB();

  try {
    const [restaurants, items, gallery, site, requests, customers] = await Promise.all([
      Restaurant.find({}).select("_id name logoUrl coverImageUrl").lean(),
      MenuItem.find({}).select("_id name imageUrl threeD.posterUrl threeD.modelUrl").lean(),
      GalleryItem.find({}).select("_id title imageUrl").lean(),
      SiteContent.findOne({ siteKey: "homepage" }).select("hero.mediaUrl").lean(),
      ListingChangeRequest.find({ type: "listing_image", status: "pending" })
        .select("_id proposedValue")
        .lean(),
      User.find({ role: "customer" })
        .select("_id email phone billingAddress")
        .lean()
    ]);

    const issues = [];

    for (const row of restaurants) {
      if (!safe(row.logoUrl, "Restaurant logo")) {
        issues.push(`Restaurant ${row._id} (${row.name}): logoUrl is not permitted.`);
      }
      if (!safe(row.coverImageUrl, "Restaurant cover image")) {
        issues.push(`Restaurant ${row._id} (${row.name}): coverImageUrl is not permitted.`);
      }
    }

    for (const row of items) {
      if (!safe(row.imageUrl, "Dish image")) {
        issues.push(`MenuItem ${row._id} (${row.name}): imageUrl is not permitted.`);
      }
      if (!safe(row.threeD?.posterUrl, "3D poster")) {
        issues.push(`MenuItem ${row._id} (${row.name}): 3D poster URL is not permitted.`);
      }
      const model = String(row.threeD?.modelUrl || "");
      if (model && (!model.startsWith("/models/") || model.includes("..") || model.includes("\\"))) {
        issues.push(`MenuItem ${row._id} (${row.name}): 3D model URL must remain under /models/.`);
      }
    }

    for (const row of gallery) {
      if (!safe(row.imageUrl, "Gallery image")) {
        issues.push(`GalleryItem ${row._id} (${row.title || "untitled"}): imageUrl is not permitted.`);
      }
    }

    if (site?.hero?.mediaUrl && !safe(site.hero.mediaUrl, "Homepage hero media")) {
      issues.push("Homepage hero media URL is not permitted.");
    }

    for (const row of requests) {
      if (!safe(row.proposedValue, "Listing request image")) {
        issues.push(`ListingChangeRequest ${row._id}: proposed image URL is not permitted.`);
      }
    }

    // Phase 10: report only IDs, never Customer contact values. These limits mirror
    // the hosted-gateway field sizes so legacy data can be corrected before checkout.
    const paymentLimits = {
      phone: 20,
      addressLine1: 50,
      addressLine2: 50,
      city: 50,
      state: 50,
      postcode: 30,
      country: 50
    };
    for (const row of customers) {
      if (String(row.email || "").length > 50) {
        issues.push(`Customer ${row._id}: email exceeds SSLCOMMERZ's 50-character hosted-checkout limit.`);
      }
      if (String(row.phone || "").length > paymentLimits.phone) {
        issues.push(`Customer ${row._id}: phone exceeds the Phase 10 hosted-checkout limit.`);
      }
      for (const [field, limit] of Object.entries(paymentLimits)) {
        if (field === "phone") continue;
        if (String(row.billingAddress?.[field] || "").length > limit) {
          issues.push(`Customer ${row._id}: billing ${field} exceeds the Phase 10 hosted-checkout limit.`);
        }
      }
    }

    console.log(`Security data audit: ${issues.length} issue(s).`);
    for (const issue of issues) console.log(`- ${issue}`);
    if (!issues.length) {
      console.log("Stored public media/model references satisfy the current allowlist rules.");
    } else {
      process.exitCode = 2;
    }
  } finally {
    await mongoose.connection.close();
  }
}

main().catch(async (error) => {
  console.error(`Security data audit failed: ${error.message}`);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exitCode = 1;
});
