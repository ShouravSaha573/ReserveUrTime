import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, useInView, useTransform } from "motion/react";
import { useRef } from "react";

const FOOD_IMAGES = {
  burger: "/hero-assets/burger-photoreal-v2.png",
  pizza: "/hero-assets/pizza-photoreal-v2.png",
  momo: "/hero-assets/momo-photoreal-v2.png",
  kebab: "/hero-assets/kebab-photoreal-v2.png"
};

const INGREDIENTS = {
  burger: ["sesame", "herb", "sesame", "pepper", "onion", "sesame", "herb", "pepper", "sesame", "onion", "herb", "sesame", "pepper", "sesame", "herb", "onion", "sesame", "pepper"],
  pizza: ["basil", "chili", "cheese", "pepper", "basil", "chili", "cheese", "basil", "pepper", "chili", "cheese", "basil", "chili", "pepper", "basil", "cheese", "chili", "basil"],
  momo: ["masala", "steam", "chili", "masala", "steam", "herb", "masala", "chili", "steam", "masala", "herb", "steam", "chili", "masala", "steam", "herb", "masala", "steam"],
  kebab: ["ember", "masala", "herb", "ember", "pepper", "masala", "ember", "herb", "pepper", "ember", "masala", "herb", "ember", "pepper", "masala", "ember", "herb", "ember"]
};

function IngredientAtmosphere({ variant }) {
  return (
    <div className={`food3d-ingredients ingredients-${variant}`} aria-hidden="true">
      <span className="food3d-ingredient-aura" />
      <span className="food3d-ingredient-ring ring-near" />
      <span className="food3d-ingredient-ring ring-far" />
      {(INGREDIENTS[variant] || INGREDIENTS.burger).map((kind, index) => (
        <i
          className={`ingredient-${kind}`}
          key={`${kind}-${index}`}
          style={{
            "--n": index,
            "--ix": `${8 + ((index * 37) % 84)}%`,
            "--iy": `${10 + ((index * 53) % 76)}%`,
            "--depth": (index % 4) + 1
          }}
        />
      ))}
    </div>
  );
}

export default function PhotorealFoodHero({ variant, title }) {
  const reduced = useReducedMotion();
  const photoRef = useRef(null);
  const visible = useInView(photoRef, { margin: "200px 0px" });
  const src = FOOD_IMAGES[variant] || FOOD_IMAGES.burger;
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const idleYaw = useMotionValue(0);
  const dragYaw = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 95, damping: 18, mass: .7 });
  const smoothY = useSpring(pointerY, { stiffness: 95, damping: 18, mass: .7 });
  const rotateX = useTransform(smoothY, [-1, 1], [10, -10]);
  const pointerYaw = useTransform(smoothX, [-1, 1], [-15, 15]);
  const rotateY = useTransform(() => pointerYaw.get() + idleYaw.get() + dragYaw.get());
  const sheenX = useTransform(smoothX, [-1, 1], ["-35%", "35%"]);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, yaw: 0 });

  useAnimationFrame((time) => {
    if (!visible) return;
    if (!reduced && !dragging.current) idleYaw.set(Math.sin(time / 1900) * 5.5);
  });

  const updatePointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2)));
    pointerY.set(Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2)));
    if (dragging.current) dragYaw.set(Math.max(-22, Math.min(22, dragStart.current.yaw + (event.clientX - dragStart.current.x) * .12)));
  };

  const startDrag = (event) => {
    dragging.current = true;
    dragStart.current = { x: event.clientX, yaw: dragYaw.get() };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const stopDrag = (event) => {
    const wasDragging = dragging.current;
    dragging.current = false;
    if (wasDragging && event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <motion.div
      ref={photoRef}
      className={`food3d-photo food3d-photo-${variant}`}
      role="img"
      aria-label={`${title} photoreal animated food showcase`}
      initial={reduced ? false : { opacity: 0, scale: .82, y: 30, filter: "blur(14px)" }}
      whileInView={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: .35 }}
      transition={{ duration: reduced ? 0 : 1.05, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX, rotateY }}
      onPointerMove={updatePointer}
      onPointerDown={startDrag}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onPointerLeave={(event) => {
        if (!dragging.current) { pointerX.set(0); pointerY.set(0); }
        stopDrag(event);
      }}
    >
      <div className={`food3d-smoke smoke-${variant}`} aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => <i key={index} style={{ "--smoke": index }} />)}
      </div>
      <IngredientAtmosphere variant={variant} />
      <img className="food3d-photo-depth food3d-photo-depth-back" src={src} alt="" aria-hidden="true" draggable="false" loading="lazy" decoding="async" />
      <img className="food3d-photo-depth food3d-photo-depth-mid" src={src} alt="" aria-hidden="true" draggable="false" loading="lazy" decoding="async" />
      <img className="food3d-photo-main" src={src} alt="" draggable="false" loading="lazy" decoding="async" />
      <motion.span className="food3d-photo-sheen" style={{ x: sheenX }} aria-hidden="true" />
    </motion.div>
  );
}
