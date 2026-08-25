import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Link,
  useParams
} from "react-router-dom";
import { apiFetch } from "../lib/api";
import PageMessage from "../components/PageMessage";
import LottieFlowIcon from "../components/LottieFlowIcon";
import { useAuth } from "../context/AuthContext";

const TIME_SLOTS = [
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30"
];

function earliestReservationDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function ReservePage() {
  const { user } = useAuth();
  const { restaurantId } = useParams();
  const draftKey = useMemo(
    () => `reservation-draft:${restaurantId}`,
    [restaurantId]
  );

  const [restaurant, setRestaurant] = useState(null);
  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      reservationDate: "",
      timeSlot: "19:00",
      guestCount: 2,
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "Dhaka",
      postcode: ""
    };
  });

  const [availability, setAvailability] =
    useState(null);
  const [result, setResult] = useState(null);
  const [state, setState] = useState({
    loadingRestaurant: true,
    checking: false,
    submitting: false,
    error: ""
  });

  useEffect(() => {
    const controller = new AbortController();

    apiFetch(`/restaurants/id/${restaurantId}`, {
      signal: controller.signal
    })
      .then((data) => {
        setRestaurant(data.restaurant);
        setState((current) => ({
          ...current,
          loadingRestaurant: false
        }));
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState((current) => ({
            ...current,
            loadingRestaurant: false,
            error: error.message
          }));
        }
      });

    return () => controller.abort();
  }, [restaurantId]);

  useEffect(() => {
    sessionStorage.setItem(
      draftKey,
      JSON.stringify(form)
    );
  }, [draftKey, form]);

  function update(event) {
    const value =
      event.target.name === "guestCount"
        ? Number(event.target.value)
        : event.target.value;

    setForm((current) => ({
      ...current,
      [event.target.name]: value
    }));

    setAvailability(null);
    setResult(null);
  }

  async function checkAvailability() {
    setState((current) => ({
      ...current,
      checking: true,
      error: ""
    }));

    try {
      const params = new URLSearchParams({
        date: form.reservationDate,
        timeSlot: form.timeSlot,
        guestCount: String(form.guestCount)
      });

      const data = await apiFetch(
        `/restaurants/${restaurantId}/availability?${params}`
      );

      setAvailability(data);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message
      }));
    } finally {
      setState((current) => ({
        ...current,
        checking: false
      }));
    }
  }

  async function submit(event) {
    event.preventDefault();

    if (state.submitting) {
      return;
    }

    setState((current) => ({
      ...current,
      submitting: true,
      error: ""
    }));

    try {
      // Critical POST has no automatic retry.
      const paymentKeyStorage = `reservation-payment-key:${restaurantId}:${form.reservationDate}:${form.timeSlot}:${user?.id || form.email.toLowerCase()}`;
      let paymentKey = sessionStorage.getItem(paymentKeyStorage);
      if (!paymentKey) {
        paymentKey = globalThis.crypto?.randomUUID
          ? `reservation:${globalThis.crypto.randomUUID()}`
          : `reservation:${Date.now()}:${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem(paymentKeyStorage, paymentKey);
      }
      const data = await apiFetch("/reservations/checkout", {
        method: "POST",
        body: {
          restaurantId,
          ...form,
          paymentKey
        },
        retryGet: false,
        timeoutMs: 40_000
      });

      if (!data.gatewayUrl) throw new Error("SSLCOMMERZ did not provide a payment page.");
      window.location.assign(data.gatewayUrl);
    } catch (error) {
      if (error.status === 409 && /hold has expired|already complete/i.test(error.message)) {
        for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
          const key = sessionStorage.key(index);
          if (key?.startsWith(`reservation-payment-key:${restaurantId}:`)) sessionStorage.removeItem(key);
        }
      }
      setState((current) => ({
        ...current,
        error: error.message
      }));
    } finally {
      setState((current) => ({
        ...current,
        submitting: false
      }));
    }
  }

  if (state.loadingRestaurant) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-24 text-white/50 md:px-8">
        Loading booking page...
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-24 md:px-8">
        <PageMessage
          title="Booking unavailable"
          message={state.error || "Restaurant not found."}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
      <div className="grid gap-12 md:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="text-xs uppercase tracking-[.28em] text-white/35">
            Table reservation
          </p>
          <h1 className="mt-5 font-display text-5xl md:text-7xl">
            {restaurant.name}
          </h1>
          <p className="mt-6 leading-7 text-white/55">
            {restaurant.location}
          </p>
          <p className="mt-2 leading-7 text-white/40">
            {restaurant.openingHours}
          </p>

          <Link
            to={`/restaurant/${restaurant.slug}`}
            className="mt-8 inline-flex text-sm text-white/55 hover:text-white"
          >
            <LottieFlowIcon name="arrow" className="rotate-180" /> Back to restaurant
          </Link>
        </div>

        <form
          onSubmit={submit}
          className="surface rounded-[2rem] p-6 md:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {!user && (
              <>
                <label className="block"><span className="mb-2 block text-sm text-white/60">Name</span><input className="input-field" name="name" value={form.name} onChange={update} maxLength="80" required /></label>
                <label className="block"><span className="mb-2 block text-sm text-white/60">Email</span><input className="input-field" type="email" name="email" value={form.email} onChange={update} maxLength="180" required /></label>
                <label className="block"><span className="mb-2 block text-sm text-white/60">Phone</span><input className="input-field" type="tel" name="phone" value={form.phone} onChange={update} maxLength="30" required /></label>
                <label className="block"><span className="mb-2 block text-sm text-white/60">Address</span><input className="input-field" name="address" value={form.address} onChange={update} maxLength="180" required /></label>
                <label className="block"><span className="mb-2 block text-sm text-white/60">City</span><input className="input-field" name="city" value={form.city} onChange={update} maxLength="80" required /></label>
                <label className="block"><span className="mb-2 block text-sm text-white/60">Postcode</span><input className="input-field" name="postcode" value={form.postcode} onChange={update} maxLength="20" required /></label>
              </>
            )}
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm text-white/60">
                Date
              </span>
              <input
                className="input-field"
                type="date"
                name="reservationDate"
                min={earliestReservationDate()}
                value={form.reservationDate}
                onChange={update}
                required
              />
              <span className="mt-2 block text-xs text-white/35">Reservations must be made at least one day in advance.</span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-white/60">
                Time
              </span>
              <select
                className="input-field"
                name="timeSlot"
                value={form.timeSlot}
                onChange={update}
              >
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-white/60">
                Guests
              </span>
              <input
                className="input-field"
                type="number"
                name="guestCount"
                min="1"
                max="12"
                value={form.guestCount}
                onChange={update}
                required
              />
            </label>
          </div>

          <button
            type="button"
            className="btn-secondary mt-6 w-full"
            onClick={checkAvailability}
            disabled={
              state.checking || !form.reservationDate
            }
          >
            {state.checking
              ? "Checking..."
              : "Check availability"}
          </button>

          {availability && (
            <div
              className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
                availability.available
                  ? "bg-emerald-400/10 text-emerald-200"
                  : "bg-amber-300/10 text-amber-100"
              }`}
            >
              {availability.available
                ? `${availability.availableTableCount} suitable table(s) currently available.`
                : "No suitable table is currently available for this time."}
            </div>
          )}

          {state.error && (
            <div className="mt-5 rounded-2xl bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {state.error}
            </div>
          )}

          <button
            className="btn-primary mt-7 w-full"
            disabled={
              state.submitting ||
              !form.reservationDate ||
              availability?.available === false
            }
          >
            {state.submitting
              ? "Opening secure payment..."
              : "Pay BDT 100 & reserve"}
          </button>

          <p className="mt-4 text-xs leading-5 text-white/32">
            Your table is held for 3 hours while payment is pending. If an SSLCommerz card or bKash payment fails, you can try again before the hold expires. The reservation is cancelled and the table is released after 3 hours if payment is not completed.
          </p>

          {result && (
            <div className="mt-7 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
              <p className="text-sm text-emerald-100">
                Reservation confirmed.
              </p>
              <p className="mt-2 font-display text-2xl">
                {result.bookingReference}
              </p>
              <Link
                to="/dashboard/reservations"
                className="mt-4 inline-flex text-sm underline underline-offset-4"
              >
                View My Reservations
              </Link>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
