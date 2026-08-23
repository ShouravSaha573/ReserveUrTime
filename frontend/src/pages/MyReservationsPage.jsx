import {
  useCallback,
  useEffect,
  useState
} from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import PageMessage from "../components/PageMessage";
import CustomerDashboardNav from "../components/CustomerDashboardNav";

export default function MyReservationsPage() {
  const [reservations, setReservations] =
    useState([]);
  const [state, setState] = useState({
    loading: true,
    error: "",
    busyId: ""
  });

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(
        "/reservations/mine"
      );
      setReservations(data.reservations);
      setState((current) => ({
        ...current,
        loading: false,
        error: ""
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel(id) {
    if (
      !window.confirm(
        "Cancel this reservation?"
      )
    ) {
      return;
    }

    setState((current) => ({
      ...current,
      busyId: id,
      error: ""
    }));

    try {
      await apiFetch(
        `/reservations/${id}/cancel`,
        {
          method: "PATCH",
          retryGet: false
        }
      );
      await load();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message
      }));
    } finally {
      setState((current) => ({
        ...current,
        busyId: ""
      }));
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">
        Customer dashboard
      </p>
      <h1 className="mt-5 font-display text-5xl md:text-7xl">
        My Reservations
      </h1>

      <CustomerDashboardNav />

      {state.error && (
        <div className="mt-8 rounded-2xl bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <div className="mt-12 space-y-4">
        {state.loading && (
          <p className="text-white/45">
            Loading reservations...
          </p>
        )}

        {!state.loading &&
          reservations.length === 0 && (
            <PageMessage
              title="No reservations yet"
              message="Browse restaurants and make your first table reservation."
              action={
                <Link
                  to="/restaurants"
                  className="btn-primary"
                >
                  Explore restaurants
                </Link>
              }
            />
          )}

        {reservations.map((reservation) => (
          <article
            key={reservation._id}
            className="surface grid gap-6 rounded-3xl p-6 md:grid-cols-[1.2fr_.8fr_auto] md:items-center"
          >
            <div>
              <p className="font-display text-2xl">
                {reservation.restaurantId?.name}
              </p>
              <p className="mt-2 text-sm text-white/45">
                {reservation.restaurantId?.location}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[.18em] text-white/35">
                {reservation.bookingReference}
              </p>
            </div>

            <div className="text-sm leading-7 text-white/60">
              <p>
                {reservation.reservationDate} ·{" "}
                {reservation.timeSlot}
              </p>
              <p>
                {reservation.guestCount} guest(s) ·
                Table{" "}
                {reservation.tableId?.tableNumber}
              </p>
              <p className="capitalize">
                Status: {reservation.status}
              </p>
            </div>

            <div>
              {["pending", "confirmed"].includes(
                reservation.status
              ) && (
                <button
                  onClick={() =>
                    cancel(reservation._id)
                  }
                  disabled={
                    state.busyId === reservation._id
                  }
                  className="btn-secondary text-sm"
                >
                  {state.busyId === reservation._id
                    ? "Cancelling..."
                    : "Cancel"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
