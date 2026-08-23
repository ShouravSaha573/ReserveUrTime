import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageMessage from "../components/PageMessage";
import { apiFetch } from "../lib/api";

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const restaurantSlug = (searchParams.get("restaurant") || "").trim();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [state, setState] = useState({ busy: false, error: "", success: "", reference: "", verificationId: "", code: "" });
  const targetLabel = useMemo(() => restaurantSlug ? `Restaurant: ${restaurantSlug.replaceAll("-", " ")}` : "ReserveUrTime platform", [restaurantSlug]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setState((current) => ({ ...current, busy: true, error: "", success: "", reference: "" }));
    try {
      const data = await apiFetch("/contact", {
        method: "POST",
        body: { targetType: restaurantSlug ? "restaurant" : "platform", restaurantSlug, ...form },
        retryGet: false
      });
      setState((current) => ({ ...current, busy: false, error: "", success: data.message, verificationId: data.verificationId, code: "" }));
    } catch (error) {
      setState((current) => ({ ...current, busy: false, error: error.message, success: "", reference: "" }));
    }
  }

  async function verifyAndSend(event) {
    event.preventDefault();
    setState((current) => ({ ...current, busy: true, error: "", success: "" }));
    try {
      const data = await apiFetch("/contact/verify", {
        method: "POST",
        body: { verificationId: state.verificationId, code: state.code },
        retryGet: false
      });
      setState({ busy: false, error: "", success: data.message, reference: data.reference || "", verificationId: "", code: "" });
      setForm((current) => ({ ...current, subject: "", message: "" }));
    } catch (error) {
      setState((current) => ({ ...current, busy: false, error: error.message, success: "" }));
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 md:px-8 md:py-24">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Contact</p>
      <h1 className="mt-5 font-display text-5xl md:text-7xl">Send a message</h1>

      <div className="surface mt-10 rounded-[2rem] p-6 md:p-9">
        <p className="text-xs uppercase tracking-[.2em] text-white/35">Destination</p>
        <p className="mt-2 font-display text-2xl capitalize">{targetLabel}</p>

        {state.error && <PageMessage title="Message not sent" message={state.error} />}
        {state.success && (
          <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-5 text-emerald-100">
            <p>{state.success}</p>
            {state.reference && <p className="mt-2 text-sm opacity-65">Reference: {state.reference}</p>}
          </div>
        )}

        {!state.verificationId ? (
          <form onSubmit={submit} className="mt-8 grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/65">Name<input className="input-field" value={form.name} onChange={(event) => update("name", event.target.value)} maxLength={80} required /></label>
              <label className="grid gap-2 text-sm text-white/65">Email<input className="input-field" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} maxLength={180} required /></label>
            </div>
            <label className="grid gap-2 text-sm text-white/65">Subject<input className="input-field" value={form.subject} onChange={(event) => update("subject", event.target.value)} maxLength={120} required /></label>
            <label className="grid gap-2 text-sm text-white/65">Message<textarea className="input-field min-h-40 resize-y" value={form.message} onChange={(event) => update("message", event.target.value)} maxLength={1600} required /></label>
            <div className="flex flex-wrap gap-3">
              <button disabled={state.busy} className="btn-primary">{state.busy ? "Sending code…" : "Verify email & send"}</button>
              {restaurantSlug && <Link to={`/restaurant/${restaurantSlug}`} className="btn-secondary">Back to Restaurant</Link>}
            </div>
          </form>
        ) : (
          <form onSubmit={verifyAndSend} className="mt-8 grid gap-5">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-5 text-sm leading-6 text-emerald-100">A six-digit code was sent to your email address. Enter it below to email your message to the Platform Admin. The code expires in 10 minutes.</div>
            <label className="grid gap-2 text-sm text-white/65">Verification code<input className="input-field" inputMode="numeric" autoComplete="one-time-code" value={state.code} onChange={(event) => setState((current) => ({ ...current, code: event.target.value.replace(/\D/g, "").slice(0, 6) }))} minLength={6} maxLength={6} pattern="[0-9]{6}" required autoFocus /></label>
            <div className="flex flex-wrap gap-3">
              <button disabled={state.busy || state.code.length !== 6} className="btn-primary">{state.busy ? "Verifying…" : "Verify & send message"}</button>
              <button type="button" className="btn-secondary" disabled={state.busy} onClick={() => setState((current) => ({ ...current, verificationId: "", code: "", success: "", error: "" }))}>Edit message</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
