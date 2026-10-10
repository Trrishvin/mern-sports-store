import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Notice from "../components/Notice.jsx";
import { formatPrice } from "../components/ProductCard.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import api from "../lib/api.js";

const art = {
  Cricket: ["from-amber-100 to-orange-200", "🏏"],
  Football: ["from-emerald-100 to-lime-200", "⚽"],
  Tennis: ["from-lime-100 to-yellow-200", "🎾"],
  Badminton: ["from-sky-100 to-cyan-200", "🏸"],
  Training: ["from-violet-100 to-fuchsia-200", "✳"],
};

export default function ProductDetails() {
  const { id } = useParams();
  const { addItem } = useCart();
  const notify = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setProduct(null);
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        if (active) setProduct(data.data.product);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message || "Could not find this item.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, retryCount]);

  if (loading) {
    return (
      <main className="page-wrap py-12">
        <div className="grid animate-pulse gap-8 md:grid-cols-2">
          <div className="aspect-square rounded-3xl bg-white" />
          <div className="space-y-4 py-8">
            <div className="h-5 w-1/3 rounded bg-white" />
            <div className="h-10 w-4/5 rounded bg-white" />
            <div className="h-5 w-1/4 rounded bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="page-wrap min-h-[60vh] py-16">
        <Notice>{error || "Product not found"}</Notice>
        {error && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setRetryCount((count) => count + 1);
            }}
            className="mt-3 text-sm font-bold text-orange-700"
          >
            Retry
          </button>
        )}
        <Link to="/products" className="button-primary mt-6 inline-flex">
          Back to shop
        </Link>
      </main>
    );
  }

  const category = product.category?.name ?? "Training";
  const [background, emoji] = art[category] ?? art.Training;

  return (
    <main className="page-wrap py-8 sm:py-12">
      <div className="mb-6 text-sm text-slate-500">
        <Link to="/products" className="hover:text-orange-600">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{product.name}</span>
      </div>
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div
          className={`relative grid aspect-square overflow-hidden rounded-3xl bg-gradient-to-br ${background}`}
        >
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="place-self-center text-[10rem] sm:text-[14rem]">
              {emoji}
            </span>
          )}
          <span className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            {category}
          </span>
        </div>
        <div className="flex flex-col justify-center py-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
            {product.brand}
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-0.06em] text-slate-950 sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-5 text-2xl font-bold text-slate-900">
            {formatPrice(product.price)}
          </p>
          <p className="mt-6 leading-7 text-slate-600">{product.description}</p>
          <p className="mt-5 text-sm font-semibold">
            {product.stock > 0 ? (
              <span className="text-emerald-700">
                ● In stock · {product.stock} available
              </span>
            ) : (
              <span className="text-red-600">Currently out of stock</span>
            )}
          </p>
          <button
            type="button"
            disabled={product.stock === 0}
            onClick={() => {
              addItem(product);
              setAdded(true);
              notify(`${product.name} added to your bag.`);
              window.setTimeout(() => setAdded(false), 2200);
            }}
            className="button-primary mt-7 w-full py-4 sm:w-auto sm:px-12"
          >
            {added ? "Added to bag ✓" : "Add to bag"}
          </button>
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-200 pt-6 text-sm">
            <div>
              <p className="font-bold text-slate-800">Cash on delivery</p>
              <p className="mt-1 text-slate-500">Pay when it arrives.</p>
            </div>
            <div>
              <p className="font-bold text-slate-800">Ready for the game</p>
              <p className="mt-1 text-slate-500">Picked for active play.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
