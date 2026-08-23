export const DEFAULT_SITE_CONTENT = {
  siteKey: "homepage",
  brand: {
    name: "ReserveUrTime",
    homeLabel: "Home",
    restaurantsLabel: "Restaurants",
    customerLoginLabel: "Login",
    customerRegisterLabel: "Register"
  },
  hero: {
    enabled: true,
    eyebrow: "MULTI-RESTAURANT DINING PLATFORM",
    title: "Discover dining",
    titleAccent: "beyond ordinary.",
    body:
      "Browse publicly. Login only when you want to reserve a table or use personal customer features.",
    browseCtaLabel: "Browse all restaurants",
    browseCtaPath: "/restaurants",
    registerCtaLabel: "Create customer account",
    registerCtaPath: "/customer/register",
    searchEnabled: true,
    searchPlaceholder: "Search a restaurant or cuisine...",
    mediaUrl: ""
  },
  restaurantsSection: {
    enabled: true,
    eyebrow: "Selected destinations",
    title: "Our restaurants",
    viewAllLabel: "View all →",
    viewAllPath: "/restaurants",
    featuredLimit: 3
  },
  footer: {
    text: "Reserve your Pleasant Time with a Comfy Table - ReserveUrTime"
  },
  galaxy: {
    enabled: true,
    density: "medium",
    movement: "subtle",
    shineIntervalMs: 3000,
    glowIntensity: "medium"
  },
  sectionOrder: ["hero", "restaurants"]
};
