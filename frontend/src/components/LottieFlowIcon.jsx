import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import lottie from "lottie-web/build/player/lottie_light";
import arrow from "../assets/lottieflow/arrow.json";
import cart from "../assets/lottieflow/cart.json";
import favourite from "../assets/lottieflow/favourite.json";
import notification from "../assets/lottieflow/notification.json";
import search from "../assets/lottieflow/search.json";
import success from "../assets/lottieflow/success.json";

const animations = { arrow, cart, favourite, notification, search, success };

export default function LottieFlowIcon({ name, className = "", loop = false }) {
  const containerRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: reduced ? false : loop,
      autoplay: !reduced,
      animationData: structuredClone(animations[name] || success)
    });
    if (reduced) animation.goToAndStop(0, true);
    return () => animation.destroy();
  }, [loop, name, reduced]);

  return (
    <span
      ref={containerRef}
      className={`lottieflow-icon ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
