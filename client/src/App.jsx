import { Link, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { CartProvider } from "./contexts/CartContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Products from "./pages/Products.jsx";
import Register from "./pages/Register.jsx";

function NotFound() {
  return (
    <section className="page-wrap py-24 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">
        404 / Out of bounds
      </p>
      <h1 className="mt-4 text-4xl font-black text-slate-950">Page not found</h1>
      <Link className="button-primary mt-8 inline-flex" to="/products">
        Explore equipment
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-[#f7f8f4]">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-orders"
                element={
                  <ProtectedRoute>
                    <MyOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute role="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <footer className="mt-20 border-t border-slate-200 bg-white">
              <div className="page-wrap flex flex-col gap-2 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-bold tracking-tight text-slate-900">
                  FIELD<span className="text-orange-600">WORK</span>
                </span>
                <span>Gear for the game. Built for the next play.</span>
              </div>
            </footer>
          </div>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
