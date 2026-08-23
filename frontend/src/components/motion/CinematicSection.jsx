import { motion, useReducedMotion } from "motion/react";

const DIRECTIONS = {
  up: { x: 0, y: 30 },
  down: { x: 0, y: -24 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 }
};

export default function CinematicSection({
  children,
  className = "",
  as = "section",
  delay = 0,
  direction = "up",
  amount = 0.12,
  once = true
}) {
  const reduced = useReducedMotion();
  const Component = motion[as] || motion.section;
  const offset = DIRECTIONS[direction] || DIRECTIONS.up;

  return (
    <Component
      className={className}
      initial={reduced ? false : { opacity: 0, ...offset, filter: "blur(10px)" }}
      whileInView={reduced ? undefined : { opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount }}
      transition={{ duration: reduced ? 0 : 0.82, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}
