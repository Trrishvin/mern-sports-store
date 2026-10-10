import { Link } from "react-router-dom";
import { useToast } from "../contexts/ToastContext.jsx";

const sportArt = {
  Cricket: ["from-amber-100 to-orange-200", "🏏"],
  Football: ["from-emerald-100 to-lime-200", "⚽"],
  Tennis: ["from-lime-100 to-yellow-200", "🎾"],
  Badminton: ["from-sky-100 to-cyan-200", "🏸"],
  Training: ["from-violet-100 to-fuchsia-200", "✳"],
};

export function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
  }).format(price);
}

export default function ProductCard({ product, onAdd }) {
  const notify = useToast();
  const categoryName = product.category?.name ?? "Training";
  const [background, emoji] = sportArt[categoryName] ?? sportArt.Training;
  const image = product.images?.[0];

  return (
    <article className="group min-w-0">
      <Link
        to={`/products/${product._id}`}
        className={`relative block aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br ${background}`}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <span className="select-none text-7xl drop-shadow-sm transition duration-500 group-hover:scale-110">
              {emoji}
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700">
          {categoryName}
        </span>
        {product.stock === 0 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Sold out
          </span>
        )}
      </Link>
      <div className="flex items-start justify-between gap-3 pt-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {product.brand}
          </p>
          <Link
            to={`/products/${product._id}`}
            className="mt-1 block truncate font-bold text-slate-900 transition hover:text-orange-600"
          >
            {product.name}
          </Link>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {formatPrice(product.price)}
          </p>
        </div>
        {onAdd && (
          <button
            type="button"
            aria-label={`Add ${product.name} to bag`}
            disabled={product.stock === 0}
            onClick={() => {
              onAdd(product);
              notify(`${product.name} added to your bag.`);
            }}
            className="mt-3 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 text-lg transition hover:border-slate-900 hover:bg-slate-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        )}
      </div>
    </article>
  );
}
