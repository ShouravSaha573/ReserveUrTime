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

      <div className="admin-metric-grid mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Customers", summary?.customers ?? "—"],
          ["Restaurants", summary?.restaurants ?? "—"],
          ["Restaurant Admins", summary?.restaurantAdmins ?? "—"],
          ["Reservations", summary?.reservations ?? "—"]
        ].map(([label, value]) => (
          <div key={label} className="surface rounded-3xl p-6">
            <p className="text-sm text-white/40">{label}</p>
            <p className="mt-3 font-display text-5xl">{loading ? "…" : value}</p>
          </div>
        ))}
      </div>

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
