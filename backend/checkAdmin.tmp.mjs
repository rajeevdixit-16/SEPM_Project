import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./src/db/connection.js";
import { User } from "./src/models/user.model.js";

await connectDB();

const counts = await User.aggregate([{ $group: { _id: "$role", n: { $sum: 1 } } }]);
console.log("roles:", JSON.stringify(counts));

const admins = await User.find({ role: "admin" }).select("name email role isVerified isActive providers createdAt");
for (const a of admins) {
  console.log("ADMIN =>", a.email, "| verified:", a.isVerified, "| active:", a.isActive, "| providers:", a.providers.join(","));
}
console.log("admin count:", admins.length);

await mongoose.disconnect();
process.exit(0);
