import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import RestaurantCard from "../components/RestaurantCard";
import SignatureFoodHero from "../components/SignatureFoodHero";
import LottieFlowIcon from "../components/LottieFlowIcon";
import { useSiteContent } from "../context/SiteContentContext";

export default function HomePage() {
  const { content } = useSiteContent();
  const reduced = useReducedMotion();
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState("");
  const [restaurantsReloadKey, setRestaurantsReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const limit = content.restaurantsSection.featuredLimit || 3;

    setRestaurantsLoading(true);
    setRestaurantsError("");

    async function loadRestaurants() {
      try {
        const data = await apiFetch(`/restaurants?featured=true&limit=${limit}`, {
          signal: controller.signal
        });
        const featured = data.restaurants || [];

        if (featured.length) {
          setRestaurants(featured);
          return;
        }

        const fallback = await apiFetch(`/restaurants?limit=${limit}`, {
          signal: controller.signal
        });
        setRestaurants(fallback.restaurants || []);
      } catch (error) {
        if (controller.signal.aborted) return;
        setRestaurants([]);
        setRestaurantsError(error?.message || "Could not load Restaurants from the backend.");
      } finally {
        if (!controller.signal.aborted) setRestaurantsLoading(false);
      }
    }

    loadRestaurants();
    return () => controller.abort();
  }, [content.restaurantsSection.featuredLimit, restaurantsReloadKey]);

  return (
    <>
      <SignatureFoodHero content={content} />

      {content.restaurantsSection.enabled && (
        <motion.section
          className="homepage-restaurants-section relative z-20 mx-auto max-w-7xl px-6 py-20 md:px-8 md:py-28"
          initial={reduced ? false : { opacity: 0, y: 32 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: reduced ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-10 flex items-end justify-between gap-8">
            <div>
              <p className="text-xs uppercase tracking-[.3em] text-white/40">
                {content.restaurantsSection.eyebrow}
              </p>
              <h2 className="mt-4 font-display text-4xl md:text-6xl">
                {content.restaurantsSection.title}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/42">
                Four premium interactive 3D food heroes and the Soda showcase lead the experience. Restaurant pages stay fast, practical and focused on menus, availability and reservations.
              </p>
            </div>
          </div>

          {restaurantsLoading && (
            <div className="surface rounded-3xl p-8 text-white/45" role="status">
              Loading Restaurants…
            </div>
          )}

          {!restaurantsLoading && restaurantsError && (
            <div className="surface rounded-3xl p-8" role="alert">
              <p className="font-medium text-white/80">Restaurants could not be loaded.</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                {restaurantsError}
                {import.meta.env.DEV
                  ? " Make sure the backend is running separately on http://localhost:5000."
                  : " Please try again shortly."}
              </p>
              <button
                type="button"
                className="btn-secondary mt-5"
                onClick={() => setRestaurantsReloadKey((value) => value + 1)}
              >
                Retry Restaurants
              </button>
            </div>
          )}

          {!restaurantsLoading && !restaurantsError && restaurants.map((restaurant, index) => (
            <RestaurantCard
              key={restaurant._id}
              restaurant={restaurant}
              index={index}
            />
          ))}

          {!restaurantsLoading && !restaurantsError && restaurants.length > 0 && (
            <div className="homepage-restaurants-view-all">
              <Link to={content.restaurantsSection.viewAllPath}>
                <span>{content.restaurantsSection.viewAllLabel}</span>
                <LottieFlowIcon name="arrow" className="rotate-180" />
              </Link>
            </div>
          )}

          {!restaurantsLoading && !restaurantsError && !restaurants.length && (
            <div className="surface rounded-3xl p-8 text-white/45">
              <p>No active Restaurants are available right now.</p>
              {import.meta.env.DEV && (
                <p className="mt-2 text-sm text-white/35">
                  If this is a fresh local database, start the backend and run
                  <code className="mx-1 rounded bg-white/5 px-1.5 py-0.5">npm run seed</code>
                  once inside the backend folder.
                </p>
              )}
            </div>
          )}
        </motion.section>
      )}
    </>
  );
}
