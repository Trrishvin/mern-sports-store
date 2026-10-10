import { Router } from "express";
import mongoose from "mongoose";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const router = Router();
const orderStatuses = ["Pending", "Shipped", "Delivered", "Cancelled"];

router.post("/", authMiddleware, async (req, res, next) => {
  const { items, shippingAddress } = req.body ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "An order must contain at least one item",
    });
  }

  const quantities = new Map();
  for (const item of items) {
    if (
      !item ||
      typeof item.product !== "string" ||
      !mongoose.isValidObjectId(item.product) ||
      !Number.isSafeInteger(item.qty) ||
      item.qty < 1
    ) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Each item must include a valid product ID and positive whole-number quantity",
      });
    }

    const productId = new mongoose.Types.ObjectId(item.product).toString();
    const combinedQty = (quantities.get(productId) ?? 0) + item.qty;
    if (!Number.isSafeInteger(combinedQty)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Requested quantity is too large",
      });
    }
    quantities.set(productId, combinedQty);
  }

  const productIds = [...quantities.keys()];
  const reserved = [];

  try {
    const products = await Product.find({ _id: { $in: productIds } });
    const productsById = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    if (productIds.some((id) => !productsById.has(id))) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "One or more products were not found",
      });
    }

    const orderItems = [];
    for (const [productId, qty] of quantities) {
      const product = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true },
      );

      if (!product) {
        await restoreReservedStock(reserved);
        return res.status(409).json({
          success: false,
          data: null,
          message: "One or more products do not have enough stock",
        });
      }

      reserved.push({ productId, qty });
      orderItems.push({
        product: product._id,
        qty,
        price: product.price,
      });
    }

    const totalPrice = orderItems.reduce(
      (total, item) => total + item.price * item.qty,
      0,
    );
    if (!Number.isFinite(totalPrice)) {
      await restoreReservedStock(reserved);
      return res.status(400).json({
        success: false,
        data: null,
        message: "Order total is outside the supported range",
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      totalPrice,
    });
    await order.populate([
      { path: "user", select: "name email" },
      { path: "items.product", select: "name brand images" },
    ]);

    return res.status(201).json({
      success: true,
      data: { order },
      message: "Order created successfully",
    });
  } catch (error) {
    try {
      await restoreReservedStock(reserved);
    } catch (rollbackError) {
      console.error("Failed to restore reserved product stock:", rollbackError);
    }
    return next(error);
  }
});

router.get("/my", authMiddleware, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name brand images")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { orders },
      message: "Your orders retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/", authMiddleware, adminMiddleware, async (_req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name brand images")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { orders },
      message: "Orders retrieved successfully",
    });
  } catch (error) {
    return next(error);
  }
});

router.put(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid order ID",
      });
    }

    const { status } = req.body ?? {};
    if (!orderStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Status must be one of: ${orderStatuses.join(", ")}`,
      });
    }

    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true },
      )
        .populate("user", "name email")
        .populate("items.product", "name brand images");

      if (!order) {
        return res.status(404).json({
          success: false,
          data: null,
          message: "Order not found",
        });
      }

      return res.json({
        success: true,
        data: { order },
        message: "Order status updated successfully",
      });
    } catch (error) {
      return next(error);
    }
  },
);

async function restoreReservedStock(reserved) {
  while (reserved.length > 0) {
    const item = reserved[reserved.length - 1];
    await Product.updateOne(
      { _id: item.productId },
      { $inc: { stock: item.qty } },
    );
    reserved.pop();
  }
}

export default router;
