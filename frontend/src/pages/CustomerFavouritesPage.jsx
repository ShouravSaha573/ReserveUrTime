import { Link } from "react-router-dom";
import CustomerDashboardNav from "../components/CustomerDashboardNav";
import PageMessage from "../components/PageMessage";
import { useFavorites } from "../context/FavoritesContext";

export default function CustomerFavouritesPage() {
  const { restaurants, dishes, loading, error } = useFavorites();
  const empty = !loading && restaurants.length === 0 && dishes.length === 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-14 md:px-8 md:py-20">
      <p className="text-xs uppercase tracking-[.3em] text-white/35">Customer dashboard</p>
      <h1 className="mt-5 font-display text-5xl md:text-7xl">Favourites</h1>
      <p className="mt-5 max-w-2xl leading-7 text-white/50">
        Your saved Restaurants and dishes stay linked to the live public menu, so unavailable or removed items are never presented as bookable choices.
      </p>

      <CustomerDashboardNav />

      {loading && <p className="mt-10 text-white/45">Loading favourites…</p>}
      {error && <div className="mt-8 rounded-2xl bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      {empty && (
        <PageMessage
          title="Nothing saved yet"
          message="Use the heart/save control on Restaurants and menu dishes to build your favourites."
          action={<Link to="/restaurants" className="btn-primary">Explore Restaurants</Link>}
        />
      )}

      {restaurants.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-5">
            <h2 className="font-display text-4xl">Saved Restaurants</h2>
            <span className="text-xs uppercase tracking-[.2em] text-white/30">{restaurants.length}</span>
          </div>
          <div className="customer-favourite-grid">
            {restaurants.map(({ restaurant }) => (
              <article key={restaurant._id} className="customer-favourite-card">
                <div className="customer-favourite-media">
                  <img src={restaurant.coverImageUrl} alt="" loading="lazy" />
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[.2em] text-white/35">{restaurant.cuisine}</p>
                  <h3 className="mt-3 font-display text-3xl">{restaurant.name}</h3>
                  <p className="mt-2 text-sm text-white/45">{restaurant.location}</p>
                  <Link to={`/restaurant/${restaurant.slug}`} className="mt-5 inline-flex text-sm text-white/75 hover:text-white">Open Restaurant →</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {dishes.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-5">
            <h2 className="font-display text-4xl">Saved dishes</h2>
            <span className="text-xs uppercase tracking-[.2em] text-white/30">{dishes.length}</span>
          </div>
          <div className="customer-favourite-grid">
            {dishes.map(({ item }) => {
              const image = item.imageUrl || item.threeD?.posterUrl || item.restaurant?.coverImageUrl;
              const dishPath = `/restaurant/${item.restaurant?.slug}/menu`;
              return (
                <article key={item._id} className="customer-favourite-card">
                  <div className="customer-favourite-media">
                    {image && <img src={image} alt="" loading="lazy" />}
                  </div>
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-[.2em] text-white/35">{item.restaurant?.name} · {item.category?.name || "Menu"}</p>
                    <h3 className="mt-3 font-display text-3xl">{item.name}</h3>
                    <p className="mt-3 text-white/55">৳{Number(item.price || 0).toLocaleString("en-BD")}</p>
                    <Link to={dishPath} className="mt-5 inline-flex text-sm text-white/75 hover:text-white">Open dish →</Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
