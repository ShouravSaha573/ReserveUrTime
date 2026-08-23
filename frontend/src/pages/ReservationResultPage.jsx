import { Link, useSearchParams } from "react-router-dom";

export default function ReservationResultPage() {
  const [params] = useSearchParams();
  const outcome = params.get("payment");
  const reference = params.get("reference") || "";
  const success = outcome === "success";
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 md:px-8">
      <div className="surface rounded-[2rem] p-8 text-center md:p-12">
        <p className="text-xs uppercase tracking-[.28em] text-white/35">Reservation payment</p>
        <h1 className="mt-5 font-display text-5xl">{success ? "Table confirmed" : outcome === "review" ? "Payment under review" : "Payment not completed"}</h1>
        <p className="mt-5 text-white/55">{success ? "SSLCOMMERZ verified your deposit and your table is booked." : outcome === "review" ? "The gateway flagged this payment for review. The table remains on hold while it is reconciled." : "The gateway did not verify payment, so the table was released. You can safely try again."}</p>
        {reference && <p className="mt-6 font-display text-2xl text-emerald-100">{reference}</p>}
        <Link className="btn-primary mt-8" to="/restaurants">Browse restaurants</Link>
      </div>
    </main>
  );
}
