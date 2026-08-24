import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { apiFetch } from "../lib/api";

export const DEFAULT_SITE_CONTENT = {
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
    searchPlaceholder: "Search restaurants, food, categories or locations...",
    mediaUrl: ""
  },
  restaurantsSection: {
    enabled: true,
    eyebrow: "Selected destinations",
    title: "Our restaurants",
    viewAllLabel: "View all",
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

const SiteContentContext = createContext(null);

function mergeSiteContent(content) {
  if (!content) return DEFAULT_SITE_CONTENT;
  return {
    ...DEFAULT_SITE_CONTENT,
    ...content,
    brand: { ...DEFAULT_SITE_CONTENT.brand, ...(content.brand || {}) },
    hero: { ...DEFAULT_SITE_CONTENT.hero, ...(content.hero || {}), enabled: true },
    restaurantsSection: {
      ...DEFAULT_SITE_CONTENT.restaurantsSection,
      ...(content.restaurantsSection || {})
    },
    footer: { ...DEFAULT_SITE_CONTENT.footer, ...(content.footer || {}) },
    galaxy: { ...DEFAULT_SITE_CONTENT.galaxy, ...(content.galaxy || {}) },
    sectionOrder: [...DEFAULT_SITE_CONTENT.sectionOrder]
  };
}

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);

  const refreshSiteContent = useCallback(async () => {
    try {
      const data = await apiFetch("/site/homepage", {
        retryGet: true
      });
      setContent(mergeSiteContent(data.content));
    } catch {
      // Public content keeps safe local defaults if the CMS API is temporarily
      // unavailable, so the homepage never becomes blank.
      setContent((current) => current || DEFAULT_SITE_CONTENT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSiteContent();
  }, [refreshSiteContent]);

  const value = useMemo(
    () => ({
      content,
      loading,
      refreshSiteContent,
      setContent: (next) => setContent(mergeSiteContent(next))
    }),
    [content, loading, refreshSiteContent]
  );

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error("useSiteContent must be used inside SiteContentProvider.");
  }
  return context;
}
