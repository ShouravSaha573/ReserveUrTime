import { useCallback, useEffect, useMemo, useState } from "react";
import RestaurantAdminSectionNav from "../components/RestaurantAdminSectionNav";
import LottieFlowIcon from "../components/LottieFlowIcon";
import { apiFetch, apiUpload } from "../lib/api";

function statusClass(status) {
  if (status === "approved") return "bg-emerald-400/10 text-emerald-200";
  if (status === "rejected") return "bg-red-400/10 text-red-200";
  return "bg-amber-300/10 text-amber-100";
}

export default function RestaurantAdminListingRequestsPage() {
  const [restaurant, setRestaurant] = useState(null);
  const [requests, setRequests] = useState([]);
  const [type, setType] = useState("restaurant_name");
  const [proposedValue, setProposedValue] = useState("");
  const [note, setNote] = useState("");
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [localImagePreview, setLocalImagePreview] = useState("");
  const [draggingImage, setDraggingImage] = useState(false);
  const [state, setState] = useState({ loading: true, saving: false, error: "", success: "" });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, error: "" }));
    try {
      const [restaurantData, requestData] = await Promise.all([
        apiFetch("/restaurant-admin/me/restaurant"),
        apiFetch("/restaurant-admin/listing-change-requests")
      ]);
      setRestaurant(restaurantData.restaurant);
      setRequests(requestData.requests || []);
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setState((current) => ({ ...current, loading: false }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendingTypes = useMemo(
    () => new Set(requests.filter((item) => item.status === "pending").map((item) => item.type)),
    [requests]
  );

  useEffect(() => {
    if (!restaurant) return;
    setProposedValue(
      type === "restaurant_name"
        ? restaurant.name || ""
        : restaurant.coverImageUrl || ""
    );
  }, [restaurant, type]);

  useEffect(() => {
    if (!pendingImageFile) { setLocalImagePreview(""); return undefined; }
    const preview = URL.createObjectURL(pendingImageFile);
    setLocalImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [pendingImageFile]);

  function chooseImage(file) {
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setState((current) => ({ ...current, error: "Choose a PNG, JPEG or WebP image.", success: "" }));
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setState((current) => ({ ...current, error: "The image must be 6 MB or smaller.", success: "" }));
      return;
    }
    setPendingImageFile(file);
    setState((current) => ({ ...current, error: "", success: "Image selected. Send the request when ready." }));
  }

  async function submit(event) {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: "", success: "" }));
    try {
      let nextProposedValue = proposedValue;
      if (type === "listing_image" && pendingImageFile) {
        const uploaded = await apiUpload("/restaurant-admin/listing-change-requests/image", pendingImageFile);
        nextProposedValue = uploaded.imageUrl;
      }
      if (type === "listing_image" && !nextProposedValue.trim()) {
        throw new Error("Drop an image here or provide an image URL.");
      }
      const data = await apiFetch("/restaurant-admin/listing-change-requests", {
        method: "POST",
        body: { type, proposedValue: nextProposedValue, note },
        retryGet: false
      });
      setState((current) => ({ ...current, saving: false, success: data.message }));
      setNote("");
      setPendingImageFile(null);
      await load();
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.message }));
    }
  }

  return (
    <main className="admin-workspace mx-auto max-w-6xl px-6 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Restaurant Admin · Platform listing requests</p>
      <h1 className="mt-4 font-display text-5xl md:text-7xl">Request a public change</h1>
      <p className="mt-5 max-w-3xl leading-7 text-white/55">
        Restaurant Admin cannot directly change the Restaurant name or the image used on the homepage/Restaurants tab. Submit a request; the live listing changes only after Platform Admin approval.
      </p>
      <RestaurantAdminSectionNav />

      {restaurant && (
        <section className="mt-8 grid gap-4 md:grid-cols-[.8fr_1.2fr]">
          <div className="surface rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[.24em] text-white/35">Current live name</p>
            <p className="mt-3 font-display text-4xl">{restaurant.name}</p>
          </div>
          <div className="surface overflow-hidden rounded-3xl">
            {restaurant.coverImageUrl ? <img src={restaurant.coverImageUrl} alt="Current Restaurant listing" className="h-52 w-full object-cover" /> : <div className="flex h-52 items-center justify-center text-white/30">No live listing image</div>}
          </div>
        </section>
      )}

      <form onSubmit={submit} className="surface mt-8 rounded-3xl p-6 md:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block"><span className="mb-2 block text-sm text-white/60">Change type</span><select className="input-field" value={type} onChange={(event) => setType(event.target.value)}><option value="restaurant_name">Restaurant name</option><option value="listing_image">Homepage / Restaurants-tab image</option></select></label>
          {type === "restaurant_name" ? (
            <label className="block"><span className="mb-2 block text-sm text-white/60">Proposed value</span><input className="input-field" value={proposedValue} onChange={(event) => setProposedValue(event.target.value)} placeholder="New Restaurant name" required /></label>
          ) : (
            <div className="block">
              <span className="mb-2 block text-sm text-white/60">Proposed image</span>
              <label
                className={`listing-image-dropzone ${draggingImage ? "is-dragging" : ""}`}
                onDragEnter={(event) => { event.preventDefault(); setDraggingImage(true); }}
                onDragOver={(event) => { event.preventDefault(); setDraggingImage(true); }}
                onDragLeave={(event) => { event.preventDefault(); setDraggingImage(false); }}
                onDrop={(event) => { event.preventDefault(); setDraggingImage(false); chooseImage(event.dataTransfer.files?.[0]); }}
              >
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseImage(event.target.files?.[0])} />
                <span className="listing-image-drop-icon"><LottieFlowIcon name="success" /></span>
                <strong>{pendingImageFile ? pendingImageFile.name : "Drag an image from your PC"}</strong>
                <small>{pendingImageFile ? `${(pendingImageFile.size / 1024 / 1024).toFixed(2)} MB selected` : "or click to browse · PNG, JPEG or WebP · max 6 MB"}</small>
              </label>
              <input className="input-field mt-3" value={proposedValue} onChange={(event) => { setProposedValue(event.target.value); setPendingImageFile(null); }} placeholder="Or paste an image URL" />
            </div>
          )}
          <label className="block md:col-span-2"><span className="mb-2 block text-sm text-white/60">Reason / note (optional)</span><textarea className="input-field min-h-24 resize-y" value={note} onChange={(event) => setNote(event.target.value)} /></label>
        </div>
        {type === "listing_image" && (localImagePreview || proposedValue) && <div className="mt-5 overflow-hidden rounded-2xl border border-white/10"><img src={localImagePreview || proposedValue} alt="Proposed listing preview" className="h-56 w-full object-cover" /></div>}
        {pendingTypes.has(type) && <p className="mt-5 rounded-xl bg-amber-300/10 p-4 text-sm text-amber-100">A pending request of this type already exists. Platform Admin must review it first.</p>}
        {state.error && <p className="mt-5 rounded-xl bg-red-400/10 p-4 text-sm text-red-200">{state.error}</p>}
        {state.success && <p className="mt-5 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-100">{state.success}</p>}
        <button className="btn-primary mt-6" disabled={state.saving || pendingTypes.has(type)}>{state.saving ? "Sending…" : "Send to Platform Admin"}</button>
      </form>

      <section className="mt-12">
        <h2 className="font-display text-4xl">Request history</h2>
        <div className="mt-6 space-y-4">
          {state.loading && <p className="text-white/45">Loading requests…</p>}
          {!state.loading && requests.length === 0 && <div className="surface rounded-3xl p-6 text-white/45">No listing change requests yet.</div>}
          {requests.map((request) => (
            <article key={request._id} className="surface rounded-3xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[.2em] text-white/35">{request.type === "restaurant_name" ? "Restaurant name" : "Listing image"}</p>
                  <p className="mt-3 break-all text-sm text-white/50">Current: {request.currentValue || "—"}</p>
                  <p className="mt-2 break-all text-white/85">Proposed: {request.proposedValue}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[.12em] ${statusClass(request.status)}`}>{request.status}</span>
              </div>
              {request.note && <p className="mt-4 text-sm text-white/55">Your note: {request.note}</p>}
              {request.adminNote && <p className="mt-2 text-sm text-white/55">Platform Admin note: {request.adminNote}</p>}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
