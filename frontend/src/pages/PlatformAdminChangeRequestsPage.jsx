import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import PlatformAdminSectionNav from "../components/PlatformAdminSectionNav";

function badge(status) {
  if (status === "approved") return "bg-emerald-400/10 text-emerald-200";
  if (status === "rejected") return "bg-red-400/10 text-red-200";
  return "bg-amber-300/10 text-amber-100";
}

export default function PlatformAdminChangeRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [notes, setNotes] = useState({});
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setError("");
    const suffix = filter === "all" ? "" : `?status=${filter}`;
    try {
      const data = await apiFetch(`/platform-admin/listing-change-requests${suffix}`);
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function review(request, action) {
    const verb = action === "approve" ? "approve and apply" : "reject";
    if (!window.confirm(`Are you sure you want to ${verb} this request?`)) return;
    setWorkingId(request._id);
    setError("");
    setSuccess("");
    try {
      const data = await apiFetch(`/platform-admin/listing-change-requests/${request._id}/review`, {
        method: "PATCH",
        body: { action, adminNote: notes[request._id] || "" },
        retryGet: false
      });
      setSuccess(data.message);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorkingId("");
    }
  }

  return (
    <main className="admin-workspace mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Platform Admin · Approval inbox</p>
      <h1 className="mt-4 font-display text-5xl md:text-7xl">Restaurant listing requests</h1>
      <PlatformAdminSectionNav />

      <div className="mt-8 flex flex-wrap gap-2">
        {["pending", "approved", "rejected", "all"].map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={filter === item ? "btn-primary" : "btn-secondary"}>{item}</button>)}
      </div>

      {error && <p className="mt-6 rounded-xl bg-red-400/10 p-4 text-red-200">{error}</p>}
      {success && <p className="mt-6 rounded-xl bg-emerald-400/10 p-4 text-emerald-100">{success}</p>}

      <div className="mt-8 space-y-5">
        {requests.length === 0 && <div className="surface rounded-3xl p-8 text-white/45">No {filter === "all" ? "" : filter} requests.</div>}
        {requests.map((request) => (
          <article key={request._id} className="surface rounded-3xl p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[.22em] text-white/35">{request.restaurantId?.name || "Restaurant"}</p>
                <h2 className="mt-2 font-display text-3xl">{request.type === "restaurant_name" ? "Restaurant name change" : "Listing image change"}</h2>
                <p className="mt-2 text-sm text-white/45">Requested by {request.requestedBy?.name || request.requestedBy?.email || "Restaurant Admin"}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[.12em] ${badge(request.status)}`}>{request.status}</span>
            </div>

            {request.type === "restaurant_name" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-white/10 p-5"><p className="text-xs uppercase tracking-[.2em] text-white/35">Current</p><p className="mt-3 font-display text-3xl">{request.currentValue}</p></div><div className="rounded-2xl border border-white/10 p-5"><p className="text-xs uppercase tracking-[.2em] text-white/35">Proposed</p><p className="mt-3 font-display text-3xl">{request.proposedValue}</p></div></div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="overflow-hidden rounded-2xl border border-white/10"><p className="p-4 text-xs uppercase tracking-[.2em] text-white/35">Current</p>{request.currentValue ? <img src={request.currentValue} alt="Current listing" className="h-56 w-full object-cover" /> : <div className="flex h-56 items-center justify-center text-white/30">No current image</div>}</div><div className="overflow-hidden rounded-2xl border border-white/10"><p className="p-4 text-xs uppercase tracking-[.2em] text-white/35">Proposed</p><img src={request.proposedValue} alt="Proposed listing" className="h-56 w-full object-cover" /></div></div>
            )}

            {request.note && <p className="mt-5 text-sm text-white/55">Restaurant Admin note: {request.note}</p>}

            {request.status === "pending" ? (
              <div className="mt-6">
                <label className="block"><span className="mb-2 block text-sm text-white/55">Platform Admin review note (optional)</span><textarea className="input-field min-h-20 resize-y" value={notes[request._id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [request._id]: event.target.value }))} /></label>
                <div className="mt-4 flex flex-wrap gap-3"><button type="button" className="btn-primary" disabled={workingId === request._id} onClick={() => review(request, "approve")}>Approve & apply</button><button type="button" className="btn-secondary" disabled={workingId === request._id} onClick={() => review(request, "reject")}>Reject</button></div>
              </div>
            ) : (
              request.adminNote && <p className="mt-5 text-sm text-white/55">Review note: {request.adminNote}</p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
