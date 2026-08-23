import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24 text-center md:px-8">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">
        404
      </p>
      <h1 className="mt-5 font-display text-6xl">
        Page not found
      </h1>
      <Link
        to="/"
        className="btn-primary mt-8"
      >
        Back home
      </Link>
    </main>
  );
}
