import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Notice from "../components/Notice.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const notify = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
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
    if (name.trim().length < 2 || name.trim().length > 100) {
      const message = "Name must be between 2 and 100 characters.";
      setError(message);
      notify(message, "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      const message = "Enter a valid email address.";
      setError(message);
      notify(message, "error");
      return;
    }
    if (password.length < 8) {
      const message = "Password must contain at least 8 characters.";
      setError(message);
      notify(message, "error");
      return;
    }
    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      notify("Your account is ready.");
      navigate(destination, { replace: true });
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        "Could not create your account. Please try again.";
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
          Join the line-up
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">
          Create account
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Save your orders and get back to the good stuff faster.
        </p>
        {error && <div className="mt-5"><Notice>{error}</Notice></div>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Name
            </span>
            <input
              className="form-input"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
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
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <span className="mt-1.5 block text-xs text-slate-400">
              Use at least 8 characters.
            </span>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="button-primary mt-2 w-full py-3.5 disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            state={location.state}
            className="font-bold text-orange-600 hover:text-orange-700"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
