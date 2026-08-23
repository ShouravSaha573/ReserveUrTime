import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);

const EMPTY = {
  restaurants: [],
  dishes: [],
  restaurantIds: [],
  menuItemIds: []
};

function keyFor(targetType, targetId) {
  return `${targetType}:${targetId}`;
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [busyKeys, setBusyKeys] = useState(() => new Set());
  const [error, setError] = useState("");

  const loadFavorites = useCallback(async () => {
    if (user?.role !== "customer") {
      setData(EMPTY);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    try {
      const payload = await apiFetch("/customer/favorites", {
        retryGet: false
      });
      setData({
        restaurants: payload.restaurants || [],
        dishes: payload.dishes || [],
        restaurantIds: payload.restaurantIds || [],
        menuItemIds: payload.menuItemIds || []
      });
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.id]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorite = useCallback(
    (targetType, targetId) => {
      if (!targetId) return false;
      const ids = targetType === "restaurant" ? data.restaurantIds : data.menuItemIds;
      return ids.includes(String(targetId));
    },
    [data.menuItemIds, data.restaurantIds]
  );

  const toggleFavorite = useCallback(
    async (targetType, targetId) => {
      if (user?.role !== "customer") {
        throw new Error("Customer login is required to save favourites.");
      }

      const id = String(targetId || "");
      const key = keyFor(targetType, id);
      const wasFavorite = isFavorite(targetType, id);
      const previous = data;

      setBusyKeys((current) => new Set(current).add(key));
      setError("");

      setData((current) => {
        if (targetType === "restaurant") {
          return {
            ...current,
            restaurantIds: wasFavorite
              ? current.restaurantIds.filter((value) => value !== id)
              : [...current.restaurantIds, id],
            restaurants: wasFavorite
              ? current.restaurants.filter((entry) => String(entry.restaurant?._id) !== id)
              : current.restaurants
          };
        }

        return {
          ...current,
          menuItemIds: wasFavorite
            ? current.menuItemIds.filter((value) => value !== id)
            : [...current.menuItemIds, id],
          dishes: wasFavorite
            ? current.dishes.filter((entry) => String(entry.item?._id) !== id)
            : current.dishes
        };
      });

      try {
        const payload = wasFavorite
          ? await apiFetch(`/customer/favorites/${targetType}/${id}`, {
              method: "DELETE",
              retryGet: false
            })
          : await apiFetch("/customer/favorites", {
              method: "POST",
              body: { targetType, targetId: id },
              retryGet: false
            });

        setData({
          restaurants: payload.restaurants || [],
          dishes: payload.dishes || [],
          restaurantIds: payload.restaurantIds || [],
          menuItemIds: payload.menuItemIds || []
        });

        return !wasFavorite;
      } catch (err) {
        setData(previous);
        setError(err.message);
        throw err;
      } finally {
        setBusyKeys((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    },
    [data, isFavorite, user?.role]
  );

  const value = useMemo(
    () => ({
      ...data,
      loading,
      error,
      loadFavorites,
      isFavorite,
      toggleFavorite,
      isBusy(targetType, targetId) {
        return busyKeys.has(keyFor(targetType, String(targetId || "")));
      }
    }),
    [busyKeys, data, error, isFavorite, loadFavorites, loading, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used inside FavoritesProvider.");
  }
  return context;
}
