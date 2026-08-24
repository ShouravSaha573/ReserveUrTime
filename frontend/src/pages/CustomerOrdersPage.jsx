import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CustomerDashboardNav from "../components/CustomerDashboardNav";
import PageMessage from "../components/PageMessage";
import { apiFetch } from "../lib/api";
import ReservationConversation from "../components/ReservationConversation";

const ACTIVE = new Set(["placed", "confirmed", "preparing", "ready"]);

function createPaymentKey() {
  if (globalThis.crypto?.randomUUID) return `sslcommerz:${globalThis.crypto.randomUUID()}`;
  return `sslcommerz:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function paymentBanner(payment, order) {
  if (!payment && !order) return null;
  const details = {
    success: ["Payment verified", `SSLCOMMERZ verified payment${order ? ` for ${order}` : ""}. The Restaurant can now process the Order.`, "emerald"],
    failed: ["Payment failed", `The gateway did not verify payment${order ? ` for ${order}` : ""}. You can safely retry from the Order card.`, "red"],
    init_failed: ["Order saved, payment not started", `The Order${order ? ` ${order}` : ""} was created, but a gateway session could not be opened. Complete your profile if needed, then use Pay with SSLCOMMERZ below.`, "amber"],
    review: ["Payment under review", "SSLCOMMERZ marked this transaction as risky. The Order remains on payment hold and must not be fulfilled yet.", "amber"],
    duplicate: ["Duplicate payment detected", "The Order was already paid by another transaction. This second verified payment requires support/refund review.", "red"],
    pending: ["Payment reconciliation pending", "ReserveUrTime has not yet received a verified gateway result. Use Check payment status below; IPN may also update it automatically.", "amber"]
  };
  const [title, message, tone] = details[payment] || ["Order updated", order ? `Order ${order} was created.` : "Your Order list was updated.", "emerald"];
  return { title, message, tone };
}

export default function CustomerOrdersPage() {
  const [searchParams] = useSearchParams();
  const placed = searchParams.get("placed") || "";
  const payment = searchParams.get("payment") || "";
  const paymentOrder = searchParams.get("order") || placed;
  const banner = paymentBanner(payment, paymentOrder);

  const [orders, setOrders] = useState([]);
  const [messageUnread, setMessageUnread] = useState({});
  const [state, setState] = useState({ loading: true, error: "", busyId: "" });

  async function load() {
    try {
      const [payload, unreadData] = await Promise.all([
        apiFetch("/customer/orders", { retryGet: false }),
        apiFetch("/customer/orders/message-unread-counts", { retryGet: false })
      ]);
      setOrders(payload.orders || []);
      setMessageUnread(unreadData.unreadByOrder || {});
      setState({ loading: false, error: "", busyId: "" });
    } catch (error) {
      setState({ loading: false, error: error.message, busyId: "" });
    }
  }

  useEffect(() => {
    load();
    const refreshUnread = async () => {
      if (document.visibilityState !== "visible") return;
      try { const data = await apiFetch("/customer/orders/message-unread-counts", { retryGet: false }); setMessageUnread(data.unreadByOrder || {}); } catch { /* Preserve the loaded orders while offline. */ }
    };
    const timer = window.setInterval(refreshUnread, 10000);
    document.addEventListener("visibilitychange", refreshUnread);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refreshUnread); };
  }, []);

  function markConversationRead(orderId) {
    setMessageUnread((current) => ({ ...current, [orderId]: 0 }));
  }

  const activeCount = useMemo(
    () => orders.filter((order) => ACTIVE.has(order.status)).length,
    [orders]
  );

  async function cancel(orderId) {
    if (!window.confirm("Cancel this unpaid Order before the Restaurant confirms it?")) return;
    setState((current) => ({ ...current, busyId: orderId }));
    try {
      const payload = await apiFetch(`/customer/orders/${orderId}/cancel`, {
        method: "PATCH",
        retryGet: false
      });
      setOrders((current) => current.map((order) => order._id === orderId ? payload.order : order));
      setState((current) => ({ ...current, busyId: "", error: "" }));
    } catch (error) {
      setState((current) => ({ ...current, busyId: "", error: error.message }));
    }
  }

  async function pay(order) {
    setState((current) => ({ ...current, busyId: order._id, error: "" }));
    try {
      const orderReference = encodeURIComponent(order.orderNumber);
      const payload = await apiFetch(`/customer/orders/${orderReference}/payments/sslcommerz`, {
        method: "POST",
        retryGet: false,
        body: { paymentKey: createPaymentKey() },
        timeoutMs: 40_000
      });
      if (payload.alreadyPaid) {
        await load();
        return;
      }
      if (!payload.gatewayUrl) throw new Error("SSLCOMMERZ payment page was not returned.");
      // Browser redirects alone never mark an Order paid; only the validated server callback does.
      window.location.assign(payload.gatewayUrl);
    } catch (error) {
      setState((current) => ({ ...current, busyId: "", error: error.message }));
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-14 md:px-8 md:py-20">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Customer dashboard</p>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-5xl md:text-7xl">Orders</h1>
          <p className="mt-4 text-white/48">{activeCount} active order(s).</p>
        </div>
        <Link to="/dashboard/cart" className="btn-secondary">Open cart</Link>
      </div>

      <CustomerDashboardNav />

      {banner && (
        <div className={`mt-8 rounded-2xl border p-4 text-sm ${banner.tone === "red" ? "border-red-200/15 bg-red-100/[.04] text-red-100" : banner.tone === "amber" ? "border-amber-200/15 bg-amber-100/[.04] text-amber-50" : "border-emerald-200/15 bg-emerald-100/[.04] text-emerald-100"}`}>
          <strong className="block">{banner.title}</strong>
          <span className="mt-1 block opacity-80">{banner.message}</span>
        </div>
      )}

      {!banner && placed && (
        <div className="mt-8 rounded-2xl border border-emerald-200/15 bg-emerald-100/[.04] p-4 text-sm text-emerald-100">
          Order {placed} was created successfully.
        </div>
      )}

      {state.error && <PageMessage title="Order/payment action unavailable" message={state.error} />}
      {state.loading && <p className="mt-10 text-white/45">Loading orders…</p>}

      {!state.loading && orders.length === 0 && (
        <div className="surface mt-10 rounded-[2rem] p-8">
          <h2 className="font-display text-4xl">No orders yet</h2>
          <p className="mt-3 text-white/45">Add dishes to your cart to create your first Restaurant order.</p>
        </div>
      )}

      <section className="mt-10 space-y-4">
        {orders.map((order) => {
          const canPay = ["unpaid", "failed"].includes(order.paymentStatus) && ACTIVE.has(order.status);
          const canCancel = order.status === "placed" && ["unpaid", "failed"].includes(order.paymentStatus);
          const isBusy = state.busyId === order._id;

          return (
            <article key={order._id} className="order-card">
              <div className="order-card-head">
                <div>
                  <p className="text-xs uppercase tracking-[.2em] text-white/30">{order.orderNumber}</p>
                  <h2 className="mt-2 font-display text-3xl">{order.restaurantSnapshot?.name || order.restaurantId?.name}</h2>
                  <p className="mt-2 text-sm text-white/40">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className={`order-status is-${order.status}`}>{order.status}</span>
                  <p className="mt-3 font-display text-3xl">৳{Number(order.total).toLocaleString("en-BD")}</p>
                  <p className="mt-1 text-xs uppercase tracking-[.15em] text-white/30">Payment: {order.paymentStatus}</p>
                  {order.paidAt && <p className="mt-1 text-xs text-emerald-100/55">Verified {new Date(order.paidAt).toLocaleString()}</p>}
                </div>
              </div>

              {order.reservationSnapshot?.bookingReference ? (
                <div className="mt-5 grid gap-3 rounded-2xl border border-emerald-200/10 bg-emerald-100/[.035] p-4 text-sm sm:grid-cols-2">
                  <div><span className="block text-xs uppercase tracking-[.15em] text-white/30">Reservation</span><strong className="mt-1 block font-medium text-emerald-100">{order.reservationSnapshot.bookingReference}</strong></div>
                  <div><span className="block text-xs uppercase tracking-[.15em] text-white/30">Arrival</span><strong className="mt-1 block font-medium">{order.reservationSnapshot.reservationDate} · {order.reservationSnapshot.timeSlot}</strong></div>
                  <div><span className="block text-xs uppercase tracking-[.15em] text-white/30">Party</span><span className="mt-1 block text-white/65">{order.reservationSnapshot.guestCount} guest(s)</span></div>
                  <div><span className="block text-xs uppercase tracking-[.15em] text-white/30">Table</span><span className="mt-1 block text-white/65">{order.reservationSnapshot.tableNumber} · {order.reservationSnapshot.tableArea}</span></div>
                </div>
              ) : null}

              <div className="mt-6 divide-y divide-white/8 border-y border-white/8">
                {order.items.map((item) => (
                  <div key={`${order._id}:${item.menuItemId}`} className="flex items-center justify-between gap-5 py-3 text-sm">
                    <span className="text-white/65">{item.quantity} × {item.name}</span>
                    <span className="text-white/42">৳{Number(item.lineTotal).toLocaleString("en-BD")}</span>
                  </div>
                ))}
              </div>

              {order.notes && <p className="mt-5 text-sm leading-6 text-white/45">Note: {order.notes}</p>}

              {order.reservationSnapshot?.bookingReference ? <ReservationConversation order={order} unreadCount={messageUnread[order._id] || 0} onRead={markConversationRead} /> : null}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                {order.paymentStatus !== "pending" && (
                  <p className="max-w-xl text-xs leading-5 text-white/32">
                    {order.paymentStatus === "paid"
                      ? "Payment was verified server-to-server with SSLCOMMERZ. The Restaurant can now move this Order through fulfilment."
                      : "This Order is not paid yet. You can retry SSLCOMMERZ Hosted Checkout without changing the Order total."}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {canPay && (
                    <button type="button" onClick={() => pay(order)} disabled={isBusy} className="btn-primary">
                      {isBusy ? "Opening…" : "Pay with SSLCOMMERZ"}
                    </button>
                  )}
                  {canCancel && (
                    <button type="button" onClick={() => cancel(order._id)} disabled={isBusy} className="btn-secondary">
                      {isBusy ? "Updating…" : "Cancel order"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
