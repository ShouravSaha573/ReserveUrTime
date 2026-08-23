import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageMessage from "../components/PageMessage";
import PublicMenuItem from "../components/public/PublicMenuItem";
import { apiFetch } from "../lib/api";

export default function RestaurantDetailPage() {
  const { slug } = useParams();
  const [experience, setExperience] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    apiFetch(`/restaurants/${slug}/experience`, {
      signal: controller.signal
    })
      .then(setExperience)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      });

    return () => controller.abort();
  }, [slug]);

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-24 md:px-8">
        <PageMessage title="Restaurant unavailable" message={error} />
      </main>
    );
  }

  if (!experience) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-24 text-white/50 md:px-8">
        Loading restaurant experience...
      </main>
    );
  }

  const { restaurant, profile, menuPreview = [], gallery = [] } = experience;
  const bookingLink = `/restaurant/${restaurant.slug}/menu`;
  const story = profile?.aboutBody || restaurant.description;
  const aboutTitle = profile?.aboutTitle || "Our story";
  const hours = profile?.internalOpeningHours || restaurant.openingHours;
  const phone = profile?.internalPhone || restaurant.phone;
  const email = profile?.internalEmail || restaurant.email;

  return (
    <main className="public-restaurant-page">
      <section className="relative min-h-[78vh] overflow-hidden border-b border-white/10">
        <img
          src={restaurant.coverImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-58"
        />
        <div className="public-restaurant-hero-shade absolute inset-0" />

        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-6 pb-12 pt-28 md:px-8 md:pb-16">
          <div className="flex flex-wrap items-end justify-between gap-9">
            <div className="max-w-4xl">
              <p className="text-xs uppercase tracking-[.32em] text-white/55">
                {restaurant.cuisine} · {restaurant.location}
              </p>
              <h1 className="mt-5 font-display text-[clamp(4.2rem,12vw,10rem)] leading-[.78] tracking-[-.055em]">
                {restaurant.name}
              </h1>
              {(profile?.tagline || restaurant.description) && (
                <p className="mt-8 max-w-2xl text-lg leading-8 text-white/68 md:text-xl">
                  {profile?.tagline || restaurant.description}
                </p>
              )}
            </div>

            <div className="flex flex-col items-start gap-4 md:items-end">
              <Link to={`/restaurant/${slug}/menu`} className="btn-primary">
                Explore menu
              </Link>
              <Link to={bookingLink} className="btn-secondary">
                Choose food & reserve
              </Link>
            </div>
          </div>
        </div>
      </section>

      <nav className="public-restaurant-subnav sticky top-[4.4rem] z-20 border-b border-white/10 bg-[#050505]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-6 py-4 text-[.68rem] uppercase tracking-[.22em] text-white/42 md:px-8">
          <a href="#story">Story</a>
          <a href="#menu">Menu</a>
          <a href="#gallery">Gallery</a>
          <a href="#visit">Visit</a>
          <Link to={bookingLink}>Reservation</Link>
        </div>
      </nav>

      <section id="story" className="mx-auto max-w-7xl scroll-mt-32 px-6 py-20 md:px-8 md:py-32">
        <div className="grid gap-12 md:grid-cols-[.7fr_1.3fr] md:gap-20">
          <div>
            <p className="text-xs uppercase tracking-[.3em] text-white/32">
              01 · About
            </p>
            <h2 className="mt-5 font-display text-4xl md:text-6xl">
              {aboutTitle}
            </h2>
          </div>
          <div className="max-w-3xl md:pt-12">
            <p className="whitespace-pre-line font-display text-2xl leading-[1.45] text-white/72 md:text-3xl">
              {story}
            </p>
          </div>
        </div>
      </section>

      <section id="menu" className="scroll-mt-32 border-y border-white/10 bg-white/[.012]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-8 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-8 border-b border-white/10 pb-8">
            <div>
              <p className="text-xs uppercase tracking-[.3em] text-white/32">
                02 · Menu
              </p>
              <h2 className="mt-5 font-display text-5xl md:text-7xl">
                Current dishes
              </h2>
            </div>
            <Link
              to={`/restaurant/${slug}/menu`}
              className="inline-flex border-b border-white/30 pb-1 text-xs uppercase tracking-[.2em] text-white/65 transition hover:text-white"
            >
              View full menu →
            </Link>
          </div>

          {menuPreview.length === 0 ? (
            <div className="py-12 text-white/45">
              This Restaurant has not published available dishes yet.
            </div>
          ) : (
            <div>
              {menuPreview.map((item) => (
                <PublicMenuItem
                  key={item._id}
                  item={item}
                  fallbackImage={restaurant.coverImageUrl}
                  restaurantSlug={slug}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="gallery" className="mx-auto max-w-7xl scroll-mt-32 px-6 py-20 md:px-8 md:py-32">
        <div className="grid gap-8 md:grid-cols-[.65fr_1.35fr] md:gap-16">
          <div>
            <p className="text-xs uppercase tracking-[.3em] text-white/32">
              03 · Atmosphere
            </p>
            <h2 className="mt-5 font-display text-4xl md:text-6xl">
              Inside the room
            </h2>
          </div>

          <div className="public-gallery-grid">
            {(gallery.length ? gallery : [{
              _id: "fallback",
              imageUrl: restaurant.coverImageUrl,
              altText: `${restaurant.name} atmosphere`,
              title: restaurant.name
            }]).map((item, index) => (
              <figure
                key={item._id}
                className={`public-gallery-item ${index === 0 ? "is-featured" : ""}`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.altText || ""}
                  loading={index === 0 ? "eager" : "lazy"}
                />
                {(item.title || item.caption) && (
                  <figcaption>
                    {item.title && <span>{item.title}</span>}
                    {item.caption && <small>{item.caption}</small>}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="visit" className="scroll-mt-32 border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1fr_1fr] md:px-8 md:py-28">
          <div>
            <p className="text-xs uppercase tracking-[.3em] text-white/32">
              05 · Visit
            </p>
            <h2 className="mt-5 max-w-xl font-display text-5xl leading-[1.02] md:text-7xl">
              Reserve your place at {restaurant.name}.
            </h2>
            {profile?.reservationNote && (
              <p className="mt-7 max-w-xl leading-7 text-white/50">
                {profile.reservationNote}
              </p>
            )}
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to={bookingLink} className="btn-primary">Choose food & reserve</Link>
            </div>
          </div>

          <dl className="grid content-start gap-8 border-t border-white/10 pt-8 text-sm md:mt-10">
            <div className="grid gap-2 border-b border-white/10 pb-7 sm:grid-cols-[8rem_1fr]">
              <dt className="uppercase tracking-[.18em] text-white/30">Location</dt>
              <dd className="text-white/72">{restaurant.location}</dd>
            </div>
            <div className="grid gap-2 border-b border-white/10 pb-7 sm:grid-cols-[8rem_1fr]">
              <dt className="uppercase tracking-[.18em] text-white/30">Hours</dt>
              <dd className="text-white/72">{hours || "Contact the Restaurant for current hours."}</dd>
            </div>
            <div className="grid gap-2 border-b border-white/10 pb-7 sm:grid-cols-[8rem_1fr]">
              <dt className="uppercase tracking-[.18em] text-white/30">Contact</dt>
              <dd className="space-y-1 text-white/72">
                {phone && <div>{phone}</div>}
                {email && <div>{email}</div>}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
