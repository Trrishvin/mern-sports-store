import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Notice from "../components/Notice.jsx";
import PageHeading from "../components/PageHeading.jsx";
import { formatPrice } from "../components/ProductCard.jsx";
import api from "../lib/api.js";

const statusStyles = {
  Pending: "bg-amber-100 text-amber-800",
  Shipped: "bg-sky-100 text-sky-800",
  Delivered: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-slate-200 text-slate-700",
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const location = useLocation();
  const notice = location.state?.notice;

  useEffect(() => {
    let active = true;
    api
      .get("/orders/my")
      .then(({ data }) => {
        if (active) setOrders(data.data.orders);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Could not load your orders.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retryCount]);

  return (
    <main className="page-wrap min-h-[60vh] py-10 sm:py-14">
      <PageHeading
        eyebrow="Your game plan"
        title="My orders"
        description="Keep tabs on the gear that's on its way."
      />
      {notice && <div className="mb-6"><Notice tone="success">{notice}</Notice></div>}
      {error && (
        <div className="mb-5">
          <Notice>{error}</Notice>
          <button
            type="button"
            onClick={() => {
              setError("");
              setLoading(true);
              setRetryCount((count) => count + 1);
            }}
            className="mt-2 text-sm font-bold text-orange-700"
          >
            Retry loading orders
          </button>
        </div>
      )}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      ) : orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order._id}
              className="rounded-2xl bg-white p-5 shadow-sm sm:p-7"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Order placed{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-1 break-all font-bold text-slate-900">
                    #{order._id}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusStyles[order.status] ?? statusStyles.Pending}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="space-y-3 py-5">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.product?._id ?? item.product}-${index}`}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="text-slate-600">
                      {item.product?.name ?? "Product"}{" "}
                      <span className="text-slate-400">× {item.qty}</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                <span className="text-slate-500">
                  Cash on delivery · {order.shippingAddress.city},{" "}
                  {order.shippingAddress.country}
                </span>
                <span className="font-black text-slate-950">
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !error && (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
            <span className="text-5xl">📦</span>
            <h2 className="mt-4 text-xl font-black text-slate-950">
              No orders just yet
            </h2>
            <p className="mt-2 text-slate-500">
              Your next game-day upgrade is waiting.
            </p>
            <Link to="/products" className="button-primary mt-6 inline-flex">
              Browse equipment
            </Link>
          </div>
        )
      )}
    </main>
  );
}
