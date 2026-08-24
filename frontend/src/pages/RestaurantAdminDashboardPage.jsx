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
      {error && <p className="mt-8 rounded-xl bg-red-400/10 p-4 text-red-200">{error}</p>}

      <RestaurantAdminSectionNav />

      <section className="admin-summary mt-12" aria-labelledby="restaurant-overview-title">
        <div className="admin-summary-heading">
          <p className="text-xs uppercase tracking-[.25em] text-white/35">Live overview</p>
          <h2 id="restaurant-overview-title" className="mt-2 font-display text-4xl">Restaurant at a glance</h2>
          <p>Current operational totals for {data?.restaurant?.name || "your assigned restaurant"}.</p>
        </div>
        <div className="admin-summary-grid">
          {[
            ["Assigned restaurant", data?.restaurant?.name || "—", "The restaurant managed by this account"],
            ["Active dining tables", data?.summary?.tables ?? "—", "Tables currently available for service"],
            ["Menu categories", data?.summary?.categories ?? "—", "Sections organizing the restaurant menu"],
            ["Active menu dishes", data?.summary?.dishes ?? "—", "Published dishes guests can order"],
            ["Total food orders", data?.summary?.orders ?? "—", "All food orders recorded for this restaurant"],
            ["Orders in progress", data?.summary?.activeOrders ?? "—", "Orders currently requiring attention"],
            ["Total reservations", data?.summary?.reservations ?? "—", "Reservations recorded for this restaurant"],
            ["Published gallery images", data?.summary?.galleryItems ?? "—", "Images visible in the restaurant gallery"],
            ["Listing changes awaiting approval", data?.summary?.pendingChanges ?? "—", "Requests waiting for Platform Admin review"]
          ].map(([label, value, description]) => (
            <article key={label} className="admin-summary-item">
              <p>{label}</p>
              <strong>{value}</strong>
              <small>{description}</small>
            </article>
          ))}
        </div>
      </section>
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
