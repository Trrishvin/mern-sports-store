import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

const API_URL =
  "https://dummyjson.com/products/category/sports-accessories?limit=0";

const USD_TO_INR = 96.87;

const categoryNames = ["Cricket", "Football", "Tennis", "Badminton", "Training"];

const sportCategories = {
  cricket: "Cricket",
  football: "Football",
  "american football": "Football",
  "american-football": "Football",
  tennis: "Tennis",
  badminton: "Badminton",
};

function resolveCategoryName(product) {
  const sport = (product.tags ?? []).find(
    (tag) => typeof tag === "string" && tag.toLowerCase() !== "sports equipment",
  );
  return sportCategories[sport?.toLowerCase()] ?? "Training";
}

async function fetchProducts() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`DummyJSON request failed with status ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data.products) || data.products.length === 0) {
    throw new Error("DummyJSON returned no products");
  }
  return data.products;
}

async function seed() {
  await connectDB();

  const apiProducts = await fetchProducts();

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

  let imported = 0;
  for (const item of apiProducts) {
    const name = item.title?.trim();
    const description = item.description?.trim();
    if (!name || !description) continue;

    const brand = item.brand?.trim() || "Generic";
    const price =
      Number.isFinite(item.price) && item.price >= 0
        ? Math.round(item.price * USD_TO_INR)
        : 0;
    const stock =
      Number.isInteger(item.stock) && item.stock >= 0 ? item.stock : 0;
    const images = (item.images ?? []).filter(
      (image) => typeof image === "string" && image.trim() !== "",
    );
    const categoryName = resolveCategoryName(item);

    await Product.updateOne(
      { name, brand },
      {
        $set: {
          description,
          price,
          stock,
          category: categoryByName.get(categoryName),
          images,
        },
        $setOnInsert: { name, brand },
      },
      { upsert: true, runValidators: true },
    );
    imported += 1;
  }

  const productCount = await Product.countDocuments();
  const categoryCount = await Category.countDocuments();
  console.log(
    `API seed complete: ${imported} products imported from DummyJSON, catalog now has ${productCount} products and ${categoryCount} categories`,
  );
}

try {
  await seed();
} catch (error) {
  console.error("API seed failed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
