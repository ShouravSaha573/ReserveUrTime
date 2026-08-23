import assert from "node:assert/strict";
import {
  requireManagedRestaurant,
  requirePlatformAdmin,
  requireRestaurantAdmin
} from "../middleware/auth.js";

function callMiddleware(middleware, req) {
  let nextCalled = false;
  let statusCode = 200;
  let body = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    }
  };

  middleware(req, res, () => {
    nextCalled = true;
  });

  return { nextCalled, statusCode, body, req };
}

const restaurantA = "64b000000000000000000001";
const restaurantB = "64b000000000000000000002";

let result = callMiddleware(requirePlatformAdmin, {
  user: { role: "platform_admin" }
});
assert.equal(result.nextCalled, true);

result = callMiddleware(requirePlatformAdmin, {
  user: { role: "restaurant_admin", restaurantId: restaurantA }
});
assert.equal(result.statusCode, 403);
assert.equal(result.nextCalled, false);

result = callMiddleware(requirePlatformAdmin, {
  user: { role: "customer" }
});
assert.equal(result.statusCode, 403);
assert.equal(result.nextCalled, false);

result = callMiddleware(requireRestaurantAdmin, {
  user: { role: "restaurant_admin", restaurantId: restaurantA }
});
assert.equal(result.nextCalled, true);
assert.equal(String(result.req.managedRestaurantId), restaurantA);

result = callMiddleware(requireRestaurantAdmin, {
  user: { role: "restaurant_admin", restaurantId: null }
});
assert.equal(result.statusCode, 403);
assert.equal(result.nextCalled, false);

result = callMiddleware(requireRestaurantAdmin, {
  user: { role: "customer", restaurantId: null }
});
assert.equal(result.statusCode, 403);
assert.equal(result.nextCalled, false);

result = callMiddleware(requireManagedRestaurant, {
  user: { role: "restaurant_admin", restaurantId: restaurantA },
  params: { restaurantId: restaurantA },
  body: {}
});
assert.equal(result.nextCalled, true);

result = callMiddleware(requireManagedRestaurant, {
  user: { role: "restaurant_admin", restaurantId: restaurantA },
  params: { restaurantId: restaurantB },
  body: {}
});
assert.equal(result.statusCode, 403);
assert.equal(result.nextCalled, false);

result = callMiddleware(requireManagedRestaurant, {
  user: { role: "platform_admin", restaurantId: null },
  params: { restaurantId: restaurantA },
  body: {}
});
assert.equal(result.statusCode, 403);
assert.equal(result.nextCalled, false);

console.log("Phase 1 RBAC smoke tests passed.");
