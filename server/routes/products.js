import { Router } from "express";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();
const sortableFields = {
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  newest: { createdAt: -1 },
  "name-asc": { name: 1 },
};

function parseNonNegativeNumber(value) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function parsePositiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === undefined) return fallback;
  if (typeof value !== "string") return null;
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 && number <= maximum
    ? number
    : null;
}

router.get("/", async (req, res, next) => {
  const minPrice = parseNonNegativeNumber(req.query.minPrice);
  const maxPrice = parseNonNegativeNumber(req.query.maxPrice);
  const page = parsePositiveInteger(req.query.page, 1);
  const limit = parsePositiveInteger(req.query.limit, 12, 100);
  const sort = req.query.sort || "newest";
  const category = req.query.category;
  const search = req.query.search ?? req.query.q;

  if (
    minPrice === null ||
    maxPrice === null ||
    (minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice) ||
    page === null ||
    limit === null ||
    typeof sort !== "string" ||
    !Object.hasOwn(sortableFields, sort) ||
    (category !== undefined &&
      (typeof category !== "string" || !mongoose.isValidObjectId(category))) ||
    (search !== undefined && typeof search !== "string")
  ) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Invalid product filter, sort, or pagination parameter",
    });
  }

  const filter = {};
  if (typeof search === "string" && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = ["name", "description", "brand"].map((field) => ({
      [field]: { $regex: escapedSearch, $options: "i" },
    }));
  }
  if (category) filter.category = category;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  try {
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name")
        .sort(sortableFields[sort])
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      message: "Products retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Invalid product ID",
    });
  }

  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name",
    );
    if (!product) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      data: { product },
      message: "Product retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    if (
      typeof req.body?.category !== "string" ||
      !mongoose.isValidObjectId(req.body.category) ||
      !(await Category.exists({ _id: req.body.category }))
    ) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "A valid category is required",
      });
    }

    const product = await Product.create(req.body);
    await product.populate("category", "name");
    return res.status(201).json({
      success: true,
      data: { product },
      message: "Product created successfully",
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", authMiddleware, adminMiddleware, async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Invalid product ID",
    });
  }

  const fields = [
    "name",
    "description",
    "price",
    "stock",
    "brand",
    "category",
    "images",
  ];
  const updates = Object.fromEntries(
    Object.entries(req.body ?? {}).filter(([key]) => fields.includes(key)),
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Provide at least one valid product field to update",
    });
  }

  try {
    if (
      updates.category !== undefined &&
      (typeof updates.category !== "string" ||
        !mongoose.isValidObjectId(updates.category) ||
        !(await Category.exists({ _id: updates.category })))
    ) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "A valid category is required",
      });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("category", "name");
    if (!product) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      data: { product },
      message: "Product updated successfully",
    });
  } catch (error) {
    return next(error);
  }
});

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid product ID",
      });
    }

    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          data: null,
          message: "Product not found",
        });
      }

      return res.json({
        success: true,
        data: { product },
        message: "Product deleted successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
