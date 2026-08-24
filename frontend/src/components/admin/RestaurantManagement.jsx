import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, apiUpload } from "../../lib/api";
import ImageDropzone from "../ImageDropzone";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  coverImageUrl: "",
  cuisine: "",
  location: "",
  phone: "",
  email: "",
  openingHours: "Daily · 6:00 PM – 11:30 PM",
  isActive: true
};

function restaurantToForm(restaurant) {
  return {
    name: restaurant.name || "",
    slug: restaurant.slug || "",
    description: restaurant.description || "",
    coverImageUrl: restaurant.coverImageUrl || "",
    cuisine: restaurant.cuisine || "",
    location: restaurant.location || "",
    phone: restaurant.phone || "",
    email: restaurant.email || "",
    openingHours: restaurant.openingHours || "",
    isActive: Boolean(restaurant.isActive)
  };
}

export default function RestaurantManagement({ restaurants, onChanged }) {
  const editorRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [coverFile, setCoverFile] = useState(null);
  const [state, setState] = useState({ loading: false, error: "", success: "" });

  const coverPreview = useMemo(() => coverFile ? URL.createObjectURL(coverFile) : form.coverImageUrl, [coverFile, form.coverImageUrl]);

  useEffect(() => () => {
    if (coverFile && coverPreview) URL.revokeObjectURL(coverPreview);
  }, [coverFile, coverPreview]);

  const activeCount = useMemo(
    () => restaurants.filter((restaurant) => restaurant.isActive).length,
    [restaurants]
  );

  useEffect(() => {
    if (!editingId) return;
    const frame = requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      editorRef.current?.querySelector('input[name="name"]')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [editingId]);

  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setCoverFile(null);
    setState({ loading: false, error: "", success: "" });
  }

  function goToAddForm() {
    startAdd();
    requestAnimationFrame(() => {
      document.getElementById("restaurant-editor")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  function startEdit(restaurant) {
    const restaurantId = restaurant._id || restaurant.id;
    if (!restaurantId) {
      setState({ loading: false, error: "This Restaurant record has no editable id.", success: "" });
      return;
    }
    setEditingId(restaurantId);
    setForm(restaurantToForm(restaurant));
    setCoverFile(null);
    setState({ loading: false, error: "", success: "" });
  }

  async function submit(event) {
    event.preventDefault();
    setState({ loading: true, error: "", success: "" });

    try {
      const coverUpload = coverFile
        ? await apiUpload("/platform-admin/restaurant-images", coverFile)
        : null;
      const payload = {
        ...form,
        coverImageUrl: coverUpload?.imageUrl || form.coverImageUrl
      };
      const path = editingId
        ? `/platform-admin/restaurants/${editingId}`
        : "/platform-admin/restaurants";
      const method = editingId ? "PATCH" : "POST";
      const data = await apiFetch(path, {
        method,
        body: payload,
        retryGet: false
      });

      setState({ loading: false, error: "", success: data.message });
      await onChanged();
      setCoverFile(null);
      if (editingId) setForm(payload);
      else setForm(emptyForm);
    } catch (error) {
      setState({ loading: false, error: error.message, success: "" });
    }
  }

  async function removeRestaurant(restaurant) {
    const confirmed = window.confirm(
      `Remove ${restaurant.name} from the public platform? Internal restaurant data will be preserved.`
    );
    if (!confirmed) return;

    setState({ loading: true, error: "", success: "" });
    try {
      const data = await apiFetch(`/platform-admin/restaurants/${restaurant._id}`, {
        method: "DELETE",
        retryGet: false
      });
      setState({ loading: false, error: "", success: data.message });
      if (editingId === restaurant._id) startAdd();
      await onChanged();
    } catch (error) {
      setState({ loading: false, error: error.message, success: "" });
    }
  }

  async function restoreRestaurant(restaurant) {
    setState({ loading: true, error: "", success: "" });
    try {
      const data = await apiFetch(`/platform-admin/restaurants/${restaurant._id}`, {
        method: "PATCH",
        body: { isActive: true },
        retryGet: false
      });
      setState({ loading: false, error: "", success: data.message });
      await onChanged();
    } catch (error) {
      setState({ loading: false, error: error.message, success: "" });
    }
  }

  return (
    <section className="mt-14">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[.3em] text-white/35">Platform directory</p>
          <h2 className="mt-3 font-display text-4xl">Restaurants</h2>
        </div>
        <button type="button" className="btn-primary" onClick={goToAddForm}>+ Add Restaurant</button>
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {restaurants.map((restaurant) => (
          <article key={restaurant._id} className="surface overflow-hidden rounded-3xl">
            <div className="relative aspect-video overflow-hidden bg-white/[.03]">
              {restaurant.coverImageUrl ? (
                <img
                  src={restaurant.coverImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs uppercase tracking-[.25em] text-white/25">No listing image</div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[.22em] text-white/30">{restaurant.cuisine || "Cuisine not set"}</p>
                  <h3 className="mt-2 font-display text-3xl">{restaurant.name}</h3>
                  <p className="mt-2 text-sm text-white/45">{restaurant.location}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs ${restaurant.isActive ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-white/35"}`}>
                  {restaurant.isActive ? "Active" : "Removed"}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className="btn-secondary text-sm" onClick={() => startEdit(restaurant)}>Edit</button>
                {restaurant.isActive ? (
                  <button type="button" className="btn-secondary text-sm" onClick={() => removeRestaurant(restaurant)}>Remove</button>
                ) : (
                  <button type="button" className="btn-secondary text-sm" onClick={() => restoreRestaurant(restaurant)}>Restore</button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <form ref={editorRef} id="restaurant-editor" onSubmit={submit} className="surface mt-8 scroll-mt-24 rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[.25em] text-white/35">{editingId ? "Edit listing" : "New listing"}</p>
            <h3 className="mt-2 font-display text-3xl">{editingId ? "Edit Restaurant" : "Add Restaurant"}</h3>
          </div>
          <p className="text-xs text-white/35">{activeCount} active restaurant{activeCount === 1 ? "" : "s"}</p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block"><span className="mb-2 block text-sm text-white/60">Restaurant name *</span><input className="input-field" name="name" value={form.name} onChange={update} required /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Slug *</span><input className="input-field" name="slug" value={form.slug} onChange={update} placeholder="ember-house" /></label>
          <label className="block md:col-span-2"><span className="mb-2 block text-sm text-white/60">Description *</span><textarea className="input-field min-h-28 resize-y" name="description" value={form.description} onChange={update} required /></label>
          <div className="block">
            <span className="mb-2 block text-sm text-white/60">Homepage / listing image</span>
            <ImageDropzone file={coverFile} onFile={setCoverFile} label="Drag a restaurant image from your PC" />
          </div>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Cuisine *</span><input className="input-field" name="cuisine" value={form.cuisine} onChange={update} required /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Location *</span><input className="input-field" name="location" value={form.location} onChange={update} required /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Phone</span><input className="input-field" name="phone" value={form.phone} onChange={update} /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Public email</span><input className="input-field" name="email" type="email" value={form.email} onChange={update} /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Opening hours</span><input className="input-field" name="openingHours" value={form.openingHours} onChange={update} /></label>
        </div>


        {editingId && (
          <label className="mt-5 flex items-center gap-3 text-sm text-white/60">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={update} />
            Show this restaurant on the public platform
          </label>
        )}        {coverPreview && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <img src={coverPreview} alt="Restaurant listing preview" className="h-52 w-full object-cover" />
          </div>
        )}

        {state.error && <p className="mt-5 rounded-xl bg-red-400/10 p-4 text-sm text-red-200">{state.error}</p>}
        {state.success && <p className="mt-5 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-100">{state.success}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn-primary" disabled={state.loading}>{state.loading ? "Saving..." : editingId ? "Save Restaurant" : "Add Restaurant"}</button>
          {editingId && <button type="button" className="btn-secondary" onClick={startAdd}>Cancel edit</button>}
        </div>
      </form>
    </section>
  );
}
