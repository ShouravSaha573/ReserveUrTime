import { motion, useReducedMotion } from "motion/react";
import AddToCartButton from "../AddToCartButton";

export default function PublicMenuItem({ item, fallbackImage = "" }) {
  const reduced = useReducedMotion();
  const image = item.imageUrl || item.threeD?.posterUrl || fallbackImage;
  const category = item.categoryId?.name || "Menu";

  return (
    <motion.article
      className="public-menu-item group grid gap-6 border-t border-white/10 py-7 md:grid-cols-[minmax(0,1fr)_13rem] md:items-center md:py-9"
      initial={reduced ? false : { opacity: 0, y: 26 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: reduced ? 0 : 0.72, ease: [0.22, 1, 0.36, 1] }}
      layout
    >
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[.68rem] uppercase tracking-[.28em] text-white/35">{category}</p>
            <h3 className="mt-3 font-display text-3xl leading-none md:text-4xl">{item.name}</h3>
          </div>
          <motion.p
            className="font-display text-2xl text-[#f3efe6] md:text-3xl"
            initial={false}
            whileHover={reduced ? undefined : { y: -2, scale: 1.02 }}
          >
            ৳{Number(item.price || 0).toLocaleString("en-BD")}
          </motion.p>
        </div>

        {item.description && <p className="mt-5 max-w-2xl leading-7 text-white/55">{item.description}</p>}
        {item.ingredients?.length > 0 && <p className="mt-4 text-sm leading-6 text-white/38">{item.ingredients.join(" · ")}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <AddToCartButton menuItemId={item._id} />
        </div>
      </div>

      {image && (
        <div className="public-menu-thumb relative grid min-h-48 place-items-center overflow-visible">
          <motion.div
            className="relative grid min-h-48 w-full place-items-center overflow-visible"
            whileHover={reduced ? undefined : { y: -7, rotate: -1.2, scale: 1.025 }}
            transition={{ type: "spring", stiffness: 170, damping: 20 }}
          >
            <div className="absolute bottom-5 h-8 w-28 rounded-full bg-black/55 blur-xl" aria-hidden="true" />
            <img
              src={image}
              alt={item.name}
              loading="lazy"
              className="restaurant-menu-image relative z-10 h-44 w-44 object-contain"
            />
          </motion.div>
        </div>
      )}
    </motion.article>
  );
}
