import { useCallback, useEffect, useState } from "react";
import RestaurantAdminSectionNav from "../components/RestaurantAdminSectionNav";
import PageMessage from "../components/PageMessage";
import { apiFetch } from "../lib/api";

const groups = [
  ["categories", "Menu categories", "category", (item) => item.name],
  ["items", "Dishes", "dish", (item) => item.name],
  ["tables", "Dining tables", "table", (item) => `${item.tableNumber} · ${item.area}`],
  ["gallery", "Gallery items", "gallery", (item) => item.title || "Untitled gallery item"]
];

export default function RestaurantAdminTrashPage() {
  const [removed, setRemoved] = useState({ categories: [], items: [], tables: [], gallery: [] });
  const [state, setState] = useState({ loading: true, busyId: "", error: "", success: "" });
  const load = useCallback(async () => {
    try { const data = await apiFetch("/restaurant-admin/trash", { retryGet: false }); setRemoved(data.removed || {}); setState((value) => ({ ...value, loading: false, error: "", busyId: "" })); }
    catch (error) { setState((value) => ({ ...value, loading: false, error: error.message, busyId: "" })); }
  }, []);
  useEffect(() => { load(); }, [load]);
  async function restore(type, item) {
    setState((value) => ({ ...value, busyId: item._id, error: "", success: "" }));
    try { const data = await apiFetch(`/restaurant-admin/trash/${type}/${item._id}/restore`, { method: "PATCH", retryGet: false }); setState((value) => ({ ...value, success: data.message, busyId: "" })); await load(); }
    catch (error) { setState((value) => ({ ...value, error: error.message, busyId: "" })); }
  }
  const total = Object.values(removed).reduce((sum, items) => sum + (items?.length || 0), 0);
  return <main className="admin-workspace py-12 md:py-16"><p className="text-xs uppercase tracking-[.3em] text-white/35">Restaurant Admin · Recovery</p><h1 className="mt-4 font-display text-5xl md:text-7xl">Trash</h1><p className="mt-5 max-w-3xl leading-7 text-white/50">Removed restaurant resources stay here until restored. Restore categories before restoring dishes that belonged to them.</p><RestaurantAdminSectionNav />{state.error ? <PageMessage title="Restore unavailable" message={state.error}/> : null}{state.success ? <p className="mt-6 text-emerald-100">{state.success}</p> : null}{state.loading ? <p className="mt-10 text-white/40">Loading Trash…</p> : null}<div className="admin-trash-layout">{groups.map(([key,title,type,label]) => <section key={key}><header><h2>{title}</h2><span>{removed[key]?.length || 0}</span></header>{removed[key]?.map((item) => <article key={item._id}><div><strong>{label(item)}</strong><small>Removed {new Date(item.updatedAt).toLocaleString()}</small>{type === "dish" && item.categoryId ? <small>Category: {item.categoryId.name}</small> : null}</div><button className="btn-secondary" disabled={state.busyId === item._id} onClick={() => restore(type,item)}>{state.busyId === item._id ? "Restoring…" : "Restore"}</button></article>)}{!removed[key]?.length ? <p>Nothing removed.</p> : null}</section>)}</div>{!state.loading && !total ? <PageMessage title="Trash is empty" message="Removed categories, dishes, tables and gallery items will appear here."/> : null}</main>;
}