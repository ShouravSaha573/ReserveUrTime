import { asyncHandler } from "../utils/asyncHandler.js";
import {
  addCustomerCartItem,
  cancelCustomerOrder,
  clearCustomerCart,
  getCustomerCart,
  listCustomerOrders,
  placeCustomerOrder,
  removeCustomerCartItem,
  updateCustomerCartItem
} from "../services/orderService.js";

export const getCart = asyncHandler(async (req, res) => {
  res.json(await getCustomerCart(req.user._id));
});

export const addCartItem = asyncHandler(async (req, res) => {
  const cart = await addCustomerCartItem(
    req.user._id,
    req.body.menuItemId,
    req.body.quantity ?? 1,
    { replaceExistingRestaurant: req.body.replaceExistingRestaurant === true }
  );
  res.status(201).json({ message: "Dish added to cart.", ...cart });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await updateCustomerCartItem(
    req.user._id,
    req.params.menuItemId,
    req.body.quantity
  );
  res.json({ message: "Cart updated.", ...cart });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await removeCustomerCartItem(req.user._id, req.params.menuItemId);
  res.json({ message: "Dish removed from cart.", ...cart });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await clearCustomerCart(req.user._id);
  res.json({ message: "Cart cleared.", ...cart });
});

export const createOrder = asyncHandler(async (req, res) => {
  const order = await placeCustomerOrder(req.user._id, {
    notes: req.body.notes,
    checkoutKey: req.body.checkoutKey,
    reservation: req.body.reservation
  });
  res.status(201).json({ message: "Table reserved and food order placed.", order });
});

export const customerOrders = asyncHandler(async (req, res) => {
  const orders = await listCustomerOrders(req.user._id);
  res.json({ orders });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await cancelCustomerOrder(req.user._id, req.params.orderId);
  res.json({ message: "Order cancelled.", order });
});
