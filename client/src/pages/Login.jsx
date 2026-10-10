import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Notice from "../components/Notice.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const notify = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const destination = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search ?? ""}`
    : "/";

  if (isAuthenticated) return <Navigate to={destination} replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      const message = "Enter a valid email address.";
      setError(message);
      notify(message, "error");
      return;
    }
    if (!password) {
      const message = "Enter your password.";
      setError(message);
      notify(message, "error");
      return;
    }
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      notify("You are signed in.");
      navigate(destination, { replace: true });
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "Could not sign in. Please try again.";
      setError(message);
      notify(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-wrap grid min-h-[68vh] place-items-center py-12">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
          Good to have you back
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Your next great session starts with the right gear.
        </p>
        {error && <div className="mt-5"><Notice>{error}</Notice></div>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email
            </span>
            <input
              className="form-input"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Password
            </span>
            <input
              className="form-input"
              type="password"
              autoComplete="current-password"
              maxLength={72}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="button-primary mt-2 w-full py-3.5 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          New here?{" "}
          <Link
            to="/register"
            state={location.state}
            className="font-bold text-orange-600 hover:text-orange-700"
          >
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
