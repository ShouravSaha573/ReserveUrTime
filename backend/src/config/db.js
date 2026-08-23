import mongoose from "mongoose";

export async function connectDB() {
  mongoose.set("sanitizeFilter", true);

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Create backend/.env first.");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000
  });

  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}
