import { useEffect, useRef } from "react";

export default function MouseGlow() {
  const ref = useRef(null);

  useEffect(() => {
    const motionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    const pointerQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    );

    const current = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 3
    };

    const target = { ...current };
    let frame = null;

    function canAnimate() {
      return !motionQuery.matches && pointerQuery.matches;
    }

    function onMove(event) {
      target.x = event.clientX;
      target.y = event.clientY;

      if (frame === null) {
        frame = requestAnimationFrame(animate);
      }
    }

    function animate() {
      current.x += (target.x - current.x) * 0.12;
      current.y += (target.y - current.y) * 0.12;

      if (ref.current) {
        ref.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
      }

      const distanceX = target.x - current.x;
      const distanceY = target.y - current.y;

      if (Math.abs(distanceX) > 0.1 || Math.abs(distanceY) > 0.1) {
        frame = requestAnimationFrame(animate);
      } else {
        current.x = target.x;
        current.y = target.y;
        frame = null;
      }
    }

    function stop() {
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      window.removeEventListener("pointermove", onMove);
    }

    function syncInteraction() {
      stop();

      if (canAnimate()) {
        window.addEventListener("pointermove", onMove, {
          passive: true
        });
      }
    }

    syncInteraction();
    motionQuery.addEventListener("change", syncInteraction);
    pointerQuery.addEventListener("change", syncInteraction);

    return () => {
      stop();
      motionQuery.removeEventListener("change", syncInteraction);
      pointerQuery.removeEventListener("change", syncInteraction);
    };
  }, []);

  return <div ref={ref} className="mouse-glow" />;
}
