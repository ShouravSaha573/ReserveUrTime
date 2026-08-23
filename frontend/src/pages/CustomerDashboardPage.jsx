import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CustomerDashboardNav from "../components/CustomerDashboardNav";
import PageMessage from "../components/PageMessage";
import { apiFetch } from "../lib/api";

export default function CustomerDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/customer/dashboard", { signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-14 md:px-8 md:py-20">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Customer dashboard</p>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-5xl md:text-7xl">
            {data?.user?.name ? `Welcome, ${data.user.name}` : "Your ReserveUrTime"}
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-white/50">
            Keep your cart, orders, reservations and profile details together in one place.
          </p>
        </div>
        <Link to="/restaurants" className="btn-secondary">Explore Restaurants</Link>
      </div>

      <CustomerDashboardNav />

      {error && <PageMessage title="Dashboard unavailable" message={error} />}

      {!data && !error && <p className="mt-10 text-white/45">Loading dashboard…</p>}

      {data && (
        <>
          <section className="customer-stat-grid">
            <Link to="/dashboard/reservations" className="customer-stat-card">
              <span>Total reservations</span>
              <strong>{data.stats.totalReservations}</strong>
            </Link>
            <Link to="/dashboard/reservations" className="customer-stat-card">
              <span>Upcoming</span>
              <strong>{data.stats.upcomingReservations}</strong>
            </Link>
            <Link to="/dashboard/cart" className="customer-stat-card">
              <span>Cart items</span>
              <strong>{data.stats.cartItems}</strong>
            </Link>
            <Link to="/dashboard/orders" className="customer-stat-card">
              <span>Total orders</span>
              <strong>{data.stats.totalOrders}</strong>
            </Link>
            <Link to="/dashboard/orders" className="customer-stat-card">
              <span>Active orders</span>
              <strong>{data.stats.activeOrders}</strong>
            </Link>
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
            <div className="surface rounded-[2rem] p-7 md:p-9">
              <p className="text-xs uppercase tracking-[.24em] text-white/32">Next reservation</p>
              {data.nextReservation ? (
                <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <h2 className="font-display text-4xl">{data.nextReservation.restaurantId?.name}</h2>
                    <p className="mt-3 text-white/50">{data.nextReservation.restaurantId?.location}</p>
                    <p className="mt-6 text-sm leading-7 text-white/65">
                      {data.nextReservation.reservationDate} · {data.nextReservation.timeSlot}<br />
                      {data.nextReservation.guestCount} guest(s) · Table {data.nextReservation.tableId?.tableNumber}
                    </p>
                  </div>
                  <Link to="/dashboard/reservations" className="btn-primary">View reservation</Link>
                </div>
              ) : (
                <div className="mt-6">
                  <h2 className="font-display text-3xl">No upcoming reservation</h2>
                  <p className="mt-3 text-white/45">Choose a Restaurant when you are ready to reserve a table.</p>
                  <Link to="/restaurants" className="btn-secondary mt-6">Find a Restaurant</Link>
                </div>
              )}
            </div>

            <div className="surface rounded-[2rem] p-7 md:p-9">
              <p className="text-xs uppercase tracking-[.24em] text-white/32">Account</p>
              <h2 className="mt-5 font-display text-3xl">{data.user?.email}</h2>
              <p className="mt-3 text-white/45">{data.user?.phone || "No phone number saved yet."}</p>
              <Link to="/dashboard/profile" className="btn-secondary mt-7">Edit profile</Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
