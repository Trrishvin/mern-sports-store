import { Router } from "express";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.json({
      success: true,
      data: { categories },
      message: "Categories retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", authMiddleware, adminMiddleware, async (req, res, next) => {
  const name = req.body?.name;
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Category name is required",
    });
  }

  try {
    const category = await Category.create({ name });
    return res.status(201).json({
      success: true,
      data: { category },
      message: "Category created successfully",
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
      message: "Invalid category ID",
    });
  }

  const name = req.body?.name;
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Category name is required",
    });
  }

  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, runValidators: true },
    );
    if (!category) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Category not found",
      });
    }

    return res.json({
      success: true,
      data: { category },
      message: "Category updated successfully",
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
        message: "Invalid category ID",
      });
    }

    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          data: null,
          message: "Category not found",
        });
      }

      if (await Product.exists({ category: category._id })) {
        return res.status(409).json({
          success: false,
          data: null,
          message: "Cannot delete a category that still has products",
        });
      }

      await category.deleteOne();
      return res.json({
        success: true,
        data: { category },
        message: "Category deleted successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
