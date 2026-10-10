import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useCart } from "../contexts/CartContext.jsx";

const navClass = ({ isActive }) =>
  `text-sm font-semibold transition hover:text-orange-600 ${
    isActive ? "text-orange-600" : "text-slate-600"
  }`;

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="page-wrap flex min-h-[72px] items-center justify-between gap-4">
        <Link
          to="/"
          className="shrink-0 text-xl font-black tracking-[-0.07em] text-slate-950 sm:text-2xl"
          aria-label="Fieldwork home"
        >
          FIELD<span className="text-orange-600">WORK</span>
          <span className="ml-1 align-top text-[9px] font-bold tracking-normal text-slate-400">
            SUPPLY
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/products" className={navClass}>
            Shop all
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/my-orders" className={navClass}>
              My orders
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin" className={navClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated ? (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="max-w-28 truncate text-sm font-semibold text-slate-600">
                Hi, {user.name.split(" ")[0]}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-semibold text-slate-500 transition hover:text-orange-600"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden text-sm font-semibold text-slate-600 transition hover:text-orange-600 sm:inline"
            >
              Sign in
            </Link>
          )}
          <Link
            to="/cart"
            className="relative inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 px-3 text-sm font-bold text-slate-800 transition hover:border-slate-900"
            aria-label={`Shopping bag, ${itemCount} items`}
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M5 8h14l1 13H4L5 8Z" />
              <path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>
            <span className="hidden sm:inline">Bag</span>
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-orange-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
              {itemCount}
            </span>
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 border-t border-slate-100 py-2 md:hidden">
        <NavLink to="/" end className={navClass}>
          Home
        </NavLink>
        <NavLink to="/products" className={navClass}>
          Shop all
        </NavLink>
        {isAuthenticated ? (
          <>
            <NavLink to="/my-orders" className={navClass}>
              My orders
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin" className={navClass}>
                Admin
              </NavLink>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-semibold text-slate-600 transition hover:text-orange-600"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link to="/login" className={navClass({ isActive: false })}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
