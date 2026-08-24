import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import {
  DEFAULT_SITE_CONTENT,
  useSiteContent
} from "../../context/SiteContentContext";

function merge(content) {
  const source = content || {};
  return {
    ...DEFAULT_SITE_CONTENT,
    ...source,
    brand: { ...DEFAULT_SITE_CONTENT.brand, ...(source.brand || {}) },
    hero: { ...DEFAULT_SITE_CONTENT.hero, ...(source.hero || {}), enabled: true },
    restaurantsSection: {
      ...DEFAULT_SITE_CONTENT.restaurantsSection,
      ...(source.restaurantsSection || {})
    },
    footer: { ...DEFAULT_SITE_CONTENT.footer, ...(source.footer || {}) },
    galaxy: { ...DEFAULT_SITE_CONTENT.galaxy, ...(source.galaxy || {}) },
    sectionOrder: [...DEFAULT_SITE_CONTENT.sectionOrder]
  };
}

function Field({ label, children, span = "" }) {
  return (
    <label className={`block ${span}`}>
      <span className="mb-2 block text-sm text-white/60">{label}</span>
      {children}
    </label>
  );
}

export default function HomepageCmsManagement() {
  const { setContent } = useSiteContent();
  const [form, setForm] = useState(DEFAULT_SITE_CONTENT);
  const [state, setState] = useState({
    loading: true,
    saving: false,
    error: "",
    success: ""
  });

  async function load() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const contentData = await apiFetch("/platform-admin/homepage");
      setForm(merge(contentData.content));
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setState((current) => ({ ...current, loading: false }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateGroup(group, field, value) {
    setForm((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [field]: value
      }
    }));
  }

  function updateText(group, field) {
    return (event) => updateGroup(group, field, event.target.value);
  }

  function updateToggle(group, field) {
    return (event) => updateGroup(group, field, event.target.checked);
  }

  async function save(event) {
    event.preventDefault();
    setState((current) => ({
      ...current,
      saving: true,
      error: "",
      success: ""
    }));

    try {
      const data = await apiFetch("/platform-admin/homepage", {
        method: "PATCH",
        body: { ...form, hero: { ...form.hero, enabled: true, browseCtaPath: "/restaurants", registerCtaPath: "/customer/register" }, restaurantsSection: { ...form.restaurantsSection, viewAllPath: "/restaurants" }, sectionOrder: [...DEFAULT_SITE_CONTENT.sectionOrder] },
        retryGet: false
      });
      const next = merge(data.content);
      setForm(next);
      setContent(next);
      setState((current) => ({
        ...current,
        saving: false,
        success: data.message
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        saving: false,
        error: error.message,
        success: ""
      }));
    }
  }



  if (state.loading) {
    return <div className="surface mt-8 rounded-3xl p-8 text-white/45">Loading Homepage CMS…</div>;
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="text-xs uppercase tracking-[.28em] text-white/35">Platform identity</p>
        <h2 className="mt-3 font-display text-4xl">Brand & navigation</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Brand name">
            <input className="input-field" value={form.brand.name} onChange={updateText("brand", "name")} />
          </Field>
          <Field label="Home label">
            <input className="input-field" value={form.brand.homeLabel} onChange={updateText("brand", "homeLabel")} />
          </Field>
          <Field label="Restaurants label">
            <input className="input-field" value={form.brand.restaurantsLabel} onChange={updateText("brand", "restaurantsLabel")} />
          </Field>
          <Field label="Customer login label">
            <input className="input-field" value={form.brand.customerLoginLabel} onChange={updateText("brand", "customerLoginLabel")} />
          </Field>
          <Field label="Customer register label">
            <input className="input-field" value={form.brand.customerRegisterLabel} onChange={updateText("brand", "customerRegisterLabel")} />
          </Field>
        </div>
      </section>

      <section className="surface rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[.28em] text-white/35">Homepage</p>
            <h2 className="mt-3 font-display text-4xl">Homepage introduction</h2>
          </div>

        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Eyebrow">
            <input className="input-field" value={form.hero.eyebrow} onChange={updateText("hero", "eyebrow")} />
          </Field>
          <Field label="Main title">
            <input className="input-field" value={form.hero.title} onChange={updateText("hero", "title")} />
          </Field>
          <Field label="Accent title">
            <input className="input-field" value={form.hero.titleAccent} onChange={updateText("hero", "titleAccent")} />
          </Field>
          <Field label="Hero description" span="md:col-span-2">
            <textarea className="input-field min-h-28 resize-y" value={form.hero.body} onChange={updateText("hero", "body")} />
          </Field>
          <Field label="Browse CTA label">
            <input className="input-field" value={form.hero.browseCtaLabel} onChange={updateText("hero", "browseCtaLabel")} />
          </Field>

          <Field label="Register CTA label">
            <input className="input-field" value={form.hero.registerCtaLabel} onChange={updateText("hero", "registerCtaLabel")} />
          </Field>

          <Field label="Galaxy search placeholder" span="md:col-span-2">
            <input className="input-field" value={form.hero.searchPlaceholder} onChange={updateText("hero", "searchPlaceholder")} />
          </Field>
        </div>

        <label className="mt-5 flex items-center gap-3 text-sm text-white/60">
          <input type="checkbox" checked={form.hero.searchEnabled} onChange={updateToggle("hero", "searchEnabled")} />
          Show Galaxy Restaurant Search in hero
        </label>
      </section>

      <section className="surface rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[.28em] text-white/35">Homepage</p>
            <h2 className="mt-3 font-display text-4xl">Restaurant section</h2>
          </div>
          <label className="flex items-center gap-3 text-sm text-white/60">
            <input
              type="checkbox"
              checked={form.restaurantsSection.enabled}
              onChange={updateToggle("restaurantsSection", "enabled")}
            />
            Show section
          </label>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Eyebrow">
            <input className="input-field" value={form.restaurantsSection.eyebrow} onChange={updateText("restaurantsSection", "eyebrow")} />
          </Field>
          <Field label="Section title">
            <input className="input-field" value={form.restaurantsSection.title} onChange={updateText("restaurantsSection", "title")} />
          </Field>
          <Field label="View all label">
            <input className="input-field" value={form.restaurantsSection.viewAllLabel} onChange={updateText("restaurantsSection", "viewAllLabel")} />
          </Field>

          <Field label="Maximum restaurants shown">
            <input
              className="input-field"
              type="number"
              min="1"
              max="8"
              value={form.restaurantsSection.featuredLimit}
              onChange={(event) =>
                updateGroup("restaurantsSection", "featuredLimit", Number(event.target.value))
              }
            />
          </Field>

        </div>


      </section>

      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="text-xs uppercase tracking-[.28em] text-white/35">Safe visual presets</p>
        <h2 className="mt-3 font-display text-4xl">Galaxy background</h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="flex items-center gap-3 text-sm text-white/60 md:col-span-2">
            <input
              type="checkbox"
              checked={form.galaxy.enabled}
              onChange={updateToggle("galaxy", "enabled")}
            />
            Enable animated Galaxy background
          </label>

          <Field label="Star density">
            <select className="input-field" value={form.galaxy.density} onChange={updateText("galaxy", "density")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>

          <Field label="Movement">
            <select className="input-field" value={form.galaxy.movement} onChange={updateText("galaxy", "movement")}>
              <option value="subtle">Subtle</option>
              <option value="normal">Normal</option>
            </select>
          </Field>

          <Field label="Shine interval (milliseconds)">
            <input
              className="input-field"
              type="number"
              min="1800"
              max="10000"
              step="100"
              value={form.galaxy.shineIntervalMs}
              onChange={(event) =>
                updateGroup("galaxy", "shineIntervalMs", Number(event.target.value))
              }
            />
          </Field>

          <Field label="Glow intensity">
            <select className="input-field" value={form.galaxy.glowIntensity} onChange={updateText("galaxy", "glowIntensity")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="surface rounded-3xl p-6 md:p-8">
        <p className="text-xs uppercase tracking-[.28em] text-white/35">Footer</p>
        <h2 className="mt-3 font-display text-4xl">Footer content</h2>
        <div className="mt-6">
          <Field label="Footer text">
            <textarea className="input-field min-h-24 resize-y" value={form.footer.text} onChange={updateText("footer", "text")} />
          </Field>
        </div>
      </section>

      {state.error && (
        <p className="rounded-2xl bg-red-400/10 p-4 text-sm text-red-200">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-2xl bg-emerald-400/10 p-4 text-sm text-emerald-100">
          {state.success}
        </p>
      )}

      <div className="sticky bottom-4 z-20 flex flex-wrap justify-end gap-3 rounded-2xl border border-white/10 bg-[#080808]/90 p-4 backdrop-blur-xl">
        <a href="/" target="_blank" rel="noreferrer" className="btn-secondary">
          Preview public homepage ↗
        </a>
        <button className="btn-primary" disabled={state.saving}>
          {state.saving ? "Saving…" : "Save Homepage"}
        </button>
      </div>
    </form>
  );
}
