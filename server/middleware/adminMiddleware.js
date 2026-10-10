export function adminMiddleware(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      data: null,
      message: "Admin access is required",
    });
  }

  return next();
}
