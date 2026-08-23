import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { AuditLog } from "../models/AuditLog.js";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { getAuditRetentionDays } from "../config/runtimeSecurity.js";

async function main() {
  await connectDB();

  try {
    const retentionMs = getAuditRetentionDays() * 24 * 60 * 60 * 1000;

    const [users, rawIpLogs, logsWithoutExpiry] = await Promise.all([
      User.updateMany(
        { authVersion: { $exists: false } },
        { $set: { authVersion: 0 } }
      ),
      AuditLog.updateMany(
        { ipAddress: { $exists: true, $ne: "" } },
        { $unset: { ipAddress: 1 } }
      ),
      AuditLog.find({
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null }
        ]
      }).select("_id createdAt")
    ]);

    const orderIndexes = await Order.collection.indexes();
    const legacyCheckoutIndex = orderIndexes.find(
      (index) =>
        index.unique === true &&
        Object.keys(index.key || {}).length === 1 &&
        index.key?.checkoutKey === 1
    );

    if (legacyCheckoutIndex) {
      await Order.collection.dropIndex(legacyCheckoutIndex.name);
    }

    await Order.collection.createIndex(
      { userId: 1, checkoutKey: 1 },
      { unique: true, name: "userId_1_checkoutKey_1" }
    );

    let expiryBackfilled = 0;
    for (const log of logsWithoutExpiry) {
      const base = log.createdAt ? new Date(log.createdAt).getTime() : Date.now();
      await AuditLog.updateOne(
        { _id: log._id },
        { $set: { expiresAt: new Date(base + retentionMs) } }
      );
      expiryBackfilled += 1;
    }

    console.log("Security baseline migration complete.");
    console.log(`Users given authVersion=0: ${users.modifiedCount}`);
    console.log(`Legacy raw audit IPs removed: ${rawIpLogs.modifiedCount}`);
    console.log(`Audit retention timestamps backfilled: ${expiryBackfilled}`);
    console.log(
      `Order checkout idempotency index: ${legacyCheckoutIndex ? "migrated to per-customer compound uniqueness" : "verified/created"}`
    );
    console.log("No Restaurant/Menu/Order/Reservation business records were deleted.");
  } finally {
    await mongoose.connection.close();
  }
}

main().catch(async (error) => {
  console.error(`Security migration failed: ${error.message}`);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exitCode = 1;
});
