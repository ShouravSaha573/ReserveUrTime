import { useEffect, useState } from "react";
import CustomerDashboardNav from "../components/CustomerDashboardNav";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

function formFromUser(user) {
  return {
    name: user?.name || "",
    phone: user?.phone || "",
    billingAddress: {
      addressLine1: user?.billingAddress?.addressLine1 || "",
      addressLine2: user?.billingAddress?.addressLine2 || "",
      city: user?.billingAddress?.city || "",
      state: user?.billingAddress?.state || "",
      postcode: user?.billingAddress?.postcode || "",
      country: user?.billingAddress?.country || "Bangladesh"
    }
  };
}

export default function CustomerProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(() => formFromUser(user));
  const [state, setState] = useState({ busy: false, error: "", success: "" });

  useEffect(() => {
    setForm(formFromUser(user));
  }, [user]);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateBilling(event) {
    setForm((current) => ({
      ...current,
      billingAddress: {
        ...current.billingAddress,
        [event.target.name]: event.target.value
      }
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setState({ busy: true, error: "", success: "" });
    try {
      const payload = await apiFetch("/customer/profile", {
        method: "PATCH",
        body: form,
        retryGet: false
      });
      setUser(payload.user);
      setState({ busy: false, error: "", success: payload.message || "Profile updated." });
    } catch (error) {
      setState({ busy: false, error: error.message, success: "" });
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-14 md:px-8 md:py-20">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Customer dashboard</p>
      <h1 className="mt-5 font-display text-5xl md:text-7xl">Profile</h1>
      <p className="mt-5 max-w-2xl leading-7 text-white/50">
        Keep your contact and billing details current. SSLCOMMERZ receives these details only when you start a payment; ReserveUrTime never collects card numbers or CVV.
      </p>

      <CustomerDashboardNav />

      <form onSubmit={submit} className="surface mt-10 rounded-[2rem] p-6 md:p-9">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-white/60">Name</span>
            <input className="input-field" name="name" value={form.name} onChange={update} minLength={2} maxLength={80} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-white/60">Phone</span>
            <input className="input-field" name="phone" value={form.phone} onChange={update} maxLength={20} autoComplete="tel" required />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-white/60">Login email</span>
            <input className="input-field opacity-60" value={user?.email || ""} readOnly aria-readonly="true" />
            <span className="mt-2 block text-xs text-white/32">Email remains read-only; SSLCOMMERZ uses it for the hosted payment receipt.</span>
          </label>
        </div>

        <div className="mt-9 border-t border-white/8 pt-8">
          <p className="text-xs uppercase tracking-[.2em] text-white/30">Billing contact for SSLCOMMERZ</p>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm text-white/60">Address line 1</span>
              <input className="input-field" name="addressLine1" value={form.billingAddress.addressLine1} onChange={updateBilling} maxLength={50} autoComplete="street-address" required />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm text-white/60">Address line 2 <span className="text-white/30">(optional)</span></span>
              <input className="input-field" name="addressLine2" value={form.billingAddress.addressLine2} onChange={updateBilling} maxLength={50} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-white/60">City</span>
              <input className="input-field" name="city" value={form.billingAddress.city} onChange={updateBilling} maxLength={50} autoComplete="address-level2" required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-white/60">State / District</span>
              <input className="input-field" name="state" value={form.billingAddress.state} onChange={updateBilling} maxLength={50} autoComplete="address-level1" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-white/60">Postcode</span>
              <input className="input-field" name="postcode" value={form.billingAddress.postcode} onChange={updateBilling} maxLength={20} autoComplete="postal-code" required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-white/60">Country</span>
              <input className="input-field" name="country" value={form.billingAddress.country} onChange={updateBilling} maxLength={50} autoComplete="country-name" required />
            </label>
          </div>
        </div>

        {state.error && <p className="mt-6 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200">{state.error}</p>}
        {state.success && <p className="mt-6 rounded-xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{state.success}</p>}

        <button className="btn-primary mt-7" disabled={state.busy}>
          {state.busy ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}
