import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ExplodedDishCanvas from "../components/three/ExplodedDishCanvas";
import RestaurantAdminSectionNav from "../components/RestaurantAdminSectionNav";
import { apiFetch } from "../lib/api";

const RECOMMENDED = {
  duration: 1.15,
  stagger: 0.075,
  easing: "power3.inOut",
  autoAssemble: true,
  autoAssembleDelay: 650,
  floatIntensity: 0.1,
  rotationIntensity: 0.06
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export default function RestaurantAdmin3DAnimationPage() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [payload, setPayload] = useState(null);
  const [draft, setDraft] = useState(null);
  const [mode, setMode] = useState("loading");
  const [state, setState] = useState({ loading: true, saving: false, error: "", success: "" });
  const controlsRef = useRef(null);

  const loadItems = useCallback(async () => {
    try {
      const data = await apiFetch("/restaurant-admin/menu/items");
      const enabled = (data.items || []).filter((item) => item.threeD?.enabled && item.threeD?.modelUrl);
      setItems(enabled);
      setSelectedId((current) => current || enabled[0]?._id || "");
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
    apiFetch(`/restaurant-admin/menu/items/${selectedId}/3d-animation`, { signal: controller.signal })
      .then((data) => {
        setPayload(data);
        setDraft(clone(data.animation));
        setState((current) => ({ ...current, loading: false, error: "" }));
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState((current) => ({ ...current, loading: false, error: error.message }));
        }
      });
    return () => controller.abort();
  }, [selectedId]);

  const previewAsset = useMemo(() => {
    if (!payload?.item?.threeD || !draft) return null;
    return {
      ...payload.item.threeD,
      animation: {
        duration: Number(draft.duration),
        stagger: Number(draft.stagger),
        easing: draft.easing,
        autoAssemble: Boolean(draft.autoAssemble),
        autoAssembleDelay: Number(draft.autoAssembleDelay),
        floatIntensity: Number(draft.floatIntensity),
        rotationIntensity: Number(draft.rotationIntensity)
      },
      layers: draft.layers
    };
  }, [draft, payload]);

  function updateGlobal(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function updateLayer(index, field, value) {
    setDraft((current) => {
      const layers = clone(current.layers);
      if (field.startsWith("offset.")) {
        const axis = field.split(".")[1];
        layers[index].explodedOffset[axis] = value;
      } else if (field.startsWith("rotation.")) {
        const axis = field.split(".")[1];
        layers[index].rotationOffset = layers[index].rotationOffset || { x: 0, y: 0, z: 0 };
        layers[index].rotationOffset[axis] = value;
      } else {
        layers[index][field] = value;
      }
      return { ...current, layers };
    });
  }

  function resetRecommended() {
    setDraft((current) => ({
      ...current,
      ...RECOMMENDED,
      layers: current.layers.map((layer, index) => ({
        ...layer,
        enabled: true,
        sequence: index,
        rotationOffset: layer.rotationOffset || { x: 0, y: 0, z: 0 },
        explodeScale: layer.explodeScale ?? 1
      }))
    }));
    setState((current) => ({ ...current, success: "Recommended timing restored locally. Save to publish it.", error: "" }));
  }

  function resetSaved() {
    if (!payload?.animation) return;
    setDraft(clone(payload.animation));
    setState((current) => ({ ...current, success: "Reverted to the last saved animation locally.", error: "" }));
  }

  async function save() {
    if (!selectedId || !draft) return;
    setState((current) => ({ ...current, saving: true, error: "", success: "" }));
    try {
      const data = await apiFetch(`/restaurant-admin/menu/items/${selectedId}/3d-animation`, {
        method: "PATCH",
        body: draft,
        retryGet: false
      });
      setPayload(data);
      setDraft(clone(data.animation));
      setState((current) => ({ ...current, saving: false, success: data.message, error: "" }));
      await loadItems();
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.message, success: "" }));
    }
  }

  return (
    <main className="admin-workspace mx-auto max-w-[1500px] px-6 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Restaurant Admin · Own Restaurant only</p>
      <h1 className="mt-4 font-display text-5xl md:text-7xl">3D Animation Editor</h1>
      <p className="mt-5 max-w-4xl leading-7 text-white/55">
        Tune safe exploded-layer animation settings for your own 3D-enabled dishes. The GLB keeps the assembled geometry; this editor changes only validated animation metadata.
      </p>
      <RestaurantAdminSectionNav />

      {state.error && <p className="mt-6 rounded-2xl bg-red-400/10 p-4 text-sm text-red-200">{state.error}</p>}
      {state.success && <p className="mt-6 rounded-2xl bg-emerald-400/10 p-4 text-sm text-emerald-100">{state.success}</p>}

      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,.9fr)_minmax(520px,1.1fr)]">
        <div className="space-y-6">
          <div className="surface rounded-3xl p-6">
            <label className="block">
              <span className="mb-2 block text-sm text-white/60">3D-enabled dish</span>
              <select className="input-field" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                {items.length === 0 && <option value="">No 3D-enabled dishes</option>}
                {items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </label>
          </div>

          {draft && payload && (
            <>
              <div className="surface rounded-3xl p-6">
                <p className="eyebrow">Global motion</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="block"><span className="mb-2 block text-sm text-white/60">Duration (seconds)</span><input className="input-field" type="number" min="0.2" max="4" step="0.05" value={draft.duration} onChange={(e) => updateGlobal("duration", e.target.value)} /></label>
                  <label className="block"><span className="mb-2 block text-sm text-white/60">Stagger (seconds)</span><input className="input-field" type="number" min="0" max="0.5" step="0.005" value={draft.stagger} onChange={(e) => updateGlobal("stagger", e.target.value)} /></label>
                  <label className="block"><span className="mb-2 block text-sm text-white/60">Easing preset</span><select className="input-field" value={draft.easing} onChange={(e) => updateGlobal("easing", e.target.value)}>{(payload.easingPresets || []).map((preset) => <option key={preset} value={preset}>{preset}</option>)}</select></label>
                  <label className="block"><span className="mb-2 block text-sm text-white/60">Auto-assemble delay (ms)</span><input className="input-field" type="number" min="0" max="5000" step="25" value={draft.autoAssembleDelay} onChange={(e) => updateGlobal("autoAssembleDelay", e.target.value)} /></label>
                  <label className="block"><span className="mb-2 block text-sm text-white/60">Float intensity</span><input className="input-field" type="number" min="0" max="0.5" step="0.01" value={draft.floatIntensity} onChange={(e) => updateGlobal("floatIntensity", e.target.value)} /></label>
                  <label className="block"><span className="mb-2 block text-sm text-white/60">Rotation intensity</span><input className="input-field" type="number" min="0" max="0.5" step="0.01" value={draft.rotationIntensity} onChange={(e) => updateGlobal("rotationIntensity", e.target.value)} /></label>
                </div>
                <label className="mt-5 flex items-center gap-3 text-sm text-white/60"><input type="checkbox" checked={draft.autoAssemble} onChange={(e) => updateGlobal("autoAssemble", e.target.checked)} /> Auto-play exploded → assembled when the dish opens</label>
              </div>

              <div className="surface rounded-3xl p-6">
                <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Named GLB layers</p><p className="mt-2 text-sm text-white/45">Position offsets are bounded to −5…5. Rotation is bounded to −45°…45° and explode scale to 0.8…1.25. Unknown GLB mesh names cannot be submitted.</p></div></div>
                <div className="mt-5 space-y-4">
                  {draft.layers.map((layer, index) => (
                    <div key={layer.meshName} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div><strong className="text-white/90">{layer.label || layer.meshName}</strong><code className="ml-3 text-xs text-white/30">{layer.meshName}</code></div>
                        <label className="flex items-center gap-2 text-xs text-white/55"><input type="checkbox" checked={layer.enabled !== false} onChange={(e) => updateLayer(index, "enabled", e.target.checked)} /> Explodes</label>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <label><span className="mb-1 block text-xs text-white/40">Sequence</span><input className="input-field" type="number" min="0" max="99" value={layer.sequence} onChange={(e) => updateLayer(index, "sequence", e.target.value)} /></label>
                        {[["X", "x"], ["Y", "y"], ["Z", "z"]].map(([label, axis]) => <label key={axis}><span className="mb-1 block text-xs text-white/40">{label} offset</span><input className="input-field" type="number" min="-5" max="5" step="0.05" value={layer.explodedOffset?.[axis] ?? 0} onChange={(e) => updateLayer(index, `offset.${axis}`, e.target.value)} /></label>)}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                        {[["Rotate X°", "x"], ["Rotate Y°", "y"], ["Rotate Z°", "z"]].map(([label, axis]) => <label key={axis}><span className="mb-1 block text-xs text-white/40">{label}</span><input className="input-field" type="number" min="-45" max="45" step="1" value={layer.rotationOffset?.[axis] ?? 0} onChange={(e) => updateLayer(index, `rotation.${axis}`, e.target.value)} /></label>)}
                        <label><span className="mb-1 block text-xs text-white/40">Explode scale</span><input className="input-field" type="number" min="0.8" max="1.25" step="0.01" value={layer.explodeScale ?? 1} onChange={(e) => updateLayer(index, "explodeScale", e.target.value)} /></label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn-primary" onClick={save} disabled={state.saving}>{state.saving ? "Saving…" : "Save & publish animation"}</button>
                <button type="button" className="btn-secondary" onClick={resetSaved}>Revert unsaved</button>
                <button type="button" className="btn-secondary" onClick={resetRecommended}>Recommended timing</button>
              </div>
            </>
          )}
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <div className="surface overflow-hidden rounded-[2rem] p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4"><div><p className="eyebrow">Live local preview</p><h2 className="mt-2 font-display text-3xl">{payload?.item?.name || "Choose a dish"}</h2></div><span className="text-xs text-white/35">Unsaved changes preview immediately</span></div>
            <div className="dish3d-admin-preview">
              {previewAsset ? <ExplodedDishCanvas asset={previewAsset} controlsRef={controlsRef} onModeChange={setMode} /> : <div className="flex h-full items-center justify-center text-sm text-white/35">No 3D asset selected.</div>}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="btn-secondary" onClick={() => controlsRef.current?.explode()} disabled={!previewAsset || mode === "animating"}>Preview explode</button>
              <button type="button" className="btn-secondary" onClick={() => controlsRef.current?.assemble()} disabled={!previewAsset || mode === "animating"}>Preview assemble</button>
              <span className="self-center text-xs text-white/35">{mode === "animating" ? "Animating…" : mode}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
