import { useCallback, useEffect, useState } from "react";
import RestaurantAdminSectionNav from "../components/RestaurantAdminSectionNav";
import ImageDropzone from "../components/ImageDropzone";
import { apiFetch, apiUpload } from "../lib/api";

const blank = {
  title: "",
  imageUrl: "",
  altText: "",
  caption: "",
  displayOrder: 999,
  isPublished: true,
  isActive: true
};

export default function RestaurantAdminGalleryPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState("");
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [localImagePreview, setLocalImagePreview] = useState("");
  const [state, setState] = useState({ loading: true, saving: false, error: "", success: "" });

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/restaurant-admin/gallery");
      setItems(data.items || []);
      setState((current) => ({ ...current, loading: false, error: "" }));
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!pendingImageFile) { setLocalImagePreview(""); return undefined; }
    const preview = URL.createObjectURL(pendingImageFile);
    setLocalImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [pendingImageFile]);

  function chooseImage(file) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setState((current) => ({ ...current, error: "Choose a PNG, JPEG or WebP image.", success: "" }));
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setState((current) => ({ ...current, error: "The image must be 6 MB or smaller.", success: "" }));
      return;
    }
    setPendingImageFile(file);
    setState((current) => ({ ...current, error: "", success: "Image selected. Save the gallery item when ready." }));
  }

  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function reset() {
    setEditingId("");
    setPendingImageFile(null);
    setForm(blank);
  }

  async function submit(event) {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: "", success: "" }));
    try {
      let imageUrl = form.imageUrl;
      if (pendingImageFile) {
        const uploaded = await apiUpload("/restaurant-admin/gallery/image", pendingImageFile);
        imageUrl = uploaded.imageUrl;
      }
      if (!imageUrl.trim()) throw new Error("Drop an image here or provide an image URL.");
      const data = await apiFetch(
        editingId ? `/restaurant-admin/gallery/${editingId}` : "/restaurant-admin/gallery",
        {
          method: editingId ? "PATCH" : "POST",
          body: { ...form, imageUrl },
          retryGet: false
        }
      );
      reset();
      setState((current) => ({ ...current, saving: false, success: data.message }));
      await load();
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.message }));
    }
  }

  async function remove(item) {
    if (!window.confirm(`Remove ${item.title || "this gallery item"}?`)) return;
    try {
      const data = await apiFetch(`/restaurant-admin/gallery/${item._id}`, { method: "DELETE", retryGet: false });
      setState((current) => ({ ...current, success: data.message, error: "" }));
      await load();
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, success: "" }));
    }
  }

  async function restore(item) {
    try {
      const data = await apiFetch(`/restaurant-admin/gallery/${item._id}`, {
        method: "PATCH",
        body: { isActive: true, isPublished: true },
        retryGet: false
      });
      setState((current) => ({ ...current, success: data.message, error: "" }));
      await load();
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, success: "" }));
    }
  }

  return (
    <main className="admin-workspace mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Restaurant Admin · Internal operations</p>
      <h1 className="mt-4 font-display text-5xl md:text-7xl">Restaurant gallery</h1>
      <p className="mt-5 max-w-3xl leading-7 text-white/55">Manage Restaurant-owned atmosphere, dining and internal gallery media. Drag images directly from your PC or use a safe image URL.</p>
      <RestaurantAdminSectionNav />

      {state.error && <p className="mt-6 rounded-xl bg-red-400/10 p-4 text-sm text-red-200">{state.error}</p>}
      {state.success && <p className="mt-6 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-100">{state.success}</p>}

      <section className="mt-10 grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
        <form onSubmit={submit} className="surface h-fit rounded-3xl p-6 md:p-8">
          <p className="text-xs uppercase tracking-[.22em] text-white/35">{editingId ? "Edit gallery item" : "Add gallery item"}</p>
          <div className="mt-5 space-y-4">
            <label className="block"><span className="mb-2 block text-sm text-white/60">Title</span><input className="input-field" name="title" value={form.title} onChange={update} /></label>
            <div className="block"><span className="mb-2 block text-sm text-white/60">Gallery image</span><ImageDropzone file={pendingImageFile} onFile={chooseImage} /><input className="input-field mt-3" name="imageUrl" value={form.imageUrl} onChange={(event) => { update(event); setPendingImageFile(null); }} placeholder="Or paste an image URL" /></div>
            <label className="block"><span className="mb-2 block text-sm text-white/60">Alt text</span><input className="input-field" name="altText" value={form.altText} onChange={update} /></label>
            <label className="block"><span className="mb-2 block text-sm text-white/60">Caption</span><textarea className="input-field min-h-24 resize-y" name="caption" value={form.caption} onChange={update} /></label>
            <label className="block"><span className="mb-2 block text-sm text-white/60">Display order</span><input className="input-field" type="number" min="0" max="9999" name="displayOrder" value={form.displayOrder} onChange={update} /></label>
            <label className="flex items-center gap-3 text-sm text-white/60"><input type="checkbox" name="isPublished" checked={form.isPublished} onChange={update} /> Published</label>
            <label className="flex items-center gap-3 text-sm text-white/60"><input type="checkbox" name="isActive" checked={form.isActive} onChange={update} /> Active</label>
          </div>
          {(localImagePreview || form.imageUrl) && <div className="mt-5 overflow-hidden rounded-2xl border border-white/10"><img src={localImagePreview || form.imageUrl} alt="Gallery preview" className="h-48 w-full object-cover" /></div>}
          <div className="mt-6 flex gap-3"><button className="btn-primary" disabled={state.saving}>{state.saving ? "Saving…" : editingId ? "Save gallery item" : "Add gallery item"}</button>{editingId && <button type="button" className="btn-secondary" onClick={reset}>Cancel</button>}</div>
        </form>

        <div className="grid gap-4 sm:grid-cols-2">
          {state.loading && <p className="text-white/40">Loading gallery…</p>}
          {items.map((item) => (
            <article key={item._id} className={`surface overflow-hidden rounded-3xl ${item.isActive ? "" : "opacity-55"}`}>
              <div className="h-52 bg-white/[.02]">{item.imageUrl ? <img src={item.imageUrl} alt={item.altText || item.title || "Restaurant gallery"} className="h-full w-full object-cover" /> : null}</div>
              <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-3xl">{item.title || "Untitled"}</h2><p className="mt-2 text-xs text-white/35">Order {item.displayOrder}</p></div><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/55">{item.isActive ? item.isPublished ? "Published" : "Draft" : "Removed"}</span></div>{item.caption && <p className="mt-3 text-sm text-white/50">{item.caption}</p>}<div className="mt-5 flex flex-wrap gap-2"><button type="button" className="btn-secondary" onClick={() => { setEditingId(item._id); setForm({ title: item.title || "", imageUrl: item.imageUrl || "", altText: item.altText || "", caption: item.caption || "", displayOrder: item.displayOrder, isPublished: item.isPublished, isActive: item.isActive }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>{item.isActive ? <button type="button" className="btn-secondary" onClick={() => remove(item)}>Remove</button> : <button type="button" className="btn-primary" onClick={() => restore(item)}>Restore</button>}</div></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
