import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RestaurantAdminSectionNav from "../components/RestaurantAdminSectionNav";
import { apiFetch } from "../lib/api";

const emptyProfile = {
  tagline: "",
  aboutTitle: "Our story",
  aboutBody: "",
  reservationNote: "",
  internalPhone: "",
  internalEmail: "",
  internalOpeningHours: "",
  websiteUrl: ""
};

export default function RestaurantAdminProfilePage() {
  const [restaurant, setRestaurant] = useState(null);
  const [form, setForm] = useState(emptyProfile);
  const [state, setState] = useState({ loading: true, saving: false, error: "", success: "" });

  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/restaurant-admin/profile", { signal: controller.signal })
      .then((data) => {
        setRestaurant(data.restaurant);
        setForm({ ...emptyProfile, ...(data.profile || {}) });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState((current) => ({ ...current, error: error.message }));
        }
      })
      .finally(() => setState((current) => ({ ...current, loading: false })));
    return () => controller.abort();
  }, []);

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: "", success: "" }));
    try {
      const data = await apiFetch("/restaurant-admin/profile", {
        method: "PATCH",
        body: form,
        retryGet: false
      });
      setForm({ ...emptyProfile, ...(data.profile || {}) });
      setState((current) => ({ ...current, saving: false, success: data.message }));
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.message }));
    }
  }

  if (state.loading) {
    return <main className="mx-auto max-w-5xl px-6 py-24 text-white/45">Loading Restaurant profile…</main>;
  }

  return (
    <main className="admin-workspace mx-auto max-w-5xl px-6 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Restaurant Admin · Restaurant-owned profile</p>
      <h1 className="mt-4 font-display text-5xl md:text-7xl">Restaurant profile</h1>
      <p className="mt-5 max-w-3xl leading-7 text-white/55">
        Edit your Restaurant-owned profile. The contact fields below are PUBLIC and may appear on the customer-facing Restaurant page. The public Restaurant name and homepage/listing image remain protected platform fields and use the approval workflow.
      </p>
      <RestaurantAdminSectionNav />

      {restaurant && (
        <section className="surface mt-8 rounded-3xl p-6 md:p-8">
          <p className="text-xs uppercase tracking-[.24em] text-white/35">Assigned Restaurant</p>
          <h2 className="mt-3 font-display text-4xl">{restaurant.name}</h2>
          <p className="mt-2 text-sm text-white/45">{restaurant.cuisine} · {restaurant.location}</p>
        </section>
      )}

      <form onSubmit={submit} className="surface mt-8 rounded-3xl p-6 md:p-8">
        <div className="mb-6 rounded-2xl border border-amber-200/10 bg-amber-100/[.035] p-4 text-sm leading-6 text-white/50">
          Privacy notice: phone, email, opening hours and website entered here are public Restaurant contact details. Do not enter private staff-only contact information.
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2"><span className="mb-2 block text-sm text-white/60">Tagline</span><input className="input-field" name="tagline" value={form.tagline} onChange={update} /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">About title</span><input className="input-field" name="aboutTitle" value={form.aboutTitle} onChange={update} /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Public opening hours</span><input className="input-field" name="internalOpeningHours" value={form.internalOpeningHours} onChange={update} /></label>
          <label className="block md:col-span-2"><span className="mb-2 block text-sm text-white/60">About / Restaurant story</span><textarea className="input-field min-h-36 resize-y" name="aboutBody" value={form.aboutBody} onChange={update} /></label>
          <label className="block md:col-span-2"><span className="mb-2 block text-sm text-white/60">Reservation note</span><textarea className="input-field min-h-24 resize-y" name="reservationNote" value={form.reservationNote} onChange={update} /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Public contact phone</span><input className="input-field" name="internalPhone" value={form.internalPhone} onChange={update} /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Public contact email</span><input className="input-field" type="email" name="internalEmail" value={form.internalEmail} onChange={update} /></label>
          <label className="block md:col-span-2"><span className="mb-2 block text-sm text-white/60">Website URL</span><input className="input-field" name="websiteUrl" value={form.websiteUrl} onChange={update} placeholder="https://..." /></label>
        </div>

        {state.error && <p className="mt-5 rounded-xl bg-red-400/10 p-4 text-sm text-red-200">{state.error}</p>}
        {state.success && <p className="mt-5 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-100">{state.success}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn-primary" disabled={state.saving}>{state.saving ? "Saving…" : "Save Restaurant profile"}</button>
          <Link to="/restaurant-admin/listing-requests" className="btn-secondary">Request public name/image change</Link>
        </div>
      </form>
    </main>
  );
}
