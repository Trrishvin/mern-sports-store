import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const categoryNames = [
  "Cricket",
  "Football",
  "Tennis",
  "Badminton",
  "Training",
];

const products = [
  ["Pro English Willow Bat", "Balanced English willow bat for club cricket.", 189.99, 12, "Boundary", "Cricket"],
  ["Club Kashmir Willow Bat", "Durable Kashmir willow bat for practice and matches.", 89.99, 20, "Boundary", "Cricket"],
  ["Leather Cricket Ball", "Four-piece red leather ball with a pronounced seam.", 24.99, 40, "Redline", "Cricket"],
  ["White Training Cricket Ball", "Durable white cricket ball for training sessions.", 9.99, 60, "Redline", "Cricket"],
  ["Batting Gloves", "Padded batting gloves with ventilated palms.", 34.99, 25, "Boundary", "Cricket"],
  ["Professional Football", "Match-ready football with a textured outer surface.", 39.99, 30, "Goalmark", "Football"],
  ["Training Football", "Durable football designed for daily team practice.", 19.99, 45, "Goalmark", "Football"],
  ["Goalkeeper Gloves", "Grip-focused gloves with cushioned finger support.", 29.99, 18, "Goalmark", "Football"],
  ["Carbon Tennis Racket", "Lightweight racket for control and all-court play.", 119.99, 14, "AceWorks", "Tennis"],
  ["Tennis Ball 3-Pack", "Pressurized tennis balls for practice or match play.", 12.99, 50, "AceWorks", "Tennis"],
  ["All-Court Badminton Racket", "Flexible graphite racket for recreational play.", 54.99, 16, "SwiftBird", "Badminton"],
  ["Feather Shuttlecocks 6-Pack", "Feather shuttlecocks with consistent flight.", 18.99, 24, "SwiftBird", "Badminton"],
  ["Adjustable Jump Rope", "Lightweight adjustable rope for cardio training.", 14.99, 35, "MotionLab", "Training"],
  ["Yoga Mat", "Non-slip cushioned mat for stretching and workouts.", 27.99, 22, "MotionLab", "Training"],
  ["Training Resistance Bands Set", "Four resistance levels for strength and mobility work.", 21.99, 28, "MotionLab", "Training"],
];

async function seed() {
  const adminName = process.env.ADMIN_NAME || "SportsGear Admin";
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword || adminPassword.length < 8) {
    throw new Error(
      "Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters in server/.env.",
    );
  }

  await connectDB();

  for (const name of categoryNames) {
    await Category.updateOne(
      { name },
      { $setOnInsert: { name } },
      { upsert: true, runValidators: true },
    );
  }

  const categories = await Category.find({
    name: { $in: categoryNames },
  });
  const categoryByName = new Map(
    categories.map((category) => [category.name, category._id]),
  );

  for (const [name, description, price, stock, brand, categoryName] of products) {
    await Product.updateOne(
      { name, brand },
      {
        $set: {
          description,
          price,
          stock,
          category: categoryByName.get(categoryName),
          images: [],
        },
        $setOnInsert: { name, brand },
      },
      { upsert: true, runValidators: true },
    );
  }

  let admin = await User.findOne({ email: adminEmail }).select("+password");
  if (!admin) {
    admin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    });
  } else {
    admin.name = adminName;
    admin.password = adminPassword;
    admin.role = "admin";
  }
  await admin.save();

  console.log(
    `Seed complete: ${categoryNames.length} categories, ${products.length} products, admin ${adminEmail}`,
  );
}

try {
  await seed();
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
