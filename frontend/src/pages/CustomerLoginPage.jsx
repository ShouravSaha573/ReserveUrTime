import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function safeReturnTo(value) {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }
  return "/restaurants";
}

export default function CustomerLoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    email: "",
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
        "/auth/customer/login",
        {
          method: "POST",
          body: form,
          retryGet: false
        }
      );

      setUser(data.user);
      navigate(
        safeReturnTo(params.get("returnTo")),
        { replace: true }
      );
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
          Customer access
        </p>
        <h1 className="mt-5 font-display text-5xl md:text-7xl">
          Welcome back
        </h1>
        <p className="mt-6 max-w-lg leading-7 text-white/55">
          Login is required only for protected
          customer actions such as reservations.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="surface rounded-[2rem] p-6 md:p-8"
      >
        <div className="space-y-5">
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
              required
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
              autoComplete="current-password"
              required
            />
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
          {state.loading ? "Logging in..." : "Login"}
        </button>

        <p className="mt-6 text-center text-sm text-white/45">
          No account?{" "}
          <Link
            className="text-white"
            to="/customer/register"
          >
            Register
          </Link>
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4 border-t border-white/10 pt-5 text-center">
          <Link
            to="/platform-admin/login"
            className="text-xs uppercase tracking-[.18em] text-white/35 hover:text-white/70"
          >
            Platform Admin
          </Link>
          <Link
            to="/restaurant-admin/login"
            className="text-xs uppercase tracking-[.18em] text-white/35 hover:text-white/70"
          >
            Restaurant Admin
          </Link>
        </div>
      </form>
    </main>
  );
}
