import { useState } from "react";
import { apiFetch } from "../../lib/api";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  restaurantId: "",
  isActive: true
};

function userToForm(user) {
  return {
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    password: "",
    restaurantId: user.restaurantId?._id || "",
    isActive: Boolean(user.isActive)
  };
}

export default function RestaurantAdminManagement({ restaurantAdmins, restaurants, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [state, setState] = useState({ loading: false, error: "", success: "" });
  const activeRestaurants = restaurants.filter((restaurant) => restaurant.isActive);

  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setState({ loading: false, error: "", success: "" });
  }

  function startEdit(user) {
    setEditingId(user._id);
    setForm(userToForm(user));
    setState({ loading: false, error: "", success: "" });
    requestAnimationFrame(() => {
      document.getElementById("restaurant-admin-editor")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  async function submit(event) {
    event.preventDefault();
    setState({ loading: true, error: "", success: "" });

    try {
      const body = { ...form };
      if (editingId && !body.password) delete body.password;
      const data = await apiFetch(
        editingId
          ? `/platform-admin/restaurant-admins/${editingId}`
          : "/platform-admin/restaurant-admins",
        {
          method: editingId ? "PATCH" : "POST",
          body,
          retryGet: false
        }
      );
      setState({ loading: false, error: "", success: data.message });
      await onChanged();
      if (!editingId) setForm(emptyForm);
    } catch (error) {
      setState({ loading: false, error: error.message, success: "" });
    }
  }

  async function remove(user) {
    const confirmed = window.confirm(
      `Permanently remove Restaurant Admin ${user.name} (${user.email})?`
    );
    if (!confirmed) return;

    setState({ loading: true, error: "", success: "" });
    try {
      const data = await apiFetch(`/platform-admin/restaurant-admins/${user._id}`, {
        method: "DELETE",
        retryGet: false
      });
      setState({ loading: false, error: "", success: data.message });
      if (editingId === user._id) startAdd();
      await onChanged();
    } catch (error) {
      setState({ loading: false, error: error.message, success: "" });
    }
  }

  return (
    <section className="mt-16 border-t border-white/10 pt-14">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[.3em] text-white/35">Management accounts</p>
          <h2 className="mt-3 font-display text-4xl">Restaurant Admins</h2>
        </div>
        <button type="button" className="btn-primary" onClick={startAdd}>+ Add Restaurant Admin</button>
      </div>

      <div className="mt-7 overflow-x-auto rounded-3xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[.035] text-white/45">
            <tr>
              <th className="px-5 py-4 font-medium">Restaurant Admin</th>
              <th className="px-5 py-4 font-medium">Restaurant</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurantAdmins.map((user) => (
              <tr key={user._id} className="border-t border-white/10">
                <td className="px-5 py-4">
                  <p className="text-white/80">{user.name}</p>
                  <p className="mt-1 text-xs text-white/35">{user.email}</p>
                </td>
                <td className="px-5 py-4 text-white/55">{user.restaurantId?.name || "Unassigned"}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs ${user.isActive ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-white/35"}`}>{user.isActive ? "Active" : "Disabled"}</span></td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-secondary text-xs" onClick={() => startEdit(user)}>Edit</button>
                    <button type="button" className="btn-secondary text-xs" onClick={() => remove(user)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
            {!restaurantAdmins.length && (
              <tr><td colSpan="4" className="px-5 py-8 text-center text-white/35">No Restaurant Admin accounts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <form id="restaurant-admin-editor" onSubmit={submit} className="surface mt-8 rounded-3xl p-6 md:p-8">
        <p className="text-xs uppercase tracking-[.25em] text-white/35">{editingId ? "Edit account" : "New account"}</p>
        <h3 className="mt-2 font-display text-3xl">{editingId ? "Edit Restaurant Admin" : "Add Restaurant Admin"}</h3>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block"><span className="mb-2 block text-sm text-white/60">Name *</span><input className="input-field" name="name" value={form.name} onChange={update} required /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Email *</span><input className="input-field" name="email" type="email" value={form.email} onChange={update} required /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Phone</span><input className="input-field" name="phone" value={form.phone} onChange={update} /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">{editingId ? "New password (leave blank to keep current)" : "Password *"}</span><input className="input-field" name="password" type="password" value={form.password} onChange={update} required={!editingId} /></label>
          <label className="block md:col-span-2"><span className="mb-2 block text-sm text-white/60">Assigned Restaurant *</span><select className="input-field" name="restaurantId" value={form.restaurantId} onChange={update} required><option value="">Select a restaurant</option>{activeRestaurants.map((restaurant) => <option key={restaurant._id} value={restaurant._id}>{restaurant.name}</option>)}</select></label>
        </div>

        {editingId && (
          <label className="mt-5 flex items-center gap-3 text-sm text-white/60"><input type="checkbox" name="isActive" checked={form.isActive} onChange={update} />Allow this Restaurant Admin to log in</label>
        )}

        {state.error && <p className="mt-5 rounded-xl bg-red-400/10 p-4 text-sm text-red-200">{state.error}</p>}
        {state.success && <p className="mt-5 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-100">{state.success}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn-primary" disabled={state.loading || !activeRestaurants.length}>{state.loading ? "Saving..." : editingId ? "Save Restaurant Admin" : "Add Restaurant Admin"}</button>
          {editingId && <button type="button" className="btn-secondary" onClick={startAdd}>Cancel edit</button>}
        </div>
        {!activeRestaurants.length && <p className="mt-4 text-sm text-amber-200/70">Add or restore an active restaurant before creating a Restaurant Admin.</p>}
      </form>
    </section>
  );
}
