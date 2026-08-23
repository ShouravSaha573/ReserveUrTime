import { useState } from "react";
import {
  Link,
  useNavigate
} from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function CustomerRegisterPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [state, setState] = useState({
    loading: false,
    error: ""
  });

  function update(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setState({ loading: true, error: "" });

    try {
      const data = await apiFetch(
        "/auth/customer/register",
        {
          method: "POST",
          body: form,
          retryGet: false
        }
      );

      setUser(data.user);
      navigate("/restaurants", { replace: true });
    } catch (error) {
      setState({
        loading: false,
        error: error.message
      });
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:px-8">
      <div>
        <p className="text-xs uppercase tracking-[.3em] text-white/40">
          Customer account
        </p>
        <h1 className="mt-5 font-display text-5xl md:text-7xl">
          Register
        </h1>
        <p className="mt-6 max-w-lg leading-7 text-white/55">
          Registration always creates a customer
          account. Admin accounts cannot be created
          from this page.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="surface rounded-[2rem] p-6 md:p-8"
      >
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm text-white/60">
              Name
            </span>
            <input
              className="input-field"
              name="name"
              value={form.name}
              onChange={update}
              autoComplete="name"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-white/60">
              Email
            </span>
            <input
              className="input-field"
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              autoComplete="email"
              maxLength={50}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-white/60">
              Phone (optional)
            </span>
            <input
              className="input-field"
              name="phone"
              value={form.phone}
              onChange={update}
              autoComplete="tel"
              maxLength={20}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-white/60">
              Password
            </span>
            <input
              className="input-field"
              type="password"
              name="password"
              value={form.password}
              onChange={update}
              autoComplete="new-password"
              minLength="8"
              required
            />
            <span className="mt-2 block text-xs text-white/35">
              At least 8 characters with a letter and
              a number.
            </span>
          </label>
        </div>

        {state.error && (
          <p className="mt-5 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {state.error}
          </p>
        )}

        <button
          className="btn-primary mt-7 w-full"
          disabled={state.loading}
        >
          {state.loading
            ? "Creating account..."
            : "Create customer account"}
        </button>

        <p className="mt-6 text-center text-sm text-white/45">
          Already registered?{" "}
          <Link
            className="text-white"
            to="/customer/login"
          >
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}
