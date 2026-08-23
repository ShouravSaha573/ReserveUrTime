import { useEffect, useState } from "react";
import RestaurantAdminSectionNav from "../components/RestaurantAdminSectionNav";
import { apiFetch } from "../lib/api";

export default function RestaurantAdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/restaurant-admin/summary")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="admin-workspace mx-auto max-w-6xl px-6 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Restaurant Admin · Scoped management</p>
      <h1 className="mt-5 font-display text-5xl md:text-7xl">
        {data?.restaurant?.name || "Restaurant dashboard"}
      </h1>
      <p className="mt-5 max-w-3xl leading-7 text-white/55">
        Your account is locked to one assigned Restaurant. Internal profile data belongs to Restaurant management; public name and listing image changes require Platform Admin approval.
      </p>
      {error && <p className="mt-8 rounded-xl bg-red-400/10 p-4 text-red-200">{error}</p>}

      <RestaurantAdminSectionNav />

      <div className="admin-metric-grid mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface rounded-3xl p-6"><p className="text-sm text-white/40">Assigned Restaurant</p><p className="mt-3 font-display text-3xl">{data?.restaurant?.name || "—"}</p></div>
        <div className="surface rounded-3xl p-6"><p className="text-sm text-white/40">Active tables</p><p className="mt-3 font-display text-5xl">{data?.summary?.tables ?? "—"}</p></div>
        <div className="surface rounded-3xl p-6"><p className="text-sm text-white/40">Menu categories</p><p className="mt-3 font-display text-5xl">{data?.summary?.categories ?? "—"}</p></div>
        <div className="surface rounded-3xl p-6"><p className="text-sm text-white/40">Active dishes</p><p className="mt-3 font-display text-5xl">{data?.summary?.dishes ?? "—"}</p></div>
        <div className="surface rounded-3xl p-6"><p className="text-sm text-white/40">Orders</p><p className="mt-3 font-display text-5xl">{data?.summary?.orders ?? "—"}</p></div>
        <div className="surface rounded-3xl p-6"><p className="text-sm text-white/40">Active orders</p><p className="mt-3 font-display text-5xl">{data?.summary?.activeOrders ?? "—"}</p></div>
        <div className="surface rounded-3xl p-6"><p className="text-sm text-white/40">Reservations</p><p className="mt-3 font-display text-5xl">{data?.summary?.reservations ?? "—"}</p></div>
        <div className="surface rounded-3xl p-6"><p className="text-sm text-white/40">Gallery items</p><p className="mt-3 font-display text-5xl">{data?.summary?.galleryItems ?? "—"}</p></div>
        <div className="surface rounded-3xl p-6"><p className="text-sm text-white/40">Pending listing requests</p><p className="mt-3 font-display text-5xl">{data?.summary?.pendingChanges ?? "—"}</p></div>
      </div>

      {data?.restaurant && (
        <section className="surface mt-8 rounded-3xl p-6 md:p-8">
          <p className="text-xs uppercase tracking-[.25em] text-white/35">Current platform listing (read only here)</p>
          <div className="mt-5 grid gap-4 text-sm text-white/55 md:grid-cols-2">
            <p><span className="text-white/80">Cuisine:</span> {data.restaurant.cuisine}</p>
            <p><span className="text-white/80">Location:</span> {data.restaurant.location}</p>
            <p><span className="text-white/80">Hours:</span> {data.restaurant.openingHours}</p>
            <p><span className="text-white/80">Slug:</span> {data.restaurant.slug}</p>
          </div>
        </section>
      )}
    </main>
  );
}
