import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import PageMessage from "../components/PageMessage";
import MotionReveal from "../components/motion/MotionReveal";
import LottieFlowIcon from "../components/LottieFlowIcon";
import PublicMenuItem from "../components/public/PublicMenuItem";
import { apiFetch } from "../lib/api";

export default function RestaurantMenuPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "").trim().toLowerCase();
  const [inputValue, setInputValue] = useState(query);
  const [data, setData] = useState({
    restaurant: null,
    categories: [],
    items: []
  });
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, error: "" });

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);

    const suffix = params.toString() ? `?${params.toString()}` : "";

    apiFetch(`/restaurants/${slug}/menu${suffix}`, {
      signal: controller.signal
    })
      .then((payload) => {
        setData({
          restaurant: payload.restaurant,
          categories: payload.categories || [],
          items: payload.items || []
        });
        setState({ loading: false, error: "" });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ loading: false, error: error.message });
        }
      });

    return () => controller.abort();
  }, [slug, query, category]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextQuery = inputValue.trim();
      if (nextQuery === query) return;

      const next = new URLSearchParams(searchParams);
      if (nextQuery) next.set("q", nextQuery);
      else next.delete("q");
      setSearchParams(next, { replace: true });
    }, 320);

    return () => window.clearTimeout(timer);
  }, [inputValue, query, searchParams, setSearchParams]);

  const selectedCategoryName = useMemo(() => {
    if (!category) return "All dishes";
    return data.categories.find((item) => item.slug === category)?.name || "Menu";
  }, [category, data.categories]);

  function chooseCategory(slugValue) {
    const next = new URLSearchParams(searchParams);
    if (slugValue) next.set("category", slugValue);
    else next.delete("category");
    setSearchParams(next);
  }

  if (state.error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-24 md:px-8">
        <PageMessage title="Menu unavailable" message={state.error} />
      </main>
    );
  }

  const restaurant = data.restaurant;

  return (
    <main className="public-restaurant-page">
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-12 md:px-8 md:pb-32 md:pt-20">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-white/10 pb-7">
          <Link
            to={`/restaurant/${slug}`}
            className="text-xs uppercase tracking-[.2em] text-white/45 transition hover:text-white"
          >
            ← Restaurant
          </Link>
          {restaurant && (
            <p className="text-xs uppercase tracking-[.24em] text-white/32">
              {restaurant.cuisine}
            </p>
          )}
        </div>

        <MotionReveal className="grid gap-10 border-b border-white/10 py-12 md:grid-cols-[1fr_.8fr] md:items-end md:py-16">
          <div>
            <p className="text-xs uppercase tracking-[.3em] text-white/35">
              {restaurant?.name || "Restaurant"}
            </p>
            <h1 className="mt-5 font-display text-6xl leading-[.9] md:text-8xl">
              Menu
            </h1>
          </div>
          <p className="max-w-xl leading-7 text-white/48 md:justify-self-end">
            Browse the current available menu. Search by dish name, ingredient or description,
            or move through the Restaurant Admin-defined categories.
          </p>
        </MotionReveal>

        <section className="sticky top-[4.5rem] z-20 -mx-2 border-b border-white/10 bg-[#050505]/88 px-2 py-5 backdrop-blur-xl">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <label className="public-menu-search">
              <span className="sr-only">Search this restaurant menu</span>
              <LottieFlowIcon name="search" />
              <input
                type="search"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Search dish, ingredient or flavour..."
                maxLength={80}
              />
            </label>

            <div className="public-menu-category-strip" aria-label="Menu categories">
              <button
                type="button"
                className={!category ? "is-active" : ""}
                onClick={() => chooseCategory("")}
              >
                All
              </button>
              {data.categories.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  className={category === item.slug ? "is-active" : ""}
                  onClick={() => chooseCategory(item.slug)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="pt-10 md:pt-14">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[.26em] text-white/32">
                {selectedCategoryName}
              </p>
              {query && (
                <p className="mt-2 text-sm text-white/48">
                  Search: <span className="text-white/75">“{query}”</span>
                </p>
              )}
            </div>
            {!state.loading && (
              <p className="text-xs uppercase tracking-[.18em] text-white/30">
                {data.items.length} {data.items.length === 1 ? "dish" : "dishes"}
              </p>
            )}
          </div>

          {state.loading && (
            <div className="space-y-3 py-8" aria-live="polite">
              <div className="public-menu-skeleton" />
              <div className="public-menu-skeleton" />
              <div className="public-menu-skeleton" />
            </div>
          )}

          {!state.loading && data.items.length === 0 && (
            <PageMessage
              title="No dishes found"
              message="Try another menu category or a different search term. Only currently available dishes are shown publicly."
            />
          )}

          {!state.loading && data.items.length > 0 && (
            <div>
              {data.items.map((item) => (
                <PublicMenuItem
                  key={item._id}
                  item={item}
                  fallbackImage={restaurant?.coverImageUrl}
                />
              ))}
            </div>
          )}
        </section>

      </section>
    </main>
  );
}
