import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import RestaurantCard from "../components/RestaurantCard";
import GalaxyRestaurantSearch from "../components/GalaxyRestaurantSearch";
import PageMessage from "../components/PageMessage";
import LottieFlowIcon from "../components/LottieFlowIcon";
import { apiFetch } from "../lib/api";

export default function RestaurantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const [restaurants, setRestaurants] = useState([]);
  const [state, setState] = useState({
    loading: true,
    error: ""
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, error: "" });

    const path = query
      ? `/restaurants?q=${encodeURIComponent(query)}`
      : "/restaurants";

    apiFetch(path, {
      signal: controller.signal
    })
      .then((data) => {
        setRestaurants(data.restaurants);
        setState({ loading: false, error: "" });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({
            loading: false,
            error: error.message
          });
        }
      });

    return () => controller.abort();
  }, [query]);

  function handleSearch(value) {
    const next = value.trim();
    if (next) {
      setSearchParams({ q: next });
    } else {
      setSearchParams({});
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24">
      <p className="text-xs uppercase tracking-[.3em] text-white/40">
        Choose your experience
      </p>
      <h1 className="mt-5 font-display text-5xl md:text-7xl">
        Restaurants
      </h1>
      <p className="mt-5 max-w-2xl leading-7 text-white/55">
        Search by restaurant name or cuisine. Restaurant discovery is public,
        and customer login is only required when you decide to book.
      </p>

      <div className="mt-10 w-full">
        <GalaxyRestaurantSearch
          initialValue={query}
          suggestions={false}
          onSearch={handleSearch}
        />
      </div>

      {query && (
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/50">
          <span>
            Showing matches for <span className="text-white/80">“{query}”</span>
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[.16em] text-white/65 hover:text-white"
            onClick={() => setSearchParams({})}
          >
            Clear search <LottieFlowIcon name="close" />
          </button>
        </div>
      )}

      <div className="mt-16">
        {state.loading && (
          <p className="text-white/50">
            Searching restaurants...
          </p>
        )}

        {state.error && (
          <PageMessage
            title="Restaurants unavailable"
            message={state.error}
          />
        )}

        {!state.loading && !state.error && restaurants.length === 0 && (
          <PageMessage
            title="No matching restaurants"
            message="Try a restaurant name or another cuisine."
          />
        )}

        {restaurants.map((restaurant, index) => (
          <RestaurantCard
            key={restaurant._id}
            restaurant={restaurant}
            index={index}
          />
        ))}
      </div>
    </main>
  );
}
