import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import CustomerDashboardNav from "../components/CustomerDashboardNav";
import PageMessage from "../components/PageMessage";
import LottieFlowIcon from "../components/LottieFlowIcon";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../lib/api";

const TIME_SLOTS = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
const earliestReservationDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

function createCheckoutKey() {
  if (globalThis.crypto?.randomUUID) return `phase10-order:${globalThis.crypto.randomUUID()}`;
  return `phase10-order:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function createPaymentKey() {
  if (globalThis.crypto?.randomUUID) return `sslcommerz:${globalThis.crypto.randomUUID()}`;
  return `sslcommerz:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

export default function CustomerCartPage() {
  const {
    restaurant,
    items,
    itemCount,
    subtotal,
    loading,
    busy,
    clearingCart,
    isItemBusy,
    error,
    updateItem,
    removeItem,
    clearCart,
    refreshCart
  } = useCart();
  const [notes, setNotes] = useState("");
  const [reservation, setReservation] = useState({ reservationDate: "", timeSlot: "19:00", guestCount: 2, selectedTableIds: [] });
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const checkoutKeyRef = useRef(createCheckoutKey());
  const paymentKeyRef = useRef(createPaymentKey());
  const selectedCapacity = (availability?.tables || []).filter((table) => reservation.selectedTableIds.includes(table._id)).reduce((sum, table) => sum + Number(table.capacity || 0), 0);
  const tableSelectionReady = Boolean(availability?.available) && reservation.selectedTableIds.length === availability.requiredTableCount && selectedCapacity >= reservation.guestCount;

  function updateReservation(event) {
    const value = event.target.name === "guestCount" ? Number(event.target.value) : event.target.value;
    setReservation((current) => ({ ...current, [event.target.name]: value, selectedTableIds: [] }));
    setAvailability(null);
    setCheckoutError("");
  }

  async function checkTableAvailability() {
    setAvailabilityError("");
    if (!restaurant?._id) {
      setAvailabilityError("The cart restaurant is unavailable. Refresh the cart and try again.");
      return;
    }
    if (!reservation.reservationDate) {
      setAvailabilityError("Choose a reservation date first.");
      return;
    }
    if (!Number.isInteger(reservation.guestCount) || reservation.guestCount < 1 || reservation.guestCount > 12) {
      setAvailabilityError("Guest count must be between 1 and 12.");
      return;
    }
    setCheckingAvailability(true);
    setCheckoutError("");
    try {
      const query = new URLSearchParams({
        date: reservation.reservationDate,
        timeSlot: reservation.timeSlot,
        guestCount: String(reservation.guestCount)
      });
      const data = await apiFetch(`/restaurants/${restaurant._id}/availability?${query}`);
      setAvailability(data);
      setReservation((current) => ({ ...current, selectedTableIds: data.recommendedTableIds || [] }));
    } catch (error) {
      setAvailability(null);
      setAvailabilityError(error.message);
    } finally {
      setCheckingAvailability(false);
    }
  }
  function chooseTime(timeSlot) {
    const slot = availability?.slots?.find((entry) => entry.timeSlot === timeSlot);
    if (!slot?.available) return;
    setAvailability((current) => ({ ...current, ...slot }));
    setReservation((current) => ({ ...current, timeSlot, selectedTableIds: slot.recommendedTableIds || [] }));
  }

  function toggleTable(tableId) {
    const table = availability?.tables?.find((entry) => entry._id === tableId);
    if (!table?.available) return;
    setReservation((current) => {
      const selected = current.selectedTableIds || [];
      if (selected.includes(tableId)) return { ...current, selectedTableIds: selected.filter((id) => id !== tableId) };
      if (selected.length >= Number(availability?.requiredTableCount || 1)) return current;
      return { ...current, selectedTableIds: [...selected, tableId] };
    });
  }
  async function placeOrderAndPay() {
    if (!items.length || placing) return;
    if (!reservation.reservationDate) {
      setCheckoutError("Choose a reservation date before checkout.");
      return;
    }
    setPlacing(true);
    setCheckoutError("");

    let order = null;
    try {
      const payload = await apiFetch("/customer/orders", {
        method: "POST",
        retryGet: false,
        body: { notes, checkoutKey: checkoutKeyRef.current, reservation }
      });
      order = payload.order;
      await refreshCart();

      const payment = await apiFetch(`/customer/orders/${order._id}/payments/sslcommerz`, {
        method: "POST",
        retryGet: false,
        body: { paymentKey: paymentKeyRef.current },
        timeoutMs: 40_000
      });

      checkoutKeyRef.current = createCheckoutKey();
      paymentKeyRef.current = createPaymentKey();

      if (payment.alreadyPaid) {
        window.location.assign(`/dashboard/orders?payment=success&order=${encodeURIComponent(order.orderNumber)}`);
        return;
      }
      if (!payment.gatewayUrl) {
        throw new Error("SSLCOMMERZ did not provide a payment page.");
      }

      window.location.assign(payment.gatewayUrl);
    } catch (err) {
      if (order) {
        // The Order is safely persisted even if gateway session creation fails.
        // Keep the Customer on a recoverable page where payment can be retried.
        window.location.assign(
          `/dashboard/orders?placed=${encodeURIComponent(order.orderNumber)}&payment=init_failed`
        );
        return;
      }

      setCheckoutError(err.message);
      if (err.status === 409) refreshCart().catch(() => {});
      setPlacing(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-14 md:px-8 md:py-20">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Customer dashboard</p>
      <h1 className="mt-5 font-display text-5xl md:text-7xl">Reserve & dine</h1>
      <p className="mt-4 max-w-2xl leading-7 text-white/50">
        Reserve a table and pre-order food in one checkout. Availability and every food price are rechecked by the server before your booking and order are created together.
      </p>

      <CustomerDashboardNav />

      {loading && <p className="mt-10 text-white/45">Loading cart…</p>}
      {error && <PageMessage title="Cart unavailable" message={error} />}

      {!loading && !error && items.length === 0 && (
        <div className="surface mt-10 rounded-[2rem] p-8 md:p-10">
          <h2 className="font-display text-4xl">Your cart is empty</h2>
          <p className="mt-3 text-white/45">Choose an available dish from a Restaurant menu.</p>
          <Link to="/restaurants" className="btn-primary mt-7">Explore Restaurants</Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-start">
          <section className="space-y-3">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[.22em] text-white/35">Restaurant</p>
                <h2 className="mt-2 font-display text-3xl">{restaurant?.name}</h2>
              </div>
              <button type="button" onClick={() => clearCart()} disabled={clearingCart} className="text-sm text-white/45 hover:text-white disabled:opacity-40">
                {clearingCart ? "Clearing…" : "Clear cart"}
              </button>
            </div>

            {items.map((item) => {
              const itemBusy = isItemBusy(item.menuItemId);
              return (
              <article key={item.menuItemId} className={`cart-line-item ${itemBusy ? "is-updating" : ""}`} aria-busy={itemBusy}>
                <div className="cart-line-media">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <div className="cart-line-placeholder" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[.18em] text-white/30">{item.category?.name || "Menu"}</p>
                  <h3 className="mt-2 font-display text-2xl">{item.name}</h3>
                  <p className="mt-2 text-sm text-white/45">৳{Number(item.unitPrice).toLocaleString("en-BD")} each</p>
                  <button type="button" onClick={() => removeItem(item.menuItemId)} disabled={itemBusy} className="mt-4 text-xs uppercase tracking-[.16em] text-white/35 hover:text-white disabled:opacity-40">
                    {itemBusy ? "Updating…" : "Remove"}
                  </button>
                </div>
                <div className="cart-quantity-control" aria-label={`Quantity for ${item.name}`}>
                  <button type="button" aria-label={`Decrease ${item.name} quantity`} disabled={itemBusy || item.quantity <= 1} onClick={() => updateItem(item.menuItemId, item.quantity - 1)}><LottieFlowIcon name="minus" /></button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label={`Increase ${item.name} quantity`} disabled={itemBusy || item.quantity >= 20} onClick={() => updateItem(item.menuItemId, item.quantity + 1)}><LottieFlowIcon name="plus" /></button>
                </div>
                <p className="cart-line-total">৳{Number(item.lineTotal).toLocaleString("en-BD")}</p>
              </article>
              );
            })}
          </section>

          <aside className="surface sticky top-24 rounded-[2rem] p-6 md:p-7">
            <p className="text-xs uppercase tracking-[.24em] text-white/32">Table reservation</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <label className="block text-sm text-white/55 sm:col-span-2 lg:col-span-1">
                Date
                <input className="input-field mt-2" type="date" name="reservationDate" min={earliestReservationDate()} value={reservation.reservationDate} onChange={updateReservation} required />
                <span className="mt-2 block text-xs text-white/35">Book at least one day before your visit.</span>
              </label>
              <label className="block text-sm text-white/55">
                Time
                <select className="input-field mt-2" name="timeSlot" value={reservation.timeSlot} onChange={updateReservation}>
                  {TIME_SLOTS.map((time) => <option key={time} value={time}>{time}</option>)}
                </select>
              </label>
              <label className="block text-sm text-white/55">
                Guests
                <input className="input-field mt-2" type="number" name="guestCount" min="1" max="12" value={reservation.guestCount} onChange={updateReservation} />
              </label>
            </div>
            <button type="button" className="btn-secondary mt-4 w-full justify-center" onClick={checkTableAvailability} disabled={checkingAvailability}>
              {checkingAvailability ? "Checking table…" : "Check table availability"}
            </button>
            {availabilityError && <p role="alert" className="mt-3 rounded-xl border border-red-200/15 bg-red-200/[.05] px-3 py-2 text-sm text-red-100">{availabilityError}</p>}
            {availability ? (
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[.2em] text-white/35">Available hours</p>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {availability.slots.map((slot) => (
                      <button key={slot.timeSlot} type="button" disabled={!slot.available} onClick={() => chooseTime(slot.timeSlot)} className={`rounded-xl border px-2 py-3 text-xs transition ${reservation.timeSlot === slot.timeSlot ? "border-white bg-white text-black" : slot.available ? "border-emerald-200/20 bg-emerald-200/[.05] text-emerald-100 hover:border-emerald-100/45" : "cursor-not-allowed border-red-200/10 bg-red-200/[.035] text-red-200/35 line-through"}`}>{slot.timeSlot}</button>
                    ))}
                  </div>
                </div>
                <div className={`rounded-2xl border p-4 ${availability.available ? "border-emerald-200/15 bg-emerald-200/[.04]" : "border-amber-200/15 bg-amber-200/[.04]"}`}>
                  <strong className="text-sm font-medium">{availability.requiredTableCount} table{availability.requiredTableCount === 1 ? "" : "s"} required</strong>
                  <p className="mt-1 text-xs leading-5 text-white/45">{reservation.guestCount} guests ÷ 4 seats = {availability.requiredTableCount} table{availability.requiredTableCount === 1 ? "" : "s"}. Choose the table number{availability.requiredTableCount === 1 ? "" : "s"} below.</p>
                  <p className="mt-2 text-xs text-white/65">Selected seating: {selectedCapacity} of {reservation.guestCount} required.</p>
                </div>
                {[...new Set((availability.tables || []).map((table) => table.area))].map((area) => (
                  <section key={area}>
                    <p className="text-xs uppercase tracking-[.2em] text-white/35">{area}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {(availability.tables || []).filter((table) => table.area === area).map((table) => {
                        const selected = reservation.selectedTableIds.includes(table._id);
                        return (
                          <button key={table._id} type="button" disabled={!table.available} onClick={() => toggleTable(table._id)} className={`relative min-h-28 rounded-2xl border p-3 transition ${selected ? "border-white bg-white text-black shadow-[0_0_28px_rgba(255,255,255,.18)]" : table.available ? "border-white/12 bg-white/[.035] text-white hover:border-white/35" : "cursor-not-allowed border-red-200/10 bg-red-200/[.025] text-white/25"}`}>
                            <span className="absolute left-1/2 top-2 h-2 w-7 -translate-x-1/2 rounded-full border border-current opacity-50" />
                            <span className="absolute bottom-2 left-1/2 h-2 w-7 -translate-x-1/2 rounded-full border border-current opacity-50" />
                            <span className="absolute left-2 top-1/2 h-7 w-2 -translate-y-1/2 rounded-full border border-current opacity-50" />
                            <span className="absolute right-2 top-1/2 h-7 w-2 -translate-y-1/2 rounded-full border border-current opacity-50" />
                            <span className="mx-auto flex h-16 w-20 flex-col items-center justify-center rounded-xl border border-current/30"><strong className="font-display text-2xl">{table.tableNumber}</strong><small className="text-[.62rem] uppercase tracking-wider opacity-60">{table.capacity} seats</small></span>
                            <span className="mt-1 block text-[.62rem] uppercase tracking-wider opacity-55">{table.available ? selected ? "Selected" : "Available" : "Unavailable"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : null}

            <p className="mt-8 text-xs uppercase tracking-[.24em] text-white/32">Combined summary</p>
            <div className="mt-6 flex items-center justify-between border-b border-white/10 pb-5 text-sm text-white/55">
              <span>{itemCount} item(s)</span>
              <span>BDT</span>
            </div>
            <div className="mt-5 space-y-3 border-b border-white/10 pb-5 text-sm text-white/50">
              <div className="flex justify-between"><span>Food subtotal</span><span>৳{Number(subtotal).toLocaleString("en-BD")}</span></div>
              <div className="flex justify-between"><span>Table reservation</span><span>Included</span></div>
              <div className="flex justify-between"><span>Service charge</span><span>৳0</span></div>
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <span className="text-white/50">Grand total</span>
              <strong className="font-display text-4xl font-normal">৳{Number(subtotal).toLocaleString("en-BD")}</strong>
            </div>

            <label className="mt-7 block text-sm text-white/55">
              Order note (optional)
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={500}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-white outline-none focus:border-white/25"
                placeholder="Preparation request shared with the Restaurant..."
              />
              <span className="mt-2 block text-xs leading-5 text-white/35">
                Shared with the Restaurant. Do not include passwords, card details, government IDs, or unrelated sensitive information.
              </span>
            </label>

            {checkoutError && <p className="mt-4 text-sm text-red-200">{checkoutError}</p>}

            <button type="button" onClick={placeOrderAndPay} disabled={placing || busy || !reservation.reservationDate || !tableSelectionReady} className="btn-primary mt-6 w-full justify-center">
              {placing ? "Opening secure payment..." : "Pay with SSLCOMMERZ & Reserve Table"}
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
