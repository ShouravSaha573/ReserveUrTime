import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import LottieFlowIcon from "./LottieFlowIcon";

const SEARCH_DELAY = 320;
const LAUNCH_DELAY = 360;

function SearchIcon() {
  return <LottieFlowIcon name="search" className="h-5 w-5" />;
}

export default function GalaxyRestaurantSearch({
  initialValue = "",
  suggestions = true,
  onSearch,
  placeholder = "Search restaurants, food, categories or locations..."
}) {
  const navigate = useNavigate();
  const shellRef = useRef(null);
  const inputRef = useRef(null);
  const launchTimerRef = useRef(null);
  const blurTimerRef = useRef(null);
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const receiveCategory = (event) => {
      const nextQuery = String(event.detail?.query || "").trim();
      if (!nextQuery) return;
      setQuery(nextQuery);
      setFocused(true);
      window.setTimeout(() => inputRef.current?.focus(), 520);
    };
    window.addEventListener("reserveurtime:set-search", receiveCategory);
    return () => window.removeEventListener("reserveurtime:set-search", receiveCategory);
  }, []);

  useEffect(() => {
    if (!suggestions || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");

      apiFetch(`/restaurants?q=${encodeURIComponent(query.trim())}&limit=6`, {
        signal: controller.signal,
        retryGet: true
      })
        .then((data) => {
          setResults(data.restaurants || []);
          setLoading(false);
        })
        .catch((fetchError) => {
          if (fetchError.name !== "AbortError") {
            setError(fetchError.message || "Search is temporarily unavailable.");
            setLoading(false);
          }
        });
    }, SEARCH_DELAY);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, suggestions]);

  useEffect(
    () => () => {
      if (launchTimerRef.current) {
        window.clearTimeout(launchTimerRef.current);
      }
      if (blurTimerRef.current) {
        window.clearTimeout(blurTimerRef.current);
      }
    },
    []
  );

  function resetTilt() {
    const element = shellRef.current;
    if (!element) return;
    element.style.setProperty("--search-rx", "0deg");
    element.style.setProperty("--search-ry", "0deg");
    element.style.setProperty("--search-light-x", "50%");
    element.style.setProperty("--search-light-y", "50%");
  }

  function handlePointerMove(event) {
    if (event.pointerType === "touch") return;
    const element = shellRef.current;
    if (!element) return;

    const bounds = element.getBoundingClientRect();
    const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5;

    element.style.setProperty("--search-ry", `${normalizedX * 4.5}deg`);
    element.style.setProperty("--search-rx", `${normalizedY * -3.4}deg`);
    element.style.setProperty(
      "--search-light-x",
      `${Math.min(100, Math.max(0, (normalizedX + 0.5) * 100))}%`
    );
    element.style.setProperty(
      "--search-light-y",
      `${Math.min(100, Math.max(0, (normalizedY + 0.5) * 100))}%`
    );
  }

  function launchSearch(nextQuery = query) {
    const value = nextQuery.trim();
    if (!value) return;

    if (launchTimerRef.current) {
      window.clearTimeout(launchTimerRef.current);
    }
    setLaunching(true);
    launchTimerRef.current = window.setTimeout(() => {
      setLaunching(false);
      if (onSearch) {
        onSearch(value);
      } else {
        navigate(`/restaurants?q=${encodeURIComponent(value)}`);
      }
    }, LAUNCH_DELAY);
  }

  function handleSubmit(event) {
    event.preventDefault();
    launchSearch();
  }

  function openRestaurant(restaurant) {
    if (launchTimerRef.current) {
      window.clearTimeout(launchTimerRef.current);
    }
    setLaunching(true);
    launchTimerRef.current = window.setTimeout(() => {
      setLaunching(false);
      navigate(`/restaurant/${restaurant.slug}`);
    }, LAUNCH_DELAY);
  }

  const showPanel =
    suggestions && focused && query.trim().length >= 2;

  return (
    <div className="galaxy-search-wrap">
      <form
        className={`galaxy-search-shell ${launching ? "is-launching" : ""}`}
        ref={shellRef}
        onSubmit={handleSubmit}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        role="search"
        aria-label="Search by restaurant, food, category, cuisine or location"
      >
        <span className="galaxy-search-orbit galaxy-search-orbit-a" aria-hidden="true" />
        <span className="galaxy-search-orbit galaxy-search-orbit-b" aria-hidden="true" />
        <span className="galaxy-search-sparks" aria-hidden="true" />
        <span className="galaxy-search-warp" aria-hidden="true" />

        <div className="galaxy-search-inner">
          <span className="galaxy-search-icon" aria-hidden="true">
            <SearchIcon />
          </span>

          <label className="sr-only" htmlFor="restaurant-galaxy-search">
            Search by restaurant name, food, category, cuisine or location
          </label>
          <input
            ref={inputRef}
            id="restaurant-galaxy-search"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => {
              if (blurTimerRef.current) {
                window.clearTimeout(blurTimerRef.current);
              }
              setFocused(true);
            }}
            onBlur={() => {
              blurTimerRef.current = window.setTimeout(() => setFocused(false), 140);
            }}
            placeholder={placeholder}
            className="galaxy-search-input"
          />

          <button
            type="submit"
            className="galaxy-search-button"
            disabled={!query.trim() || launching}
          >
            <span>Explore</span>
            <LottieFlowIcon name="arrow" />
          </button>
        </div>
      </form>

      {showPanel && (
        <div className="galaxy-search-results" role="listbox" aria-label="Restaurant search suggestions">
          {loading && (
            <div className="galaxy-search-status">Searching the constellation…</div>
          )}

          {!loading && error && (
            <div className="galaxy-search-status text-rose-200/75">{error}</div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="galaxy-search-status">
              No restaurant, food, category or location matched “{query.trim()}”.
            </div>
          )}

          {!loading &&
            !error &&
            results.map((restaurant) => (
              <button
                type="button"
                key={restaurant._id}
                className="galaxy-search-result"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => openRestaurant(restaurant)}
                role="option"
                aria-label={`${restaurant.name}, ${restaurant.cuisine}`}
              >
                <span className="galaxy-search-result-image">
                  <img src={restaurant.coverImageUrl} alt="" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-display text-xl text-[#f3efe6]">
                    {restaurant.name}
                  </span>
                  <span className="mt-1 block truncate text-xs uppercase tracking-[.16em] text-white/42">
                    {restaurant.cuisine} · {restaurant.location}
                  </span>
                </span>
                <LottieFlowIcon name="arrow" className="rotate-[-45deg] opacity-60" />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
