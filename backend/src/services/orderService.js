import mongoose from "mongoose";
import crypto from "crypto";
import { Cart } from "../models/Cart.js";
import { DiningTable } from "../models/DiningTable.js";
import { MenuItem } from "../models/MenuItem.js";
import { Order } from "../models/Order.js";
import { Reservation } from "../models/Reservation.js";
import { Restaurant } from "../models/Restaurant.js";
import { User } from "../models/User.js";
import { createNotification, notifyRestaurantAdmins } from "./notificationService.js";
import { availabilityForDate, validateSelectedTables } from "./tableAvailabilityService.js";

const ORDER_STATUSES = ["placed", "confirmed", "preparing", "ready", "completed", "cancelled"];
const RESERVATION_TIME_SLOTS = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
const ADMIN_TRANSITIONS = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: []
};

function money(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function objectId(value, label = "record id") {
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error(`Invalid ${label}.`);
    error.status = 400;
    throw error;
  }
}

function quantityValue(value) {
  const quantity = Number.parseInt(value, 10);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    const error = new Error("Quantity must be a whole number from 1 to 20.");
    error.status = 400;
    throw error;
  }
  return quantity;
}

function notesValue(value) {
  const notes = String(value || "").trim();
  if (notes.length > 500) {
    const error = new Error("Order note must be 500 characters or fewer.");
    error.status = 400;
    throw error;
  }
  return notes;
}

function checkoutKeyValue(value) {
  const key = String(value || "").trim();
  if (key.length < 12 || key.length > 120 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
    const error = new Error("A valid checkout key is required.");
    error.status = 400;
    throw error;
  }
  return key;
}

function reservationValue(value) {
  const reservationDate = String(value?.reservationDate || "");
  const timeSlot = String(value?.timeSlot || "");
  const guestCount = Number(value?.guestCount);
  const selectedTableIds = Array.isArray(value?.selectedTableIds)
    ? [...new Set(value.selectedTableIds.map(String))].slice(0, 3)
    : [];
  const dhakaToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const earliest = new Date(`${dhakaToday}T00:00:00Z`);
  earliest.setUTCDate(earliest.getUTCDate() + 1);
  const earliestDate = earliest.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reservationDate) || reservationDate < earliestDate) {
    const error = new Error("Reservations must be booked at least one day in advance.");
    error.status = 400;
    throw error;
  }
  if (!RESERVATION_TIME_SLOTS.includes(timeSlot)) {
    const error = new Error("Choose one of the available reservation times.");
    error.status = 400;
    throw error;
  }
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 12) {
    const error = new Error("Guest count must be between 1 and 12.");
    error.status = 400;
    throw error;
  }
  return { reservationDate, timeSlot, guestCount, selectedTableIds };
}

function bookingReference() {
  return `RSV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function emptyCart() {
  return {
    restaurant: null,
    items: [],
    itemCount: 0,
    subtotal: 0,
    currency: "BDT"
  };
}

async function publicCartFromDocument(cart) {
  if (!cart?.restaurantId || !cart.items?.length) return emptyCart();

  const restaurant = await Restaurant.findOne({
    _id: cart.restaurantId,
    isActive: true
  })
    .select("_id name slug cuisine location coverImageUrl")
    .lean();

  if (!restaurant) {
    cart.restaurantId = null;
    cart.items = [];
    await cart.save();
    return emptyCart();
  }

  const ids = cart.items.map((entry) => entry.menuItemId);
  const menuItems = await MenuItem.find({
    _id: mongoose.trusted({ $in: ids }),
    restaurantId: cart.restaurantId,
    isActive: true,
    isAvailable: true
  })
    .select("_id name slug price imageUrl threeD categoryId restaurantId")
    .populate("categoryId", "name slug")
    .lean();

  const itemMap = new Map(menuItems.map((item) => [String(item._id), item]));
  const validEntries = [];
  const items = [];

  for (const entry of cart.items) {
    const item = itemMap.get(String(entry.menuItemId));
    if (!item) continue;
    const quantity = Math.min(20, Math.max(1, Number(entry.quantity || 1)));
    validEntries.push({ menuItemId: item._id, quantity });
    items.push({
      menuItemId: item._id,
      name: item.name,
      slug: item.slug,
      imageUrl: item.imageUrl || item.threeD?.posterUrl || "",
      category: item.categoryId
        ? { _id: item.categoryId._id, name: item.categoryId.name, slug: item.categoryId.slug }
        : null,
      unitPrice: money(item.price),
      quantity,
      lineTotal: money(item.price * quantity),
      threeDEnabled: Boolean(item.threeD?.enabled)
    });
  }

  if (validEntries.length !== cart.items.length) {
    cart.items = validEntries;
    if (!validEntries.length) cart.restaurantId = null;
    await cart.save();
  }

  return {
    restaurant,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: money(items.reduce((sum, item) => sum + item.lineTotal, 0)),
    currency: "BDT"
  };
}

export async function getCustomerCart(userId) {
  const cart = await Cart.findOne({ userId });
  if (!cart) return emptyCart();
  return publicCartFromDocument(cart);
}

export async function addCustomerCartItem(
  userId,
  menuItemId,
  quantity = 1,
  { replaceExistingRestaurant = false } = {}
) {
  objectId(menuItemId, "menu item id");
  const nextQuantity = quantityValue(quantity);

  const item = await MenuItem.findOne({
    _id: menuItemId,
    isActive: true,
    isAvailable: true
  })
    .select("_id restaurantId")
    .lean();

  if (!item) {
    const error = new Error("This dish is currently unavailable.");
    error.status = 404;
    throw error;
  }

  const restaurant = await Restaurant.findOne({
    _id: item.restaurantId,
    isActive: true
  })
    .select("_id")
    .lean();

  if (!restaurant) {
    const error = new Error("This Restaurant is currently unavailable.");
    error.status = 404;
    throw error;
  }

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, restaurantId: item.restaurantId, items: [] });
  }

  const hasOtherRestaurant =
    cart.items.length > 0 &&
    cart.restaurantId &&
    String(cart.restaurantId) !== String(item.restaurantId);

  if (hasOtherRestaurant && !replaceExistingRestaurant) {
    const error = new Error(
      "Your cart already contains dishes from another Restaurant. Clear or replace that cart first."
    );
    error.status = 409;
    throw error;
  }

  if (hasOtherRestaurant && replaceExistingRestaurant) {
    cart.items = [];
  }

  cart.restaurantId = item.restaurantId;
  const existing = cart.items.find(
    (entry) => String(entry.menuItemId) === String(item._id)
  );

  if (existing) {
    existing.quantity = Math.min(20, Number(existing.quantity || 0) + nextQuantity);
  } else {
    cart.items.push({ menuItemId: item._id, quantity: nextQuantity });
  }

  await cart.save();
  return publicCartFromDocument(cart);
}

export async function updateCustomerCartItem(userId, menuItemId, quantity) {
  objectId(menuItemId, "menu item id");
  const nextQuantity = quantityValue(quantity);
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    const error = new Error("Cart is empty.");
    error.status = 404;
    throw error;
  }

  const entry = cart.items.find((item) => String(item.menuItemId) === String(menuItemId));
  if (!entry) {
    const error = new Error("Dish is not in your cart.");
    error.status = 404;
    throw error;
  }

  entry.quantity = nextQuantity;
  await cart.save();
  return publicCartFromDocument(cart);
}

export async function removeCustomerCartItem(userId, menuItemId) {
  objectId(menuItemId, "menu item id");
  const cart = await Cart.findOne({ userId });
  if (!cart) return emptyCart();

  cart.items = cart.items.filter(
    (entry) => String(entry.menuItemId) !== String(menuItemId)
  );
  if (!cart.items.length) cart.restaurantId = null;
  await cart.save();
  return publicCartFromDocument(cart);
}

export async function clearCustomerCart(userId) {
  await Cart.updateOne(
    { userId },
    { $set: { restaurantId: null, items: [] } }
  );
  return emptyCart();
}

function orderNumberFromId(id) {
  const stamp = Date.now().toString(36).toUpperCase();
  const tail = String(id).slice(-6).toUpperCase();
  return `RUT-${stamp}-${tail}`;
}

function sanitizeStatusHistory(history = []) {
  return history.map((entry) => ({
    status: entry.status,
    changedAt: entry.changedAt,
    changedByRole: entry.changedByRole || "system"
  }));
}

function sanitizeCustomerOrder(order) {
  if (!order) return order;
  const value = typeof order.toObject === "function" ? order.toObject() : { ...order };
  delete value.userId;
  delete value.checkoutKey;
  delete value.activePaymentAttemptId;
  delete value.paymentTransactionId;
  value.statusHistory = sanitizeStatusHistory(value.statusHistory);
  return value;
}

function sanitizeRestaurantOrder(order) {
  if (!order) return order;
  const value = typeof order.toObject === "function" ? order.toObject() : { ...order };
  delete value.userId;
  delete value.checkoutKey;
  delete value.activePaymentAttemptId;
  delete value.paymentTransactionId;
  if (value.customerSnapshot) {
    value.customerSnapshot = {
      name: value.customerSnapshot.name,
      phone: value.customerSnapshot.phone || ""
    };
  }
  value.statusHistory = sanitizeStatusHistory(value.statusHistory);
  return value;
}

async function customerOrderQuery(query) {
  const order = await query
    .populate("restaurantId", "name slug location coverImageUrl")
    .lean();
  return sanitizeCustomerOrder(order);
}

export async function getCustomerOrderById(userId, orderId) {
  objectId(orderId, "order id");
  const order = await customerOrderQuery(
    Order.findOne({ _id: orderId, userId })
  );
  if (!order) {
    const error = new Error("Order not found.");
    error.status = 404;
    throw error;
  }
  return order;
}

export async function placeCustomerOrder(userId, { notes, checkoutKey, reservation }) {
  const cleanNotes = notesValue(notes);
  const cleanCheckoutKey = checkoutKeyValue(checkoutKey);
  const dining = reservationValue(reservation);

  const prior = await Order.findOne({ userId, checkoutKey: cleanCheckoutKey }).select("_id").lean();
  if (prior) return getCustomerOrderById(userId, prior._id);

  const session = await mongoose.startSession();
  let createdOrderId = null;

  try {
    await session.withTransaction(async () => {
      const duplicate = await Order.findOne({ userId, checkoutKey: cleanCheckoutKey })
        .session(session)
        .select("_id")
        .lean();
      if (duplicate) {
        createdOrderId = duplicate._id;
        return;
      }

      const cart = await Cart.findOne({ userId }).session(session);
      if (!cart?.restaurantId || !cart.items?.length) {
        const error = new Error("Your cart is empty.");
        error.status = 400;
        throw error;
      }

      const [restaurant, user] = await Promise.all([
        Restaurant.findOne({ _id: cart.restaurantId, isActive: true })
          .session(session)
          .select("_id name slug location")
          .lean(),
        User.findOne({ _id: userId, role: "customer", isActive: true })
          .session(session)
          .select("_id name email phone")
          .lean()
      ]);

      if (!restaurant || !user) {
        const error = new Error("The cart can no longer be checked out.");
        error.status = 409;
        throw error;
      }

      const ids = cart.items.map((entry) => entry.menuItemId);
      const menuItems = await MenuItem.find({
        _id: mongoose.trusted({ $in: ids }),
        restaurantId: cart.restaurantId,
        isActive: true,
        isAvailable: true
      })
        .session(session)
        .select("_id name slug price imageUrl threeD")
        .lean();

      const itemMap = new Map(menuItems.map((item) => [String(item._id), item]));
      if (itemMap.size !== cart.items.length) {
        const error = new Error(
          "One or more dishes changed or became unavailable. Review your cart before ordering."
        );
        error.status = 409;
        throw error;
      }

      const orderItems = cart.items.map((entry) => {
        const item = itemMap.get(String(entry.menuItemId));
        const quantity = quantityValue(entry.quantity);
        const unitPrice = money(item.price);
        return {
          menuItemId: item._id,
          name: item.name,
          slug: item.slug,
          imageUrl: item.imageUrl || item.threeD?.posterUrl || "",
          unitPrice,
          quantity,
          lineTotal: money(unitPrice * quantity),
          threeDEnabled: Boolean(item.threeD?.enabled)
        };
      });

      const subtotal = money(orderItems.reduce((sum, item) => sum + item.lineTotal, 0));
      const orderId = new mongoose.Types.ObjectId();
      const availability = await availabilityForDate({
        restaurantId: restaurant._id,
        date: dining.reservationDate,
        guestCount: dining.guestCount,
        session
      });
      const slot = availability.slots.find((entry) => entry.timeSlot === dining.timeSlot);
      const selection = validateSelectedTables(slot, dining.selectedTableIds, dining.guestCount);
      if (selection.error) {
        const error = new Error(selection.error);
        error.status = 409;
        throw error;
      }
      const tables = selection.selectedTables;
      const reservationId = new mongoose.Types.ObjectId();
      const reference = bookingReference();
      const order = new Order({
        _id: orderId,
        orderNumber: orderNumberFromId(orderId),
        checkoutKey: cleanCheckoutKey,
        userId,
        restaurantId: restaurant._id,
        reservationId,
        reservationSnapshot: {
          bookingReference: reference,
          reservationDate: dining.reservationDate,
          timeSlot: dining.timeSlot,
          guestCount: dining.guestCount,
          tableNumber: tables.map((table) => table.tableNumber).join(", "),
          tableArea: [...new Set(tables.map((table) => table.area || "Main Dining"))].join(", "),
          tableNumbers: tables.map((table) => table.tableNumber),
          tableAreas: tables.map((table) => table.area || "Main Dining"),
          requiredTableCount: availability.requiredTableCount
        },
        items: orderItems,
        subtotal,
        total: subtotal,
        currency: "BDT",
        notes: cleanNotes,
        status: "placed",
        paymentStatus: "unpaid",
        customerSnapshot: {
          name: user.name,
          email: user.email,
          phone: user.phone || ""
        },
        restaurantSnapshot: {
          name: restaurant.name,
          slug: restaurant.slug,
          location: restaurant.location || ""
        },
        statusHistory: [
          {
            status: "placed",
            changedAt: new Date(),
            changedBy: user._id,
            changedByRole: "customer"
          }
        ]
      });

      const reservationDocument = new Reservation({
        _id: reservationId,
        bookingReference: reference,
        userId,
        restaurantId: restaurant._id,
        tableId: tables[0]._id,
        tableIds: tables.map((table) => table._id),
        orderId,
        reservationDate: dining.reservationDate,
        timeSlot: dining.timeSlot,
        guestCount: dining.guestCount,
        status: "pending",
        heldUntil: new Date(Date.now() + 15 * 60 * 1000),
        paymentStatus: "unpaid",
        reservationKey: `${tables[0]._id}:${dining.reservationDate}:${dining.timeSlot}`,
        reservationKeys: tables.map((table) => `${table._id}:${dining.reservationDate}:${dining.timeSlot}`),
        customerSlotKey: `${userId}:${restaurant._id}:${dining.reservationDate}:${dining.timeSlot}`
      });

      await reservationDocument.save({ session });
      await order.save({ session });
      cart.restaurantId = null;
      cart.items = [];
      await cart.save({ session });
      createdOrderId = order._id;
    });
  } catch (error) {
    if (error?.code === 11000 && (error?.keyPattern?.reservationKey || error?.keyPattern?.reservationKeys || error?.keyPattern?.customerSlotKey)) {
      const conflict = new Error("That table or reservation time was just taken. Please choose another time.");
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  } finally {
    await session.endSession();
  }

  const created = await getCustomerOrderById(userId, createdOrderId);
  await Promise.all([
    createNotification({ recipientUserId: userId, restaurantId: created.restaurantId?._id || created.restaurantId, type: "order_status", title: "Reservation payment required", message: "Your order " + created.orderNumber + " and table are held temporarily. Complete payment to confirm.", href: "/dashboard/orders" }),
    notifyRestaurantAdmins(created.restaurantId?._id || created.restaurantId, { type: "order_status", title: "Reservation awaiting payment", message: "A guest started " + created.orderNumber + ". Fulfilment remains locked until payment is verified.", href: "/restaurant-admin/orders" })
  ]);
  return created;
}

export async function listCustomerOrders(userId) {
  const orders = await Order.find({ userId })
    .populate("restaurantId", "name slug location coverImageUrl")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return orders.map(sanitizeCustomerOrder);
}

export async function cancelCustomerOrder(userId, orderId) {
  objectId(orderId, "order id");

  const updated = await Order.findOneAndUpdate(
    {
      _id: orderId,
      userId,
      status: "placed",
      paymentStatus: mongoose.trusted({ $in: ["unpaid", "failed"] })
    },
    {
      $set: { status: "cancelled" },
      $push: {
        statusHistory: {
          status: "cancelled",
          changedAt: new Date(),
          changedBy: userId,
          changedByRole: "customer"
        }
      }
    },
    { new: true, runValidators: true }
  ).select("_id");

  if (!updated) {
    const exists = await Order.exists({ _id: orderId, userId });
    const error = new Error(
      exists
        ? "This order changed and can no longer be cancelled from the Customer dashboard."
        : "Order not found."
    );
    error.status = exists ? 409 : 404;
    throw error;
  }

  await Reservation.updateOne(
    { orderId: updated._id, userId, status: mongoose.trusted({ $in: ["pending", "confirmed"] }) },
    {
      $set: { status: "cancelled" },
      $unset: { reservationKey: 1, reservationKeys: 1, customerSlotKey: 1 }
    }
  );

  return getCustomerOrderById(userId, orderId);
}

export async function listRestaurantOrders(restaurantId, { status = "" } = {}) {
  const query = { restaurantId };
  if (status) {
    if (!ORDER_STATUSES.includes(status)) {
      const error = new Error("Invalid order status filter.");
      error.status = 400;
      throw error;
    }
    query.status = status;
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .limit(250)
    .lean();

  return orders.map(sanitizeRestaurantOrder);
}

export async function updateRestaurantOrderStatus({
  restaurantId,
  orderId,
  nextStatus,
  actorUserId
}) {
  objectId(orderId, "order id");
  const status = String(nextStatus || "").trim().toLowerCase();
  if (!ORDER_STATUSES.includes(status)) {
    const error = new Error("Invalid order status.");
    error.status = 400;
    throw error;
  }

  const current = await Order.findOne({ _id: orderId, restaurantId })
    .select("_id status paymentStatus")
    .lean();

  if (!current) {
    const error = new Error("Order not found for this Restaurant.");
    error.status = 404;
    throw error;
  }

  if (!ADMIN_TRANSITIONS[current.status]?.includes(status)) {
    const error = new Error(`Order cannot move from ${current.status} to ${status}.`);
    error.status = 409;
    throw error;
  }

  if (status !== "cancelled" && current.paymentStatus !== "paid") {
    const error = new Error(
      "Restaurant fulfilment can advance only after SSLCOMMERZ payment is verified."
    );
    error.status = 409;
    throw error;
  }

  if (
    status === "cancelled" &&
    !["unpaid", "failed"].includes(current.paymentStatus)
  ) {
    const error = new Error(
      current.paymentStatus === "paid"
        ? "Paid-order cancellation requires a verified refund workflow."
        : "This Order has an active/pending payment and cannot be cancelled yet."
    );
    error.status = 409;
    throw error;
  }

  const filter = {
    _id: orderId,
    restaurantId,
    status: current.status
  };
  if (status === "cancelled") {
    filter.paymentStatus = mongoose.trusted({ $in: ["unpaid", "failed"] });
  } else {
    filter.paymentStatus = "paid";
  }

  const order = await Order.findOneAndUpdate(
    filter,
    {
      $set: { status },
      $push: {
        statusHistory: {
          status,
          changedAt: new Date(),
          changedBy: actorUserId,
          changedByRole: "restaurant_admin"
        }
      }
    },
    { new: true, runValidators: true }
  ).lean();

  if (!order) {
    const error = new Error(
      "The order changed while you were updating it. Refresh the queue and try again."
    );
    error.status = 409;
    throw error;
  }

  await createNotification({
    recipientUserId: order.userId,
    restaurantId: order.restaurantId,
    type: "order_status",
    title: `Order ${status}`,
    message: `Your order ${order.orderNumber} is now ${status}.`,
    href: "/dashboard/orders"
  });

  return sanitizeRestaurantOrder(order);
}

export async function countCustomerOrderStats(userId) {
  const [totalOrders, activeOrders] = await Promise.all([
    Order.countDocuments({ userId }),
    Order.countDocuments({
      userId,
      status: mongoose.trusted({ $in: ["placed", "confirmed", "preparing", "ready"] })
    })
  ]);
  return { totalOrders, activeOrders };
}

export async function countRestaurantOrderStats(restaurantId) {
  const [orders, activeOrders] = await Promise.all([
    Order.countDocuments({ restaurantId }),
    Order.countDocuments({
      restaurantId,
      status: mongoose.trusted({ $in: ["placed", "confirmed", "preparing", "ready"] })
    })
  ]);
  return { orders, activeOrders };
}
