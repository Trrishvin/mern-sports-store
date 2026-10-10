import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Notice from "../components/Notice.jsx";
import PageHeading from "../components/PageHeading.jsx";
import { formatPrice } from "../components/ProductCard.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import api from "../lib/api.js";

const emptyAddress = {
  fullName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  phone: "",
};

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const notify = useToast();
  const [address, setAddress] = useState({
    ...emptyAddress,
    fullName: user?.name ?? "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (items.length === 0) return <Navigate to="/cart" replace />;

  function updateField(event) {
    setAddress((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function placeOrder(event) {
    event.preventDefault();
    const requiredFields = [
      "fullName",
      "addressLine1",
      "city",
      "state",
      "postalCode",
      "country",
      "phone",
    ];
    if (requiredFields.some((field) => !address[field].trim())) {
      setError("Complete all required shipping fields.");
      notify("Complete all required shipping fields.", "error");
      return;
    }
    if (!/^\+?[0-9\s().-]{7,20}$/.test(address.phone.trim())) {
      setError("Enter a valid phone number.");
      notify("Enter a valid phone number.", "error");
      return;
    }
    if (address.postalCode.trim().length < 3) {
      setError("Enter a valid postal code.");
      notify("Enter a valid postal code.", "error");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/orders", {
        items: items.map(({ product, quantity }) => ({
          product: product._id,
          qty: quantity,
        })),
        shippingAddress: Object.fromEntries(
          Object.entries(address).map(([key, value]) => [key, value.trim()]),
        ),
      });
      clearCart();
      const message = `Order placed. Your order ID is ${data.data.order._id}.`;
      notify("Order placed successfully.");
      navigate("/my-orders", {
        replace: true,
        state: { notice: message },
      });
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "We could not place your order. Please try again.";
      setError(message);
      notify(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const fields = [
    ["fullName", "Full name", "text", true],
    ["phone", "Phone number", "tel", true],
    ["addressLine1", "Address line 1", "text", true],
    ["addressLine2", "Address line 2 (optional)", "text", false],
    ["city", "City", "text", true],
    ["state", "State / region", "text", true],
    ["postalCode", "Postal code", "text", true],
    ["country", "Country", "text", true],
  ];

  return (
    <main className="page-wrap min-h-[60vh] py-10 sm:py-14">
      <PageHeading
        eyebrow="Almost game time"
        title="Checkout"
        description="Where should we send your gear?"
      />
      <form
        onSubmit={placeOrder}
        className="grid items-start gap-8 lg:grid-cols-[1fr_360px]"
      >
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-xl font-black text-slate-950">
            Shipping details
          </h2>
          {error && <div className="mt-5"><Notice>{error}</Notice></div>}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {fields.map(([name, label, type, required]) => (
              <label
                key={name}
                className={name === "addressLine1" || name === "addressLine2" ? "sm:col-span-2" : ""}
              >
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  {label}
                </span>
                <input
                  className="form-input"
                  type={type}
                  name={name}
                  value={address[name]}
                  onChange={updateField}
                  required={required}
                  autoComplete={name}
                />
              </label>
            ))}
          </div>
          <div className="mt-8 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-xl">
                💵
              </span>
              <div>
                <p className="font-bold text-slate-900">Cash on Delivery</p>
                <p className="mt-1 text-sm text-slate-600">
                  Pay for your order when it arrives. No online payment needed.
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Your order</h2>
          <div className="mt-5 max-h-64 space-y-4 overflow-y-auto">
            {items.map(({ product, quantity }) => (
              <div key={product._id} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {quantity} ×
                  </span>{" "}
                  {product.name}
                </span>
                <span className="shrink-0 font-semibold text-slate-900">
                  {formatPrice(product.price * quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t border-slate-200 pt-5 font-bold text-slate-950">
            <span>Total due on delivery</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="button-primary mt-6 w-full py-4 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? "Placing order..." : "Place order"}
          </button>
          <Link
            to="/cart"
            className="mt-4 block text-center text-sm font-semibold text-slate-500 hover:text-orange-600"
          >
            Back to bag
          </Link>
        </aside>
      </form>
    </main>
  );
}
