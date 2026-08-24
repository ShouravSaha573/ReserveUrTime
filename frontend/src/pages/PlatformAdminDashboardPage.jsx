import { useCallback, useEffect, useState } from "react";
import RestaurantAdminManagement from "../components/admin/RestaurantAdminManagement";
import RestaurantManagement from "../components/admin/RestaurantManagement";
import PlatformAdminSectionNav from "../components/PlatformAdminSectionNav";
import { apiFetch } from "../lib/api";

export default function PlatformAdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantAdmins, setRestaurantAdmins] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setError("");
    try {
      const [summaryData, restaurantData, adminData] = await Promise.all([
        apiFetch("/platform-admin/summary"),
        apiFetch("/platform-admin/restaurants"),
        apiFetch("/platform-admin/restaurant-admins")
      ]);
      setSummary(summaryData.summary);
      setRestaurants(restaurantData.restaurants || []);
      setRestaurantAdmins(adminData.restaurantAdmins || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <main className="admin-workspace mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">
        Platform Admin · Platform management
      </p>
      <h1 className="mt-5 font-display text-5xl md:text-7xl">Platform dashboard</h1>
      {error && (
        <p className="mt-8 rounded-xl bg-red-400/10 p-4 text-red-200">{error}</p>
      )}

      <PlatformAdminSectionNav />

      <section className="admin-summary mt-12" aria-labelledby="platform-overview-title">
        <div className="admin-summary-heading">
          <p className="text-xs uppercase tracking-[.25em] text-white/35">Platform overview</p>
          <h2 id="platform-overview-title" className="mt-2 font-display text-4xl">Activity at a glance</h2>
          <p>Current totals across the ReserveUrTime platform.</p>
        </div>
        <div className="admin-summary-grid">
          {[
            ["Registered guests", summary?.customers ?? "—", "Guest accounts currently registered"],
            ["Listed restaurants", summary?.restaurants ?? "—", "Restaurants managed on the platform"],
            ["Restaurant administrator accounts", summary?.restaurantAdmins ?? "—", "Admin accounts assigned to restaurants"],
            ["Total guest reservations", summary?.reservations ?? "—", "Reservations recorded across all restaurants"]
          ].map(([label, value, description]) => (
            <article key={label} className="admin-summary-item">
              <p>{label}</p>
              <strong>{loading ? "…" : value}</strong>
              <small>{description}</small>
            </article>
          ))}
        </div>
      </section>
      <RestaurantManagement
        restaurants={restaurants}
        onChanged={loadDashboard}
      />

      <RestaurantAdminManagement
        restaurantAdmins={restaurantAdmins}
        restaurants={restaurants}
        onChanged={loadDashboard}
      />

    </main>
  );
}
