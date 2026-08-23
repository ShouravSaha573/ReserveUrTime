
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import MouseGlow from "./components/MouseGlow";
import NetworkBanner from "./components/NetworkBanner";
import FloatingCartButton from "./components/FloatingCartButton";
import ProtectedRoute from "./components/ProtectedRoute";
import CinematicChrome from "./components/motion/CinematicChrome";
import { useSiteContent } from "./context/SiteContentContext";

const GalaxyBackground = lazy(() => import("./components/visual/GalaxyBackground"));
const page = (name) => lazy(() => import(`./pages/${name}.jsx`));
const HomePage = page("HomePage");
const RestaurantsPage = page("RestaurantsPage");
const RestaurantDetailPage = page("RestaurantDetailPage");
const RestaurantMenuPage = page("RestaurantMenuPage");
const CustomerRegisterPage = page("CustomerRegisterPage");
const CustomerLoginPage = page("CustomerLoginPage");
const CustomerFavouritesPage = page("CustomerFavouritesPage");
const CustomerProfilePage = page("CustomerProfilePage");
const CustomerCartPage = page("CustomerCartPage");
const CustomerOrdersPage = page("CustomerOrdersPage");
const ReservePage = page("ReservePage");
const ReservationResultPage = page("ReservationResultPage");
const MyReservationsPage = page("MyReservationsPage");
const PlatformAdminLoginPage = page("PlatformAdminLoginPage");
const PlatformAdminDashboardPage = page("PlatformAdminDashboardPage");
const PlatformAdminHomepagePage = page("PlatformAdminHomepagePage");
const RestaurantAdminLoginPage = page("RestaurantAdminLoginPage");
const RestaurantAdminDashboardPage = page("RestaurantAdminDashboardPage");
const RestaurantAdminProfilePage = page("RestaurantAdminProfilePage");
const RestaurantAdminListingRequestsPage = page("RestaurantAdminListingRequestsPage");
const RestaurantAdminMenuPage = page("RestaurantAdminMenuPage");
const RestaurantAdminTablesPage = page("RestaurantAdminTablesPage");
const RestaurantAdminReservationsPage = page("RestaurantAdminReservationsPage");
const RestaurantAdminGalleryPage = page("RestaurantAdminGalleryPage");
const RestaurantAdminOrdersPage = page("RestaurantAdminOrdersPage");
const PlatformAdminChangeRequestsPage = page("PlatformAdminChangeRequestsPage");
const NotFoundPage = page("NotFoundPage");
const ContactPage = page("ContactPage");

function RouteFallback() {
  return <div className="min-h-[55vh]" role="status" aria-label="Loading page" />;
}


export default function App() {
  const { content } = useSiteContent();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#f3efe6]">
      <NetworkBanner />
      <CinematicChrome />
      <Suspense fallback={null}>
        <GalaxyBackground settings={content.galaxy} />
      </Suspense>
      <div
        aria-hidden="true"
        className="hero-grain pointer-events-none fixed inset-0 z-0 opacity-70"
      />
      <MouseGlow />
      <div className="relative z-10">
        <Navbar />
        <FloatingCartButton />

        <div id="main-content" tabIndex="-1" className="route-content-focus">
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/restaurant/:slug" element={<RestaurantDetailPage />} />
          <Route path="/restaurant/:slug/menu" element={<RestaurantMenuPage />} />


          <Route path="/contact" element={<ContactPage />} />

          <Route path="/customer/register" element={<CustomerRegisterPage />} />
          <Route path="/customer/login" element={<CustomerLoginPage />} />

          <Route
            path="/reserve/:restaurantId"
            element={<ReservePage />}
          />
          <Route path="/reservation-result" element={<ReservationResultPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="customer" loginPath="/customer/login">
                <Navigate to="/dashboard/orders" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/favourites"
            element={
              <ProtectedRoute role="customer" loginPath="/customer/login">
                <CustomerFavouritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/cart"
            element={
              <ProtectedRoute role="customer" loginPath="/customer/login">
                <CustomerCartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/orders"
            element={
              <ProtectedRoute role="customer" loginPath="/customer/login">
                <CustomerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute role="customer" loginPath="/customer/login">
                <CustomerProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/reservations"
            element={
              <ProtectedRoute role="customer" loginPath="/customer/login">
                <MyReservationsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/platform-admin/login" element={<PlatformAdminLoginPage />} />
          <Route
            path="/platform-admin/dashboard"
            element={
              <ProtectedRoute
                role="platform_admin"
                loginPath="/platform-admin/login"
              >
                <PlatformAdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform-admin/homepage"
            element={
              <ProtectedRoute
                role="platform_admin"
                loginPath="/platform-admin/login"
              >
                <PlatformAdminHomepagePage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/platform-admin/change-requests"
            element={
              <ProtectedRoute
                role="platform_admin"
                loginPath="/platform-admin/login"
              >
                <PlatformAdminChangeRequestsPage />
              </ProtectedRoute>
            }
          />


          <Route path="/restaurant-admin/login" element={<RestaurantAdminLoginPage />} />
          <Route
            path="/restaurant-admin/dashboard"
            element={
              <ProtectedRoute
                role="restaurant_admin"
                loginPath="/restaurant-admin/login"
              >
                <RestaurantAdminDashboardPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/restaurant-admin/profile"
            element={
              <ProtectedRoute
                role="restaurant_admin"
                loginPath="/restaurant-admin/login"
              >
                <RestaurantAdminProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/restaurant-admin/menu"
            element={
              <ProtectedRoute
                role="restaurant_admin"
                loginPath="/restaurant-admin/login"
              >
                <RestaurantAdminMenuPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/restaurant-admin/tables"
            element={
              <ProtectedRoute
                role="restaurant_admin"
                loginPath="/restaurant-admin/login"
              >
                <RestaurantAdminTablesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurant-admin/orders"
            element={
              <ProtectedRoute
                role="restaurant_admin"
                loginPath="/restaurant-admin/login"
              >
                <RestaurantAdminOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurant-admin/reservations"
            element={
              <ProtectedRoute
                role="restaurant_admin"
                loginPath="/restaurant-admin/login"
              >
                <RestaurantAdminReservationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurant-admin/gallery"
            element={
              <ProtectedRoute
                role="restaurant_admin"
                loginPath="/restaurant-admin/login"
              >
                <RestaurantAdminGalleryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurant-admin/listing-requests"
            element={
              <ProtectedRoute
                role="restaurant_admin"
                loginPath="/restaurant-admin/login"
              >
                <RestaurantAdminListingRequestsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        </div>

        <footer className="footer-glow border-t border-white/10 px-6 py-10 text-center text-xs tracking-[.14em]">
          {content.footer.text}
        </footer>
      </div>
    </div>
  );
}
