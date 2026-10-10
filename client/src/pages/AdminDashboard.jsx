import { useCallback, useEffect, useState } from "react";
import Notice from "../components/Notice.jsx";
import PageHeading from "../components/PageHeading.jsx";
import { formatPrice } from "../components/ProductCard.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import api from "../lib/api.js";

const statuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
const initialProduct = {
  name: "",
  description: "",
  price: "",
  stock: "",
  brand: "",
  category: "",
  images: "",
};

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

function StatCard({ label, value, note, symbol }) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{note}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-xl text-orange-600">
          {symbol}
        </span>
      </div>
    </article>
  );
}

function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export default function AdminDashboard() {
  const notify = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [productForm, setProductForm] = useState(initialProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  const refreshDashboard = useCallback(async () => {
    setPageError("");
    const [categoriesResult, ordersResult] = await Promise.all([
      api.get("/categories"),
      api.get("/orders"),
    ]);

    const firstPage = await api.get("/products", {
      params: { limit: 100, page: 1, sort: "newest" },
    });
    const { products: initialProducts, pagination } = firstPage.data.data;
    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(pagination.pages - 1, 0) }, (_, index) =>
        api.get("/products", {
          params: { limit: 100, page: index + 2, sort: "newest" },
        }),
      ),
    );

    setCategories(categoriesResult.data.data.categories);
    setOrders(ordersResult.data.data.orders);
    setProducts([
      ...initialProducts,
      ...remainingPages.flatMap((result) => result.data.data.products),
    ]);
  }, []);

  useEffect(() => {
    let active = true;
    refreshDashboard()
      .catch((error) => {
        if (active) {
          setPageError(
            getErrorMessage(error, "Could not load the admin dashboard."),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshDashboard]);

  function startProductEdit(product) {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      brand: product.brand,
      category: product.category?._id ?? "",
      images: (product.images ?? []).join("\n"),
    });
    setActiveSection("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetProductForm() {
    setEditingProductId(null);
    setProductForm(initialProduct);
  }

  async function submitProduct(event) {
    event.preventDefault();
    const requiredFields = ["name", "description", "brand", "category"];
    if (requiredFields.some((field) => !productForm[field].trim())) {
      const message = "Complete all required product fields.";
      setPageError(message);
      notify(message, "error");
      return;
    }
    if (
      !Number.isFinite(Number(productForm.price)) ||
      Number(productForm.price) < 0
    ) {
      const message = "Enter a valid non-negative product price.";
      setPageError(message);
      notify(message, "error");
      return;
    }
    if (
      !Number.isSafeInteger(Number(productForm.stock)) ||
      Number(productForm.stock) < 0
    ) {
      const message = "Stock must be a non-negative whole number.";
      setPageError(message);
      notify(message, "error");
      return;
    }
    const images = productForm.images
      .split(/\r?\n/)
      .map((image) => image.trim())
      .filter(Boolean);
    if (
      images.some((image) => {
        try {
          const url = new URL(image);
          return !["http:", "https:"].includes(url.protocol);
        } catch {
          return true;
        }
      })
    ) {
      const message = "Each image must be a valid http or https URL.";
      setPageError(message);
      notify(message, "error");
      return;
    }

    setSavingProduct(true);
    setNotice("");
    setPageError("");
    const body = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      brand: productForm.brand.trim(),
      category: productForm.category,
      images,
    };

    try {
      if (editingProductId) {
        await api.patch(`/products/${editingProductId}`, body);
        setNotice("Product updated.");
        notify("Product updated.");
      } else {
        await api.post("/products", body);
        setNotice("Product added.");
        notify("Product added.");
      }
      resetProductForm();
      await refreshDashboard();
    } catch (error) {
      const message = getErrorMessage(error, "Could not save this product.");
      setPageError(message);
      notify(message, "error");
    } finally {
      setSavingProduct(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return;
    }
    setPageError("");
    setNotice("");
    setDeletingProductId(product._id);
    try {
      await api.delete(`/products/${product._id}`);
      setProducts((current) =>
        current.filter((item) => item._id !== product._id),
      );
      setNotice("Product deleted.");
      notify("Product deleted.");
      if (editingProductId === product._id) resetProductForm();
    } catch (error) {
      const message = getErrorMessage(error, "Could not delete this product.");
      setPageError(message);
      notify(message, "error");
    } finally {
      setDeletingProductId(null);
    }
  }

  async function submitCategory(event) {
    event.preventDefault();
    if (categoryName.trim().length < 2) {
      const message = "Category name must be at least 2 characters.";
      setPageError(message);
      notify(message, "error");
      return;
    }
    setSavingCategory(true);
    setPageError("");
    setNotice("");
    try {
      if (editingCategoryId) {
        await api.patch(`/categories/${editingCategoryId}`, {
          name: categoryName.trim(),
        });
        setNotice("Category updated.");
        notify("Category updated.");
      } else {
        await api.post("/categories", { name: categoryName.trim() });
        setNotice("Category added.");
        notify("Category added.");
      }
      setCategoryName("");
      setEditingCategoryId(null);
      await refreshDashboard();
    } catch (error) {
      const message = getErrorMessage(error, "Could not save this category.");
      setPageError(message);
      notify(message, "error");
    } finally {
      setSavingCategory(false);
    }
  }

  function startCategoryEdit(category) {
    setEditingCategoryId(category._id);
    setCategoryName(category.name);
  }

  async function deleteCategory(category) {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    setPageError("");
    setNotice("");
    setDeletingCategoryId(category._id);
    try {
      await api.delete(`/categories/${category._id}`);
      setCategories((current) =>
        current.filter((item) => item._id !== category._id),
      );
      setNotice("Category deleted.");
      notify("Category deleted.");
    } catch (error) {
      const message = getErrorMessage(error, "Could not delete this category.");
      setPageError(message);
      notify(message, "error");
    } finally {
      setDeletingCategoryId(null);
    }
  }

  async function updateOrderStatus(orderId, status) {
    setUpdatingOrderId(orderId);
    setPageError("");
    setNotice("");
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, { status });
      setOrders((current) =>
        current.map((order) =>
          order._id === orderId ? data.data.order : order,
        ),
      );
      setNotice("Order status updated.");
      notify("Order status updated.");
    } catch (error) {
      const message = getErrorMessage(error, "Could not update order status.");
      setPageError(message);
      notify(message, "error");
    } finally {
      setUpdatingOrderId(null);
    }

    async function retryDashboard() {
      setRefreshing(true);
      setPageError("");
      try {
        await refreshDashboard();
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Could not load the admin dashboard.",
        );
        setPageError(message);
        notify(message, "error");
      } finally {
        setRefreshing(false);
      }
    }
  }

  const revenue = orders.reduce(
    (total, order) => total + (Number(order.totalPrice) || 0),
    0,
  );
  const sections = [
    ["overview", "Overview"],
    ["products", `Products (${products.length})`],
    ["categories", `Categories (${categories.length})`],
    ["orders", `Orders (${orders.length})`],
  ];

  return (
    <main className="page-wrap min-h-[65vh] py-8 sm:py-12">
      <PageHeading
        eyebrow="Fieldwork / Control room"
        title="Admin dashboard"
        description="Keep the collection in shape and orders moving."
      />

      <nav
        aria-label="Dashboard sections"
        className="mb-7 flex gap-2 overflow-x-auto pb-2"
      >
        {sections.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition ${
              activeSection === id
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-orange-600"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {pageError && (
        <div className="mb-5">
          <Notice>{pageError}</Notice>
          <button
            type="button"
            onClick={retryDashboard}
            disabled={refreshing}
            className="mt-2 text-sm font-bold text-orange-700 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Retry loading dashboard"}
          </button>
        </div>
      )}
      {notice && (
        <div className="mb-5">
          <Notice tone="success">{notice}</Notice>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      ) : (
        <>
          {(activeSection === "overview" || activeSection === "products") && (
            <section className="mb-9 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Total products"
                value={products.length.toLocaleString()}
                note="Across the full collection"
                symbol="▦"
              />
              <StatCard
                label="Total orders"
                value={orders.length.toLocaleString()}
                note="All order statuses"
                symbol="↗"
              />
              <StatCard
                label="Order revenue"
                value={formatPrice(revenue)}
                note="Combined value of all orders"
                symbol="$"
              />
            </section>
          )}

          {(activeSection === "overview" || activeSection === "products") && (
            <section className="mb-10 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-7">
              <SectionTitle
                eyebrow="Catalog"
                title={editingProductId ? "Edit product" : "Add a product"}
                action={
                  editingProductId && (
                    <button
                      type="button"
                      onClick={resetProductForm}
                      className="text-sm font-bold text-slate-500 hover:text-slate-900"
                    >
                      Cancel edit
                    </button>
                  )
                }
              />
              {categories.length === 0 ? (
                <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  Add a category before creating products.
                </p>
              ) : (
                <form
                  onSubmit={submitProduct}
                  className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <label>
                    <span className="form-label">Product name</span>
                    <input
                      className="form-input"
                      required
                      minLength={2}
                      maxLength={120}
                      value={productForm.name}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          name: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    <span className="form-label">Brand</span>
                    <input
                      className="form-input"
                      required
                      maxLength={80}
                      value={productForm.brand}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          brand: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    <span className="form-label">Category</span>
                    <select
                      className="form-input"
                      required
                      value={productForm.category}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          category: event.target.value,
                        })
                      }
                    >
                      <option value="">Choose a category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="form-label">Price</span>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      max="100000000"
                      required
                      value={productForm.price}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          price: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    <span className="form-label">Stock</span>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="1"
                      max="100000000"
                      required
                      value={productForm.stock}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          stock: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="sm:col-span-2 lg:col-span-3">
                    <span className="form-label">Description</span>
                    <textarea
                      className="form-input min-h-24 py-3"
                      required
                      minLength={5}
                      maxLength={2000}
                      value={productForm.description}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          description: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="sm:col-span-2 lg:col-span-3">
                    <span className="form-label">Image URLs (one per line)</span>
                    <textarea
                      className="form-input min-h-20 py-3"
                      maxLength={4000}
                      value={productForm.images}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          images: event.target.value,
                        })
                      }
                    />
                  </label>
                  <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
                    <button
                      type="submit"
                      disabled={savingProduct}
                      className="button-primary disabled:opacity-60"
                    >
                      {savingProduct
                        ? "Saving..."
                        : editingProductId
                          ? "Save changes"
                          : "Add product"}
                    </button>
                    {editingProductId && (
                      <button
                        type="button"
                        onClick={resetProductForm}
                        className="button-secondary"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </section>
          )}

          {(activeSection === "overview" || activeSection === "products") && (
            <section className="mb-10">
              <SectionTitle
                eyebrow="Inventory"
                title="Products"
                action={
                  <span className="text-sm text-slate-500">
                    {products.length} total
                  </span>
                }
              />
              <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-bold">Product</th>
                        <th className="px-5 py-4 font-bold">Category</th>
                        <th className="px-5 py-4 font-bold">Price</th>
                        <th className="px-5 py-4 font-bold">Stock</th>
                        <th className="px-5 py-4 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((product) => (
                        <tr key={product._id}>
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">
                              {product.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {product.brand}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {product.category?.name ?? "—"}
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-800">
                            {formatPrice(product.price)}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={
                                product.stock > 0
                                  ? "font-semibold text-emerald-700"
                                  : "font-semibold text-red-600"
                              }
                            >
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => startProductEdit(product)}
                                className="font-bold text-slate-600 hover:text-orange-600"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={deletingProductId === product._id}
                                onClick={() => deleteProduct(product)}
                                className="font-bold text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                {deletingProductId === product._id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {products.length === 0 && (
                    <p className="p-8 text-center text-sm text-slate-500">
                      No products yet. Add one using the form above.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {(activeSection === "overview" ||
            activeSection === "categories") && (
            <section className="mb-10">
              <SectionTitle
                eyebrow="Shop structure"
                title="Categories"
                action={
                  <span className="text-sm text-slate-500">
                    {categories.length} total
                  </span>
                }
              />
              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white px-5 shadow-sm ring-1 ring-slate-200/70">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      className="flex items-center justify-between gap-3 py-4"
                    >
                      <span className="font-bold text-slate-800">
                        {category.name}
                      </span>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startCategoryEdit(category)}
                          className="text-sm font-bold text-slate-500 hover:text-orange-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletingCategoryId === category._id}
                          onClick={() => deleteCategory(category)}
                          className="text-sm font-bold text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {deletingCategoryId === category._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="py-8 text-sm text-slate-500">
                      No categories yet.
                    </p>
                  )}
                </div>
                <form
                  onSubmit={submitCategory}
                  className="h-fit rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"
                >
                  <h3 className="font-black text-slate-900">
                    {editingCategoryId ? "Edit category" : "Add a category"}
                  </h3>
                  <label className="mt-4 block">
                    <span className="form-label">Category name</span>
                    <input
                      className="form-input"
                      required
                      minLength={2}
                      maxLength={80}
                      value={categoryName}
                      onChange={(event) => setCategoryName(event.target.value)}
                    />
                  </label>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={savingCategory}
                      className="button-primary"
                    >
                      {savingCategory
                        ? "Saving..."
                        : editingCategoryId
                          ? "Save category"
                          : "Add category"}
                    </button>
                    {editingCategoryId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(null);
                          setCategoryName("");
                        }}
                        className="button-secondary"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </section>
          )}

          {(activeSection === "overview" || activeSection === "orders") && (
            <section className="mb-10">
              <SectionTitle
                eyebrow="Fulfillment"
                title="Orders"
                action={
                  <span className="text-sm text-slate-500">
                    {orders.length} total
                  </span>
                }
              />
              <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-bold">Order</th>
                        <th className="px-5 py-4 font-bold">Customer</th>
                        <th className="px-5 py-4 font-bold">Date</th>
                        <th className="px-5 py-4 font-bold">Total</th>
                        <th className="px-5 py-4 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">
                              #{order._id.slice(-8).toUpperCase()}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {order.items.length}{" "}
                              {order.items.length === 1 ? "item" : "items"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">
                              {order.user?.name ?? "Unknown customer"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {order.user?.email ?? ""}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-900">
                            {formatPrice(order.totalPrice)}
                          </td>
                          <td className="px-5 py-4">
                            <select
                              className="form-input min-h-9 w-36 py-1 text-xs font-bold"
                              value={order.status}
                              disabled={updatingOrderId === order._id}
                              onChange={(event) =>
                                updateOrderStatus(order._id, event.target.value)
                              }
                              aria-label={`Update order ${order._id} status`}
                            >
                              {statuses.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 && (
                    <p className="p-8 text-center text-sm text-slate-500">
                      No orders to fulfill yet.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
