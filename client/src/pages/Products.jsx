import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Notice from "../components/Notice.jsx";
import PageHeading from "../components/PageHeading.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import api from "../lib/api.js";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoriesError, setCategoriesError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const { addItem } = useCart();
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const categoryName = searchParams.get("categoryName");

  useEffect(() => {
    let active = true;
    setCategoriesError("");
    api
      .get("/categories")
      .then(({ data }) => {
        if (!active) return;
        const nextCategories = data.data.categories;
        setCategories(nextCategories);
        if (categoryName) {
          const match = nextCategories.find(
            (item) => item.name.toLowerCase() === categoryName.toLowerCase(),
          );
          if (match) {
            const next = new URLSearchParams(searchParams);
            next.delete("categoryName");
            next.set("category", match._id);
            setSearchParams(next, { replace: true });
          }
        }
      })
      .catch((requestError) => {
        if (active) {
          setCategoriesError(
            requestError.response?.data?.message ||
              "Could not load categories. You can still browse all products.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [categoryName, retryCount, searchParams, setSearchParams]);

  useEffect(() => {
    let active = true;
    const params = {
      page: searchParams.get("page") || 1,
      limit: 12,
      sort,
    };
    if (search.trim()) params.search = search.trim();
    if (category) params.category = category;

    setLoading(true);
    setError("");
    api
      .get("/products", { params })
      .then(({ data }) => {
        if (!active) return;
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Could not load products. Please try again.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search, category, retryCount, sort, searchParams]);

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("categoryName");
    next.delete("page");
    setSearchParams(next);
  }

  function changePage(page) {
    const next = new URLSearchParams(searchParams);
    next.set("page", page);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="page-wrap min-h-[60vh] py-10 sm:py-14">
      <PageHeading
        eyebrow="Find your next favorite"
        title="The equipment room"
        description="Good kit. No guesswork. Get exactly what you need to play your game."
      />

      <div className="mb-8 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:grid-cols-[1fr_220px_200px] sm:p-5">
        <label className="relative block">
          <span className="sr-only">Search equipment</span>
          <svg
            aria-hidden="true"
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            className="form-input pl-11"
            type="search"
            value={search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search bats, balls, brands..."
          />
        </label>
        <label>
          <span className="sr-only">Filter by category</span>
          <select
            className="form-input"
            value={category}
            onChange={(event) => updateFilter("category", event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort products</span>
          <select
            className="form-input"
            value={sort}
            onChange={(event) => updateFilter("sort", event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </label>
      </div>

      {categoriesError && (
        <div className="mb-5">
          <Notice>{categoriesError}</Notice>
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Notice>{error}</Notice>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-2 text-sm font-bold text-orange-700"
          >
            Retry loading products
          </button>
        </div>
      )}
      <div className="mb-5 flex items-center justify-between text-sm text-slate-500">
        <span>
          {loading
            ? "Finding your gear..."
            : `${pagination.total} ${pagination.total === 1 ? "item" : "items"}`}
        </span>
        {(search || category) && (
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="font-bold text-orange-600 hover:text-orange-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="animate-pulse">
              <div className="aspect-[4/3] rounded-2xl bg-white" />
              <div className="mt-4 h-4 w-2/3 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-1/3 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : products.length ? (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAdd={addItem}
              />
            ))}
          </div>
          {pagination.pages > 1 && (
            <nav
              aria-label="Product pages"
              className="mt-12 flex items-center justify-center gap-3"
            >
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => changePage(pagination.page - 1)}
                className="button-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-slate-500">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => changePage(pagination.page + 1)}
                className="button-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      ) : (
        !error && (
          <div className="rounded-2xl bg-white px-6 py-16 text-center">
            <span className="text-5xl">🔎</span>
            <h2 className="mt-4 text-xl font-black text-slate-900">
              No gear found
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Try another search or clear your filters.
            </p>
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="button-primary mt-6"
            >
              Reset filters
            </button>
          </div>
        )
      )}
    </main>
  );
}
