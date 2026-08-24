import { useState } from "react";
import {
  useNavigate,
  useSearchParams
} from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function safeReturnTo(value) {
  if (
    value &&
    value.startsWith("/platform-admin/") &&
    !value.startsWith("//")
  ) {
    return value;
  }
  return "/platform-admin/dashboard";
}

export default function PlatformAdminLoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [state, setState] = useState({ loading: false, error: "" });

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
      const data = await apiFetch("/auth/platform-admin/login", {
        method: "POST",
        body: form,
        retryGet: false
      });
      setUser(data.user);
      navigate(safeReturnTo(params.get("returnTo")), { replace: true });
    } catch (error) {
      setState({ loading: false, error: error.message });
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center px-6 py-16">
      <form onSubmit={submit} className="surface w-full rounded-[2rem] p-7 md:p-9">
        <p className="text-xs uppercase tracking-[.32em] text-white/35">
          Platform control
        </p>
        <h1 className="mt-5 font-display text-5xl">Platform Admin access</h1>

        <div className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm text-white/60">Platform Admin email</span>
            <input
              className="input-field"
              name="email"
              type="email"
              value={form.email}
              onChange={update}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-white/60">Password</span>
            <input
              className="input-field"
              name="password"
              type="password"
              value={form.password}
              onChange={update}
              required
            />
          </label>
        </div>

        {state.error && (
          <p className="mt-5 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {state.error}
          </p>
        )}

        <button className="btn-primary mt-7 w-full" disabled={state.loading}>
          {state.loading ? "Verifying..." : "Platform Admin login"}
        </button>
      </form>
    </main>
  );
}
