import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RestaurantAdminSectionNav from "../components/RestaurantAdminSectionNav";
import ImageDropzone from "../components/ImageDropzone";
import { apiFetch, apiUpload } from "../lib/api";

const blankCategory = {
  name: "",
  slug: "",
  description: ""
};

const blankDish = {
  categoryId: "",
  name: "",
  slug: "",
  description: "",
  ingredients: "",
  price: "",
  imageUrl: "",
  isAvailable: true,
  isActive: true
};

function messageBox(message, type = "success") {
  if (!message) return null;
  return (
    <p className={`mt-5 rounded-xl p-4 text-sm ${type === "error" ? "bg-red-400/10 text-red-200" : "bg-emerald-400/10 text-emerald-100"}`}>
      {message}
    </p>
  );
}

async function prepareDishImage(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  let alreadyTransparent = false;
  for (let offset = 3; offset < pixels.length; offset += 4) {
    if (pixels[offset] < 250) {
      alreadyTransparent = true;
      break;
    }
  }
  if (alreadyTransparent) return { file, backgroundRemoved: false };

  const isLightNeutral = (index) => {
    const offset = index * 4;
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    return Math.min(red, green, blue) >= 145 && Math.max(red, green, blue) - Math.min(red, green, blue) <= 34;
  };

  const width = canvas.width;
  const height = canvas.height;
  const border = [];
  for (let x = 0; x < width; x += 1) border.push(x, (height - 1) * width + x);
  for (let y = 1; y < height - 1; y += 1) border.push(y * width, y * width + width - 1);
  const lightBorderRatio = border.filter(isLightNeutral).length / Math.max(border.length, 1);
  if (lightBorderRatio < 0.55) return { file, backgroundRemoved: false };

  const visited = new Uint8Array(width * height);
  const queue = [];
  for (const index of border) {
    if (!visited[index] && isLightNeutral(index)) {
      visited[index] = 1;
      queue.push(index);
    }
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    const x = index % width;
    const candidates = [index - width, index + width];
    if (x > 0) candidates.push(index - 1);
    if (x < width - 1) candidates.push(index + 1);
    for (const candidate of candidates) {
      if (candidate >= 0 && candidate < visited.length && !visited[candidate] && isLightNeutral(candidate)) {
        visited[candidate] = 1;
        queue.push(candidate);
      }
    }
  }

  if (queue.length < width * height * 0.08) return { file, backgroundRemoved: false };
  for (const index of queue) pixels[index * 4 + 3] = 0;
  context.putImageData(image, 0, 0);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("The image could not be processed.")), "image/png");
  });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return {
    file: new File([blob], `${baseName}-transparent.png`, { type: "image/png" }),
    backgroundRemoved: true
  };
}

export default function RestaurantAdminMenuPage() {
  const categoryEditorRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [categoryForm, setCategoryForm] = useState(blankCategory);
  const [dishForm, setDishForm] = useState(blankDish);
  const [editingCategory, setEditingCategory] = useState("");
  const [editingDish, setEditingDish] = useState("");
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [localImagePreview, setLocalImagePreview] = useState("");
  const [state, setState] = useState({ loading: true, saving: false, error: "", success: "" });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, error: "" }));
    try {
      const [categoryData, itemData] = await Promise.all([
        apiFetch("/restaurant-admin/menu/categories"),
        apiFetch("/restaurant-admin/menu/items")
      ]);
      setCategories(categoryData.categories || []);
      setItems(itemData.items || []);
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setState((current) => ({ ...current, loading: false }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive),
    [categories]
  );

  useEffect(() => {
    if (!dishForm.categoryId && activeCategories[0]?._id) {
      setDishForm((current) => ({ ...current, categoryId: activeCategories[0]._id }));
    }
  }, [activeCategories, dishForm.categoryId]);

  useEffect(() => {
    if (!pendingImageFile) {
      setLocalImagePreview("");
      return undefined;
    }
    const url = URL.createObjectURL(pendingImageFile);
    setLocalImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingImageFile]);

  function updateCategory(event) {
    const { name, value, type, checked } = event.target;
    setCategoryForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function updateDish(event) {
    const { name, value, type, checked } = event.target;
    setDishForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function resetCategory() {
    setEditingCategory("");
    setCategoryForm(blankCategory);
  }

  function editCategory(category) {
    const categoryId = category._id || category.id;
    if (!categoryId) {
      setState((current) => ({ ...current, error: "This category has no editable id.", success: "" }));
      return;
    }
    setEditingCategory(categoryId);
    setCategoryForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || ""
    });
    setState((current) => ({ ...current, error: "", success: "" }));
    requestAnimationFrame(() => {
      categoryEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      categoryEditorRef.current?.querySelector('input[name="name"]')?.focus({ preventScroll: true });
    });
  }

  function resetDish() {
    setEditingDish("");
    setPendingImageFile(null);
    setDishForm({ ...blankDish, categoryId: activeCategories[0]?._id || "" });
  }

  async function chooseDishImage(file) {
    if (!file) {
      setPendingImageFile(null);
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setState((current) => ({ ...current, error: "Choose a PNG, JPEG or WebP dish image.", success: "" }));
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setState((current) => ({ ...current, error: "Dish image must be 6 MB or smaller.", success: "" }));
      return;
    }
    setState((current) => ({ ...current, error: "", success: "Preparing image…" }));
    try {
      const prepared = await prepareDishImage(file);
      if (prepared.file.size > 6 * 1024 * 1024) {
        throw new Error("The processed dish image is larger than 6 MB. Please use a smaller image.");
      }
      setPendingImageFile(prepared.file);
      setState((current) => ({
        ...current,
        error: "",
        success: prepared.backgroundRemoved
          ? "Background removed. Saving the dish will upload the transparent PNG."
          : "Image ready. Saving the dish will upload it for the public menu."
      }));
    } catch (error) {
      setPendingImageFile(null);
      setState((current) => ({ ...current, error: error.message || "The dish image could not be processed.", success: "" }));
    }
  }

  async function saveCategory(event) {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: "", success: "" }));
    try {
      const data = await apiFetch(
        editingCategory
          ? `/restaurant-admin/menu/categories/${editingCategory}`
          : "/restaurant-admin/menu/categories",
        {
          method: editingCategory ? "PATCH" : "POST",
          body: categoryForm,
          retryGet: false
        }
      );
      resetCategory();
      setState((current) => ({ ...current, saving: false, success: data.message }));
      await load();
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.message }));
    }
  }

  async function saveDish(event) {
    event.preventDefault();
    let persistedItemId = editingDish;
    setState((current) => ({ ...current, saving: true, error: "", success: "" }));
    try {
      const data = await apiFetch(
        editingDish
          ? `/restaurant-admin/menu/items/${editingDish}`
          : "/restaurant-admin/menu/items",
        {
          method: editingDish ? "PATCH" : "POST",
          body: dishForm,
          retryGet: false
        }
      );
      const savedItemId = data.item?._id || editingDish;
      persistedItemId = savedItemId;
      let successMessage = data.message;
      if (pendingImageFile && savedItemId) {
        const uploaded = await apiUpload(`/restaurant-admin/menu/items/${savedItemId}/image`, pendingImageFile);
        successMessage = `${data.message} ${uploaded.message}`;
      }
      resetDish();
      setState((current) => ({ ...current, saving: false, success: successMessage }));
      await load();
    } catch (error) {
      if (!editingDish && persistedItemId) {
        setEditingDish(persistedItemId);
      }
      setState((current) => ({
        ...current,
        saving: false,
        error: !editingDish && persistedItemId
          ? `Dish data was saved, but the image step failed: ${error.message}. Retry Save dish to upload the image without creating another dish.`
          : error.message
      }));
    }
  }

  async function moveCategory(category, direction) {
    try {
      const data = await apiFetch(`/restaurant-admin/menu/categories/${category._id}/move`, { method: "PATCH", body: { direction }, retryGet: false });
      setState((current) => ({ ...current, success: data.message, error: "" }));
      await load();
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, success: "" }));
    }
  }
  async function removeCategory(category) {
    if (!window.confirm(`Move ${category.name} and every dish in it to Trash?`)) return;
    try {
      const data = await apiFetch(`/restaurant-admin/menu/categories/${category._id}`, { method: "DELETE", retryGet: false });
      setState((current) => ({ ...current, success: data.message, error: "" }));
      await load();
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, success: "" }));
    }
  }

  async function restoreCategory(category) {
    try {
      const data = await apiFetch(`/restaurant-admin/menu/categories/${category._id}`, {
        method: "PATCH",
        body: { isActive: true },
        retryGet: false
      });
      setState((current) => ({ ...current, success: data.message, error: "" }));
      await load();
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, success: "" }));
    }
  }

  async function removeDish(item) {
    if (!window.confirm(`Move ${item.name} to Trash?`)) return;
    try {
      const data = await apiFetch(`/restaurant-admin/menu/items/${item._id}`, { method: "DELETE", retryGet: false });
      setState((current) => ({ ...current, success: data.message, error: "" }));
      await load();
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, success: "" }));
    }
  }

  async function restoreDish(item) {
    try {
      const data = await apiFetch(`/restaurant-admin/menu/items/${item._id}`, {
        method: "PATCH",
        body: { isActive: true, isAvailable: true },
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
      <h1 className="mt-4 font-display text-5xl md:text-7xl">Menu management</h1>
      <p className="mt-5 max-w-3xl leading-7 text-white/55">
        Create and manage your Restaurant-owned categories and dishes here. Public restaurant menus now use normal food photography with a subtle levitating presentation for a fast, realistic experience.
      </p>
      <RestaurantAdminSectionNav />
      {messageBox(state.error, "error")}
      {messageBox(state.success)}

      <section className="mt-10 grid gap-8 xl:grid-cols-[.8fr_1.2fr]">
        <div>
          <form ref={categoryEditorRef} onSubmit={saveCategory} className="surface scroll-mt-24 rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[.22em] text-white/35">{editingCategory ? "Edit category" : "New category"}</p>
            <div className="mt-5 space-y-4">
              <label className="block"><span className="mb-2 block text-sm text-white/60">Name</span><input className="input-field" name="name" value={categoryForm.name} onChange={updateCategory} required /></label>
              <label className="block"><span className="mb-2 block text-sm text-white/60">Slug (optional)</span><input className="input-field" name="slug" value={categoryForm.slug} onChange={updateCategory} placeholder="auto-from-name" /></label>
              <label className="block"><span className="mb-2 block text-sm text-white/60">Description</span><textarea className="input-field min-h-24 resize-y" name="description" value={categoryForm.description} onChange={updateCategory} /></label>
              {!editingCategory ? <p className="text-xs leading-5 text-white/40">New categories are added at the end of the public menu. Reorder them below at any time.</p> : null}
            </div>
            <div className="mt-5 flex gap-3"><button className="btn-primary" disabled={state.saving}>{state.saving ? "Saving…" : editingCategory ? "Save category" : "Add category"}</button>{editingCategory && <button type="button" className="btn-secondary" onClick={resetCategory}>Cancel</button>}</div>
          </form>

          <div className="mt-6 space-y-3">
            {state.loading && <p className="text-white/40">Loading categories…</p>}
            {categories.map((category, index) => (
              <article key={category._id} className={`surface rounded-2xl p-5 ${category.isActive ? "" : "opacity-55"}`}>
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-2xl">{category.name}</h3><p className="mt-1 text-xs text-white/35">Public menu position {index + 1}</p></div></div>
                {category.description && <p className="mt-3 text-sm text-white/50">{category.description}</p>}
                <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="btn-secondary" onClick={() => editCategory(category)}>Edit</button><button type="button" className="btn-secondary" disabled={index === 0} onClick={() => moveCategory(category, "earlier")}>Move earlier</button><button type="button" className="btn-secondary" disabled={index === categories.length - 1} onClick={() => moveCategory(category, "later")}>Move later</button><button type="button" className="btn-secondary" onClick={() => removeCategory(category)}>Move to Trash</button></div>
              </article>
            ))}
          </div>
        </div>

        <div>
          <form onSubmit={saveDish} className="surface rounded-3xl p-6 md:p-8">
            <p className="text-xs uppercase tracking-[.22em] text-white/35">{editingDish ? "Edit dish" : "New dish"}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block"><span className="mb-2 block text-sm text-white/60">Category</span><select className="input-field" name="categoryId" value={dishForm.categoryId} onChange={updateDish} required><option value="">Choose category</option>{activeCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
              <label className="block"><span className="mb-2 block text-sm text-white/60">Dish name</span><input className="input-field" name="name" value={dishForm.name} onChange={updateDish} required /></label>
              <label className="block"><span className="mb-2 block text-sm text-white/60">Slug (optional)</span><input className="input-field" name="slug" value={dishForm.slug} onChange={updateDish} /></label>
              <label className="block"><span className="mb-2 block text-sm text-white/60">Price</span><input className="input-field" type="number" min="0" step="0.01" name="price" value={dishForm.price} onChange={updateDish} required /></label>
              <label className="block md:col-span-2"><span className="mb-2 block text-sm text-white/60">Description</span><textarea className="input-field min-h-24 resize-y" name="description" value={dishForm.description} onChange={updateDish} /></label>
              <label className="block md:col-span-2"><span className="mb-2 block text-sm text-white/60">Ingredients (comma separated)</span><input className="input-field" name="ingredients" value={dishForm.ingredients} onChange={updateDish} placeholder="Mushroom, parmesan, truffle" /></label>
              <label className="block md:col-span-2"><span className="mb-2 block text-sm text-white/60">Dish image URL (optional)</span><input className="input-field" name="imageUrl" value={dishForm.imageUrl} onChange={updateDish} placeholder="https://... or /images/..." /></label>
              <div className="block md:col-span-2"><span className="mb-2 block text-sm text-white/70">Or upload a dish image</span><ImageDropzone file={pendingImageFile} onFile={chooseDishImage} /></div>
              <div className="flex flex-col justify-end gap-3 pb-2"><label className="flex items-center gap-3 text-sm text-white/60"><input type="checkbox" name="isAvailable" checked={dishForm.isAvailable} onChange={updateDish} /> Available</label><label className="flex items-center gap-3 text-sm text-white/60"><input type="checkbox" name="isActive" checked={dishForm.isActive} onChange={updateDish} /> Active</label></div>
            </div>
            {(localImagePreview || dishForm.imageUrl) && <div className="mt-5 grid min-h-52 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle,rgba(255,255,255,.06),transparent_65%)] p-4"><img src={localImagePreview || dishForm.imageUrl} alt="Dish preview" className="h-52 w-full object-contain" /></div>}
            <div className="mt-5 rounded-2xl bg-white/[.03] p-4 text-xs leading-5 text-white/45">Best results: one centered real dish, full plate visible, sharp focus, simple or transparent background, 1200–2000 px long side, gentle top-down or 30–45° angle, and no watermark/text/hands. Transparent PNG/WebP files look especially clean in the levitating public menu cards.</div>
            <div className="mt-6 flex gap-3"><button className="btn-primary" disabled={state.saving || activeCategories.length === 0}>{state.saving ? "Saving…" : editingDish ? "Save dish" : "Add dish"}</button>{editingDish && <button type="button" className="btn-secondary" onClick={resetDish}>Cancel</button>}</div>
          </form>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <article key={item._id} className={`surface overflow-hidden rounded-3xl ${item.isActive ? "" : "opacity-55"}`}>
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-40 w-full object-cover" /> : <div className="flex h-40 items-center justify-center bg-white/[.02] text-sm text-white/25">No image</div>}
                <div className="p-5"><p className="text-xs uppercase tracking-[.18em] text-white/35">{item.categoryId?.name || "Category unavailable"}</p><h3 className="mt-2 font-display text-3xl">{item.name}</h3><p className="mt-2 text-sm text-white/45">৳{Number(item.price || 0).toFixed(2)} · {item.isAvailable ? "Available" : "Unavailable"}</p>{item.ingredients?.length > 0 && <p className="mt-3 text-xs leading-5 text-white/40">{item.ingredients.join(" · ")}</p>}<div className="mt-5 flex flex-wrap gap-2"><button type="button" className="btn-secondary" onClick={() => { setEditingDish(item._id); setPendingImageFile(null); setDishForm({ categoryId: item.categoryId?._id || "", name: item.name, slug: item.slug, description: item.description || "", ingredients: (item.ingredients || []).join(", "), price: item.price, imageUrl: item.imageUrl || "", isAvailable: item.isAvailable, isActive: item.isActive }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button><button type="button" className="btn-secondary" onClick={() => removeDish(item)}>Move to Trash</button></div></div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
