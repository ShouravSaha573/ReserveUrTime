import { useCallback, useEffect, useState } from "react";
import RestaurantAdminSectionNav from "../components/RestaurantAdminSectionNav";
import { apiFetch } from "../lib/api";

function statusStyle(status) {
  if (status === "confirmed") return "bg-sky-400/10 text-sky-100";
  if (status === "completed") return "bg-emerald-400/10 text-emerald-100";
  if (status === "cancelled") return "bg-red-400/10 text-red-200";
  return "bg-amber-300/10 text-amber-100";
}

export default function RestaurantAdminReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");
  const [state, setState] = useState({ loading: true, error: "", success: "" });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (date) params.set("date", date);
      const data = await apiFetch(`/restaurant-admin/reservations${params.toString() ? `?${params}` : ""}`);
      setReservations(data.reservations || []);
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setState((current) => ({ ...current, loading: false }));
    }
  }, [date, status]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(reservation, nextStatus) {
    const action = nextStatus === "cancelled" ? "cancel" : `mark ${nextStatus}`;
    if (!window.confirm(`Are you sure you want to ${action} reservation ${reservation.bookingReference}?`)) return;
    try {
      const data = await apiFetch(`/restaurant-admin/reservations/${reservation._id}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
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
      <h1 className="mt-4 font-display text-5xl md:text-7xl">Reservation schedule</h1>
      <p className="mt-5 max-w-3xl leading-7 text-white/55">
        View only your assigned Restaurant reservations. Confirm pending bookings, mark confirmed bookings completed, or cancel active bookings. Completed/cancelled records remain preserved.
      </p>
      <RestaurantAdminSectionNav />

      <section className="surface mt-8 rounded-3xl p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block"><span className="mb-2 block text-sm text-white/60">Status</span><select className="input-field" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Date</span><input className="input-field" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <div className="flex items-end"><button type="button" className="btn-secondary w-full" onClick={() => { setStatus("all"); setDate(""); }}>Clear filters</button></div>
        </div>
      </section>

      {state.error && <p className="mt-6 rounded-xl bg-red-400/10 p-4 text-sm text-red-200">{state.error}</p>}
      {state.success && <p className="mt-6 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-100">{state.success}</p>}

      <section className="mt-8 space-y-4">
        {state.loading && <p className="text-white/40">Loading reservations…</p>}
        {!state.loading && reservations.length === 0 && <div className="surface rounded-3xl p-8 text-white/45">No reservations match these filters.</div>}
        {reservations.map((reservation) => (
          <article key={reservation._id} className="surface rounded-3xl p-6 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs uppercase tracking-[.2em] text-white/35">{reservation.bookingReference}</p><h2 className="mt-2 font-display text-3xl">{reservation.userId?.name || "Customer"}</h2><p className="mt-2 text-sm text-white/45">{reservation.userId?.email || "—"}{reservation.userId?.phone ? ` · ${reservation.userId.phone}` : ""}</p></div>
              <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[.12em] ${statusStyle(reservation.status)}`}>{reservation.status}</span>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-white/55 sm:grid-cols-2 lg:grid-cols-4"><p><span className="text-white/80">Date:</span> {reservation.reservationDate}</p><p><span className="text-white/80">Time:</span> {reservation.timeSlot}</p><p><span className="text-white/80">Guests:</span> {reservation.guestCount}</p><p><span className="text-white/80">Table:</span> {reservation.tableIds?.length ? reservation.tableIds.map((table) => `${table.tableNumber} · ${table.area || "Main Dining"}`).join(", ") : `${reservation.tableId?.tableNumber || "—"} · ${reservation.tableId?.area || ""}`}</p></div>
            <div className="mt-5 flex flex-wrap gap-2">{reservation.status === "pending" && <button type="button" className="btn-primary" onClick={() => updateStatus(reservation, "confirmed")}>Confirm</button>}{reservation.status === "confirmed" && <button type="button" className="btn-primary" onClick={() => updateStatus(reservation, "completed")}>Mark completed</button>}{["pending", "confirmed"].includes(reservation.status) && <button type="button" className="btn-secondary" onClick={() => updateStatus(reservation, "cancelled")}>Cancel reservation</button>}</div>
          </article>
        ))}
      </section>
    </main>
  );
}
