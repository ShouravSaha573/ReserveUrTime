import { useCallback, useEffect, useState } from "react";
import RestaurantAdminSectionNav from "../components/RestaurantAdminSectionNav";
import { apiFetch } from "../lib/api";

const blankTable = {
  tableNumber: "",
  capacity: 2,
  area: "Main Dining",
  status: "available",
  isActive: true
};

export default function RestaurantAdminTablesPage() {
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState(blankTable);
  const [editingId, setEditingId] = useState("");
  const [state, setState] = useState({ loading: true, saving: false, error: "", success: "" });

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/restaurant-admin/tables");
      setTables(data.tables || []);
      setState((current) => ({ ...current, loading: false, error: "" }));
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function reset() {
    setEditingId("");
    setForm(blankTable);
  }

  async function submit(event) {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: "", success: "" }));
    try {
      const data = await apiFetch(
        editingId ? `/restaurant-admin/tables/${editingId}` : "/restaurant-admin/tables",
        {
          method: editingId ? "PATCH" : "POST",
          body: form,
          retryGet: false
        }
      );
      reset();
      setState((current) => ({ ...current, saving: false, success: data.message }));
      await load();
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.message }));
    }
  }

  async function remove(table) {
    if (!window.confirm(`Remove table ${table.tableNumber} from active service?`)) return;
    try {
      const data = await apiFetch(`/restaurant-admin/tables/${table._id}`, { method: "DELETE", retryGet: false });
      setState((current) => ({ ...current, success: data.message, error: "" }));
      await load();
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, success: "" }));
    }
  }

  async function restore(table) {
    try {
      const data = await apiFetch(`/restaurant-admin/tables/${table._id}`, {
        method: "PATCH",
        body: { isActive: true, status: "available" },
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
      <h1 className="mt-4 font-display text-5xl md:text-7xl">Dining tables</h1>
      <p className="mt-5 max-w-3xl leading-7 text-white/55">
        Manage table number, capacity, dining area and service status. Tables with upcoming active reservations cannot be disabled or removed until those reservations are resolved.
      </p>
      <RestaurantAdminSectionNav />

      {state.error && <p className="mt-6 rounded-xl bg-red-400/10 p-4 text-sm text-red-200">{state.error}</p>}
      {state.success && <p className="mt-6 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-100">{state.success}</p>}

      <section className="mt-10 grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
        <form onSubmit={submit} className="surface h-fit rounded-3xl p-6 md:p-8">
          <p className="text-xs uppercase tracking-[.22em] text-white/35">{editingId ? "Edit table" : "Add table"}</p>
          <div className="mt-5 space-y-4">
            <label className="block"><span className="mb-2 block text-sm text-white/60">Table number</span><input className="input-field" name="tableNumber" value={form.tableNumber} onChange={update} placeholder="T10" required /></label>
            <label className="block"><span className="mb-2 block text-sm text-white/60">Capacity</span><input className="input-field" type="number" min="1" max="20" name="capacity" value={form.capacity} onChange={update} required /></label>
            <label className="block"><span className="mb-2 block text-sm text-white/60">Area</span><input className="input-field" name="area" value={form.area} onChange={update} /></label>
            <label className="block"><span className="mb-2 block text-sm text-white/60">Status</span><select className="input-field" name="status" value={form.status} onChange={update}><option value="available">Available</option><option value="maintenance">Maintenance</option></select></label>
            <label className="flex items-center gap-3 text-sm text-white/60"><input type="checkbox" name="isActive" checked={form.isActive} onChange={update} /> Active</label>
          </div>
          <div className="mt-6 flex gap-3"><button className="btn-primary" disabled={state.saving}>{state.saving ? "Saving…" : editingId ? "Save table" : "Add table"}</button>{editingId && <button type="button" className="btn-secondary" onClick={reset}>Cancel</button>}</div>
        </form>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {state.loading && <p className="text-white/40">Loading tables…</p>}
          {tables.map((table) => (
            <article key={table._id} className={`surface rounded-3xl p-6 ${table.isActive ? "" : "opacity-55"}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[.2em] text-white/35">{table.area}</p><h2 className="mt-2 font-display text-4xl">{table.tableNumber}</h2></div><span className={`rounded-full px-3 py-1 text-xs ${table.status === "available" && table.isActive ? "bg-emerald-400/10 text-emerald-100" : "bg-amber-300/10 text-amber-100"}`}>{table.isActive ? table.status : "removed"}</span></div>
              <p className="mt-5 text-sm text-white/55">Capacity: <span className="text-white/85">{table.capacity} guests</span></p>
              <div className="mt-5 flex flex-wrap gap-2"><button type="button" className="btn-secondary" onClick={() => { setEditingId(table._id); setForm({ tableNumber: table.tableNumber, capacity: table.capacity, area: table.area, status: table.status, isActive: table.isActive }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>{table.isActive ? <button type="button" className="btn-secondary" onClick={() => remove(table)}>Remove</button> : <button type="button" className="btn-primary" onClick={() => restore(table)}>Restore</button>}</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
