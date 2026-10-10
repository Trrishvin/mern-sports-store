import { Link } from "react-router-dom";
import PageHeading from "../components/PageHeading.jsx";
import { formatPrice } from "../components/ProductCard.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

export default function Cart() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const notify = useToast();

  return (
    <main className="page-wrap min-h-[60vh] py-10 sm:py-14">
      <PageHeading
        eyebrow="Your picks"
        title="Your bag"
        description={`${items.length} ${items.length === 1 ? "item" : "different items"} ready for game day.`}
      />
      {items.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm">
          <span className="text-5xl">🛍️</span>
          <h2 className="mt-4 text-2xl font-black text-slate-950">
            Your bag is taking a breather
          </h2>
          <p className="mt-2 text-slate-500">
            Find the gear that gets you ready to play.
          </p>
          <Link to="/products" className="button-primary mt-7 inline-flex">
            Explore equipment
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_350px]">
          <div className="divide-y divide-slate-200 rounded-2xl bg-white px-4 shadow-sm sm:px-6">
            {items.map(({ product, quantity }) => (
              <article
                key={product._id}
                className="flex gap-4 py-5 sm:gap-6"
              >
                <Link
                  to={`/products/${product._id}`}
                  className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#edf1e9] sm:h-32 sm:w-32"
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">🏅</span>
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {product.brand}
                    </p>
                    <Link
                      to={`/products/${product._id}`}
                      className="mt-1 block font-bold text-slate-900 hover:text-orange-600"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <div className="flex h-9 items-center rounded-full border border-slate-200">
                      <button
                        type="button"
                        aria-label={`Decrease ${product.name} quantity`}
                        onClick={() =>
                          updateQuantity(product._id, quantity - 1)
                        }
                        className="grid h-9 w-9 place-items-center text-slate-600 hover:text-slate-950"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-bold">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${product.name} quantity`}
                        disabled={quantity >= product.stock}
                        onClick={() =>
                          updateQuantity(product._id, quantity + 1)
                        }
                        className="grid h-9 w-9 place-items-center text-slate-600 hover:text-slate-950 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeItem(product._id);
                        notify(`${product.name} removed from your bag.`, "info");
                      }}
                      className="text-xs font-semibold text-slate-400 underline underline-offset-4 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">
              Order summary
            </h2>
            <div className="mt-5 space-y-3 border-b border-slate-200 pb-5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping</span>
                <span className="font-semibold text-emerald-700">Calculated at checkout</span>
              </div>
            </div>
            <div className="flex justify-between py-5 font-bold text-slate-950">
              <span>Estimated total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <Link
              to="/checkout"
              className="button-primary flex w-full justify-center py-4"
            >
              Continue to checkout
            </Link>
            <Link
              to="/products"
              className="mt-4 block text-center text-sm font-semibold text-slate-500 hover:text-orange-600"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
