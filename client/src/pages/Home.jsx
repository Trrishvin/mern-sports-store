import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Notice from "../components/Notice.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import api from "../lib/api.js";

const categoryTiles = [
  { name: "Cricket", note: "Built for the boundary", symbol: "🏏" },
  { name: "Football", note: "Make every touch count", symbol: "⚽" },
  { name: "Tennis", note: "Find your winning rhythm", symbol: "🎾" },
  { name: "Badminton", note: "Quick feet. Big rallies.", symbol: "🏸" },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const { addItem } = useCart();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .get("/products", { params: { limit: 4, sort: "newest" } })
      .then(({ data }) => {
        if (active) setProducts(data.data.products);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Could not load featured gear. Check that the shop API is running.",
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
    <>
      <section className="relative isolate overflow-hidden bg-[#172b24] text-white">
        <div className="absolute -right-20 -top-32 -z-10 h-[28rem] w-[28rem] rounded-full border border-white/10 sm:right-12 sm:top-[-14rem] sm:h-[42rem] sm:w-[42rem]" />
        <div className="absolute -right-6 top-10 -z-10 h-64 w-64 rotate-12 rounded-[3rem] border border-orange-300/20 bg-gradient-to-br from-orange-500/20 to-transparent sm:right-40 sm:top-20 sm:h-96 sm:w-96" />
        <div className="page-wrap grid min-h-[520px] items-center gap-10 py-16 sm:min-h-[580px] sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">
              The season starts here
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.07em] sm:text-7xl">
              SHOW UP.
              <br />
              <span className="text-orange-400">PLAY BIG.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/70 sm:text-lg">
              Good gear changes the way you play. Find your next favorite and
              get out there.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-orange-500 px-6 text-sm font-bold text-white transition hover:bg-orange-400"
              >
                Shop the collection <span className="ml-3">↗</span>
              </Link>
              <a
                href="#categories"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Find your sport
              </a>
            </div>
            <div className="mt-12 flex gap-8 border-t border-white/15 pt-6">
              <div>
                <p className="text-2xl font-black">01</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                  Find your edge
                </p>
              </div>
              <div>
                <p className="text-2xl font-black">02</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                  Make it count
                </p>
              </div>
              <div>
                <p className="text-2xl font-black">03</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                  Play again
                </p>
              </div>
            </div>
          </div>
          <div className="relative hidden h-[390px] items-center justify-center lg:flex">
            <div className="absolute h-[330px] w-[330px] rounded-full bg-orange-400/10 blur-2xl" />
            <div className="relative grid h-72 w-72 rotate-[-8deg] place-items-center rounded-[4rem] border border-white/15 bg-white/[0.06] shadow-2xl backdrop-blur sm:h-80 sm:w-80">
              <span className="select-none text-[10rem] drop-shadow-2xl">🏏</span>
              <span className="absolute bottom-7 right-[-28px] rotate-[8deg] rounded-full bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-wider shadow-xl">
                Built to compete
              </span>
              <span className="absolute left-[-30px] top-8 rotate-[8deg] rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-900">
                100% game ready
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="page-wrap py-16 sm:py-20">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
              Pick your lane
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">
              What do you play?
            </h2>
          </div>
          <Link
            to="/products"
            className="hidden text-sm font-bold text-slate-600 transition hover:text-orange-600 sm:block"
          >
            All equipment <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {categoryTiles.map((category, index) => (
            <Link
              key={category.name}
              to={`/products?categoryName=${encodeURIComponent(category.name)}`}
              className={`group overflow-hidden rounded-2xl p-4 transition hover:-translate-y-1 sm:p-6 ${
                index % 2 === 0
                  ? "bg-[#e9eee7] hover:bg-[#dfe8dc]"
                  : "bg-[#f0e9df] hover:bg-[#e9dfd0]"
              }`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-2xl shadow-sm">
                {category.symbol}
              </span>
              <p className="mt-7 text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                {category.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">{category.note}</p>
              <span className="mt-5 inline-block text-sm font-bold text-orange-600 transition group-hover:translate-x-1">
                Explore ↗
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="page-wrap">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
                Good things, in rotation
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">
                New & noteworthy
              </h2>
            </div>
            <Link
              to="/products"
              className="text-sm font-bold text-slate-600 transition hover:text-orange-600"
            >
              Shop all <span aria-hidden="true">↗</span>
            </Link>
          </div>
          {error && (
            <div className="mb-5">
              <Notice>{error}</Notice>
              <button
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
                className="mt-2 text-sm font-bold text-orange-700"
              >
                Retry loading featured gear
              </button>
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="animate-pulse">
                  <div className="aspect-[4/3] rounded-2xl bg-slate-100" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-1/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAdd={addItem}
                />
              ))}
            </div>
          ) : (
            !error && (
              <p className="rounded-2xl bg-[#f7f8f4] p-8 text-center text-sm text-slate-500">
                The collection is warming up. Check back soon.
              </p>
            )
          )}
        </div>
      </section>
    </>
  );
}
