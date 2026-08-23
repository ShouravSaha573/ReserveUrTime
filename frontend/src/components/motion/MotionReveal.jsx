import { motion, useReducedMotion } from "motion/react";

export default function MotionReveal({ children, className = "", delay = 0, as = "div" }) {
  const reduced = useReducedMotion();
  const Component = motion[as] || motion.div;

  return (
    <Component
      className={className}
      initial={reduced ? false : { opacity: 0, y: 22, filter: "blur(8px)" }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}
