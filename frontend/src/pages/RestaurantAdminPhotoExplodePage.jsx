import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import PhotoExplodeDish from "../components/motion/PhotoExplodeDish";
import RestaurantAdminSectionNav from "../components/RestaurantAdminSectionNav";
import { apiFetch } from "../lib/api";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export default function RestaurantAdminPhotoExplodePage() {
  const reduced = useReducedMotion();
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [payload, setPayload] = useState(null);
  const [draft, setDraft] = useState(null);
  const [exploded, setExploded] = useState(false);
  const [state, setState] = useState({ loading: true, saving: false, error: "", success: "" });

  const loadItems = useCallback(async () => {
    try {
      const data = await apiFetch("/restaurant-admin/menu/items");
      const imageItems = (data.items || []).filter((item) => item.imageUrl || item.photoExplode?.sourceImageUrl);
      setItems(imageItems);
      setSelectedId((current) => current || imageItems[0]?._id || "");
      setState((current) => ({ ...current, loading: false, error: "" }));
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    if (!selectedId) {
      setPayload(null);
      setDraft(null);
      return;
    }
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: "", success: "" }));
    apiFetch(`/restaurant-admin/menu/items/${selectedId}/photo-explode`, { signal: controller.signal })
      .then((data) => {
        setPayload(data);
        setDraft(clone(data.photoExplode));
        setExploded(false);
        setState((current) => ({ ...current, loading: false, error: "" }));
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState((current) => ({ ...current, loading: false, error: error.message }));
        }
      });
    return () => controller.abort();
  }, [selectedId]);

  const imageUrl = useMemo(
    () => draft?.sourceImageUrl || payload?.item?.imageUrl || "",
    [draft?.sourceImageUrl, payload?.item?.imageUrl]
  );

  function update(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function resetSaved() {
    if (!payload?.photoExplode) return;
    setDraft(clone(payload.photoExplode));
    setExploded(false);
    setState((current) => ({ ...current, success: "Reverted to the last saved Photo Explode settings.", error: "" }));
  }

  function resetRecommended() {
    setDraft((current) => ({
      ...current,
      enabled: true,
      layerCount: 8,
      gap: 18,
      depth: 36,
      tilt: 2.5,
      duration: 0.9,
      stagger: 0.04,
      easing: "cinematic",
      autoPreview: false
    }));
    setState((current) => ({ ...current, success: "Recommended Photo Explode settings restored locally.", error: "" }));
  }

  async function save() {
    if (!selectedId || !draft) return;
    setState((current) => ({ ...current, saving: true, error: "", success: "" }));
    try {
      const data = await apiFetch(`/restaurant-admin/menu/items/${selectedId}/photo-explode`, {
        method: "PATCH",
        body: draft,
        retryGet: false
      });
      setPayload(data);
      setDraft(clone(data.photoExplode));
      setState((current) => ({ ...current, saving: false, success: data.message, error: "" }));
      await loadItems();
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.message, success: "" }));
    }
  }

  return (
    <main className="admin-workspace mx-auto max-w-[1500px] px-6 py-12 md:px-8 md:py-16">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs uppercase tracking-[.3em] text-white/35">Restaurant Admin · Image animation studio</p>
        <h1 className="mt-4 font-display text-5xl md:text-7xl">Photo Explode Editor</h1>
        <p className="mt-5 max-w-4xl leading-7 text-white/55">
          Every accepted dish photo can become a smooth layered 2.5D explode/assemble animation. This is an image-slice effect powered by Motion; it does not invent real ingredient geometry. For true ingredient-separated 3D, keep using the GLB 3D Animation Editor.
        </p>
      </motion.div>

      <RestaurantAdminSectionNav />

      {state.error && <p className="mt-6 rounded-2xl bg-red-400/10 p-4 text-sm text-red-200">{state.error}</p>}
      {state.success && <p className="mt-6 rounded-2xl bg-emerald-400/10 p-4 text-sm text-emerald-100">{state.success}</p>}

      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,.9fr)_minmax(520px,1.1fr)]">
        <div className="space-y-6">
          <div className="surface rounded-3xl p-6">
            <label className="block">
              <span className="mb-2 block text-sm text-white/60">Dish with image</span>
              <select className="input-field" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                {items.length === 0 && <option value="">No dish images yet</option>}
                {items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </label>
            {items.length === 0 && (
              <p className="mt-4 text-sm leading-6 text-white/45">
                Add or upload a dish photo from Menu Management first. PNG, JPEG and WebP are accepted; uploads are limited to 6 MB.
              </p>
            )}
          </div>

          {draft && (
            <div className="surface rounded-3xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="eyebrow">Layer motion</p>
                  <h2 className="mt-2 font-display text-3xl">Photo Explode controls</h2>
                </div>
                <label className="flex items-center gap-3 text-sm text-white/60">
                  <input type="checkbox" checked={draft.enabled} onChange={(e) => update("enabled", e.target.checked)} />
                  Enabled publicly
                </label>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label><span className="mb-2 block text-sm text-white/60">Layer count</span><input className="input-field" type="number" min="4" max="16" value={draft.layerCount} onChange={(e) => update("layerCount", e.target.value)} /></label>
                <label><span className="mb-2 block text-sm text-white/60">Layer gap</span><input className="input-field" type="number" min="4" max="48" step="1" value={draft.gap} onChange={(e) => update("gap", e.target.value)} /></label>
                <label><span className="mb-2 block text-sm text-white/60">Depth</span><input className="input-field" type="number" min="0" max="90" step="1" value={draft.depth} onChange={(e) => update("depth", e.target.value)} /></label>
                <label><span className="mb-2 block text-sm text-white/60">Tilt per layer</span><input className="input-field" type="number" min="0" max="12" step="0.25" value={draft.tilt} onChange={(e) => update("tilt", e.target.value)} /></label>
                <label><span className="mb-2 block text-sm text-white/60">Duration</span><input className="input-field" type="number" min="0.25" max="2.5" step="0.05" value={draft.duration} onChange={(e) => update("duration", e.target.value)} /></label>
                <label><span className="mb-2 block text-sm text-white/60">Stagger</span><input className="input-field" type="number" min="0" max="0.15" step="0.005" value={draft.stagger} onChange={(e) => update("stagger", e.target.value)} /></label>
                <label className="md:col-span-2"><span className="mb-2 block text-sm text-white/60">Motion feel</span><select className="input-field" value={draft.easing} onChange={(e) => update("easing", e.target.value)}>{(payload?.easingPresets || []).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
              </div>

              <label className="mt-5 flex items-center gap-3 text-sm text-white/60">
                <input type="checkbox" checked={draft.autoPreview} onChange={(e) => update("autoPreview", e.target.checked)} />
                Allow subtle automatic preview in supported future cinematic surfaces
              </label>

              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="btn-primary" onClick={save} disabled={state.saving}>{state.saving ? "Saving…" : "Save & publish"}</button>
                <button type="button" className="btn-secondary" onClick={resetSaved}>Revert unsaved</button>
                <button type="button" className="btn-secondary" onClick={resetRecommended}>Recommended motion</button>
              </div>
            </div>
          )}

          <div className="surface rounded-3xl p-6">
            <p className="eyebrow">Image guide</p>
            <h2 className="mt-2 font-display text-3xl">Best image for smooth Photo Explode</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-white/55">
              <li>• Use a sharp PNG, JPEG or WebP, ideally 1200–2000 px on the longest side.</li>
              <li>• Keep the entire plate/dish visible and centered with breathing room around it.</li>
              <li>• Transparent or simple dark/neutral backgrounds look best; busy backgrounds also split into layers.</li>
              <li>• Use a top-down or gentle 30–45° camera angle; avoid extreme perspective.</li>
              <li>• Avoid text, watermarks, hands, cut-off plates, strong motion blur and overexposure.</li>
              <li>• One main dish per image gives the cleanest layered read.</li>
              <li>• Upload ≤ 6 MB. SVG is rejected for security; use PNG/JPEG/WebP only.</li>
            </ul>
          </div>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <div className="surface overflow-hidden rounded-[2rem] p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
              <div><p className="eyebrow">Live Motion preview</p><h2 className="mt-2 font-display text-3xl">{payload?.item?.name || "Choose a dish"}</h2></div>
              <span className="text-xs text-white/35">Unsaved controls preview locally</span>
            </div>
            <div className="photo-explode-admin-preview">
              {imageUrl && draft ? (
                <PhotoExplodeDish
                  imageUrl={imageUrl}
                  alt={payload?.item?.name || "Dish"}
                  config={draft}
                  controlledExploded={exploded}
                  onExplodedChange={setExploded}
                  showControl={false}
                />
              ) : (
                <div className="flex min-h-[24rem] items-center justify-center text-sm text-white/35">No dish image selected.</div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="btn-secondary" onClick={() => setExploded(true)} disabled={!imageUrl}>Preview explode</button>
              <button type="button" className="btn-secondary" onClick={() => setExploded(false)} disabled={!imageUrl}>Preview assemble</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
