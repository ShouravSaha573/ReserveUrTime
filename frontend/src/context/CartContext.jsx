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

const CartContext = createContext(null);

const EMPTY_CART = {
  restaurant: null,
  items: [],
  itemCount: 0,
  subtotal: 0,
  currency: "BDT"
};

function normalizeCart(payload) {
  return {
    restaurant: payload?.restaurant || null,
    items: payload?.items || [],
    itemCount: Number(payload?.itemCount || 0),
    subtotal: Number(payload?.subtotal || 0),
    currency: payload?.currency || "BDT"
  };
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [busyKeys, setBusyKeys] = useState(() => new Set());
  const [error, setError] = useState("");

  const refreshCart = useCallback(async () => {
    if (user?.role !== "customer") {
      setCart(EMPTY_CART);
      setLoading(false);
      setError("");
      return EMPTY_CART;
    }

    setLoading(true);
    try {
      const payload = await apiFetch("/customer/cart", { retryGet: false });
      const next = normalizeCart(payload);
      setCart(next);
      setError("");
      return next;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    refreshCart().catch(() => {});
  }, [refreshCart]);

  const runMutation = useCallback(async (key, request) => {
    setBusyKeys((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });
    setError("");
    try {
      const payload = await request();
      const next = normalizeCart(payload);
      setCart(next);
      return next;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setBusyKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }, []);

  const addItem = useCallback(
    (menuItemId, quantity = 1, { replaceExistingRestaurant = false } = {}) =>
      runMutation(`item:${menuItemId}`, () =>
        apiFetch("/customer/cart/items", {
          method: "POST",
          retryGet: false,
          body: { menuItemId, quantity, replaceExistingRestaurant }
        })
      ),
    [runMutation]
  );

  const updateItem = useCallback(
    (menuItemId, quantity) =>
      runMutation(`item:${menuItemId}`, () =>
        apiFetch(`/customer/cart/items/${menuItemId}`, {
          method: "PATCH",
          retryGet: false,
          body: { quantity }
        })
      ),
    [runMutation]
  );

  const removeItem = useCallback(
    (menuItemId) =>
      runMutation(`item:${menuItemId}`, () =>
        apiFetch(`/customer/cart/items/${menuItemId}`, {
          method: "DELETE",
          retryGet: false
        })
      ),
    [runMutation]
  );

  const clearCart = useCallback(
    () =>
      runMutation("cart:clear", () =>
        apiFetch("/customer/cart", {
          method: "DELETE",
          retryGet: false
        })
      ),
    [runMutation]
  );

  const value = useMemo(
    () => ({
      ...cart,
      loading,
      busy: busyKeys.size > 0,
      clearingCart: busyKeys.has("cart:clear"),
      isItemBusy(menuItemId) {
        return busyKeys.has(`item:${menuItemId}`);
      },
      error,
      refreshCart,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      quantityFor(menuItemId) {
        return cart.items.find((item) => String(item.menuItemId) === String(menuItemId))?.quantity || 0;
      }
    }),
    [addItem, busyKeys, cart, clearCart, error, loading, refreshCart, removeItem, updateItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider.");
  return context;
}
