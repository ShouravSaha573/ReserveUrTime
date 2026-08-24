import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import LottieFlowIcon from "./LottieFlowIcon";

export default function RestaurantCard({ restaurant, index = 0 }) {
  const reduced = useReducedMotion();

  return (
    <motion.article
      className="restaurant-card group overflow-hidden border-t border-white/10 py-8 md:grid md:grid-cols-[1fr_1.15fr] md:gap-10 md:py-12"
      initial={reduced ? false : { opacity: 0, y: 34, filter: "blur(8px)" }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: reduced ? 0 : 0.78, delay: reduced ? 0 : Math.min(index, 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col justify-between gap-10 py-2 md:py-5">
        <div>
          <motion.p
            className="mb-5 text-xs tracking-[.3em] text-white/40"
            initial={false}
            whileHover={reduced ? undefined : { x: 3 }}
          >
            {String(index + 1).padStart(2, "0")}
          </motion.p>
          <h2 className="font-display text-4xl md:text-6xl">{restaurant.name}</h2>
          <p className="mt-3 text-sm uppercase tracking-[.18em] text-white/45">
            {restaurant.cuisine} · {restaurant.location}
          </p>
          <p className="mt-6 max-w-xl leading-7 text-white/60">{restaurant.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to={`/restaurant/${restaurant.slug}`} className="cinematic-text-link inline-flex items-center gap-3 text-sm uppercase tracking-[.18em] text-[#f3efe6]">
            Explore restaurant <LottieFlowIcon name="arrow" className="arrow" />
          </Link>
        </div>
      </div>

      <motion.div
        className="restaurant-card-media mt-8 overflow-hidden rounded-[1.75rem] border border-white/10 md:mt-0"
        whileHover={reduced ? undefined : { y: -4, rotateX: 0.8, rotateY: -0.8 }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
      >
        <img src={restaurant.coverImageUrl} alt="" loading="lazy" className="aspect-[16/10] h-full w-full object-cover" />
        <span className="restaurant-card-sheen" aria-hidden="true" />
      </motion.div>
    </motion.article>
  );
}
