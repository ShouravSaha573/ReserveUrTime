import { useEffect, useMemo, useState } from "react";
import RestaurantAdminSectionNav from "../components/RestaurantAdminSectionNav";
import PageMessage from "../components/PageMessage";
import { apiFetch } from "../lib/api";

const filters = ["", "placed", "confirmed", "preparing", "ready", "completed", "cancelled"];

function actionsFor(order) {
  if (order.status === "placed") {
    if (order.paymentStatus === "paid") return [["Confirm paid order", "confirmed"]];
    if (["unpaid", "failed"].includes(order.paymentStatus)) return [["Cancel unpaid order", "cancelled"]];
    return [];
  }
  if (order.paymentStatus !== "paid") return [];
  if (order.status === "confirmed") return [["Start preparing", "preparing"]];
  if (order.status === "preparing") return [["Mark ready", "ready"]];
  if (order.status === "ready") return [["Complete", "completed"]];
  return [];
}

export default function RestaurantAdminOrdersPage() {
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState([]);
  const [state, setState] = useState({ loading: true, error: "", busyId: "" });

  async function load(nextStatus = status) {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const suffix = nextStatus ? `?status=${encodeURIComponent(nextStatus)}` : "";
      const payload = await apiFetch(`/restaurant-admin/orders${suffix}`, { retryGet: false });
      setOrders(payload.orders || []);
      setState({ loading: false, error: "", busyId: "" });
    } catch (error) {
      setState({ loading: false, error: error.message, busyId: "" });
    }
  }

  useEffect(() => {
    load(status);
  }, [status]);

  const paidRevenuePreview = useMemo(
    () => orders.filter((order) => order.paymentStatus === "paid" && order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total || 0), 0),
    [orders]
  );

  async function updateStatus(order, nextStatus) {
    if (nextStatus === "cancelled" && !window.confirm(`Cancel ${order.orderNumber}?`)) return;
    setState((current) => ({ ...current, busyId: order._id, error: "" }));
    try {
      await apiFetch(`/restaurant-admin/orders/${order._id}/status`, {
        method: "PATCH",
        retryGet: false,
        body: { status: nextStatus }
      });
      await load(status);
    } catch (error) {
      setState((current) => ({ ...current, busyId: "", error: error.message }));
    }
  }

  return (
    <main className="admin-workspace mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Restaurant Admin · Scoped management</p>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-5xl md:text-7xl">Orders</h1>
          <p className="mt-4 max-w-2xl leading-7 text-white/50">
            Only Orders belonging to your assigned Restaurant are available here. Payment status is gateway-controlled and read-only: Restaurant fulfilment can advance only after SSLCOMMERZ verification marks the Order paid.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[.18em] text-white/30">Visible verified-paid value</p>
          <p className="mt-2 font-display text-4xl">৳{paidRevenuePreview.toLocaleString("en-BD")}</p>
        </div>
      </div>

      <RestaurantAdminSectionNav />

      <div className="mt-8 flex flex-wrap gap-2">
        {filters.map((value) => (
          <button
            key={value || "all"}
            type="button"
            onClick={() => setStatus(value)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[.14em] transition ${status === value ? "border-white bg-white text-black" : "border-white/10 text-white/45 hover:border-white/25 hover:text-white"}`}
          >
            {value || "All"}
          </button>
        ))}
      </div>

      {state.error && <PageMessage title="Orders unavailable" message={state.error} />}
      {state.loading && <p className="mt-10 text-white/45">Loading Restaurant orders…</p>}

      {!state.loading && orders.length === 0 && (
        <div className="surface mt-10 rounded-[2rem] p-8">
          <h2 className="font-display text-4xl">No matching orders</h2>
          <p className="mt-3 text-white/45">Try another status filter.</p>
        </div>
      )}

      <section className="mt-10 space-y-4">
        {orders.map((order) => {
          const actions = actionsFor(order);
          return (
            <article key={order._id} className="order-card restaurant-order-card">
              <div className="order-card-head">
                <div>
                  <p className="text-xs uppercase tracking-[.2em] text-white/30">{order.orderNumber}</p>
                  <h2 className="mt-2 font-display text-3xl">{order.customerSnapshot?.name || "Customer"}</h2>
                  {order.customerSnapshot?.phone && <p className="mt-2 text-sm text-white/40">{order.customerSnapshot.phone}</p>}
                </div>
                <div className="text-right">
                  <span className={`order-status is-${order.status}`}>{order.status}</span>
                  <p className="mt-3 font-display text-3xl">৳{Number(order.total).toLocaleString("en-BD")}</p>
                  <p className={`mt-1 text-xs uppercase tracking-[.15em] ${order.paymentStatus === "paid" ? "text-emerald-100/65" : "text-white/30"}`}>Payment: {order.paymentStatus}</p>
                  {order.paidAt && <p className="mt-1 text-xs text-emerald-100/45">Verified {new Date(order.paidAt).toLocaleString()}</p>}
                </div>
              </div>

              <div className="mt-6 divide-y divide-white/8 border-y border-white/8">
                {order.items.map((item) => (
                  <div key={`${order._id}:${item.menuItemId}`} className="flex items-center justify-between gap-5 py-3 text-sm">
                    <span className="text-white/65">{item.quantity} × {item.name}</span>
                    <span className="text-white/42">৳{Number(item.lineTotal).toLocaleString("en-BD")}</span>
                  </div>
                ))}
              </div>

              {order.notes && <p className="mt-5 rounded-xl bg-white/[.035] p-4 text-sm leading-6 text-white/50">Customer note: {order.notes}</p>}

              {order.paymentStatus === "pending" && (
                <p className="mt-5 rounded-xl border border-amber-200/10 bg-amber-100/[.035] p-4 text-xs leading-5 text-amber-50/70">
                  Payment is still awaiting gateway verification. Do not prepare or cancel this Order while a payment may still complete.
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-white/30">Created {new Date(order.createdAt).toLocaleString()}</p>
                <div className="flex flex-wrap gap-2">
                  {actions.map(([label, nextStatus]) => (
                    <button
                      key={nextStatus}
                      type="button"
                      onClick={() => updateStatus(order, nextStatus)}
                      disabled={state.busyId === order._id}
                      className={nextStatus === "cancelled" ? "btn-secondary" : "btn-primary"}
                    >
                      {state.busyId === order._id ? "Updating…" : label}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
