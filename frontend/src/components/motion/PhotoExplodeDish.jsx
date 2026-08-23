import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";

const EASING = {
  cinematic: [0.22, 1, 0.36, 1],
  soft: [0.25, 0.1, 0.25, 1],
  snappy: [0.34, 1.56, 0.64, 1]
};

const DEFAULTS = {
  enabled: true,
  layerCount: 8,
  gap: 18,
  depth: 36,
  tilt: 2.5,
  duration: 0.9,
  stagger: 0.04,
  easing: "cinematic",
  autoPreview: false
};

function transitionFor(config, index, count, exploded, reduced) {
  if (reduced) return { duration: 0 };
  if (config.easing === "spring") {
    return {
      type: "spring",
      stiffness: 105,
      damping: 20,
      mass: 0.82,
      delay: (exploded ? index : count - index - 1) * config.stagger
    };
  }
  return {
    duration: config.duration,
    ease: EASING[config.easing] || EASING.cinematic,
    delay: (exploded ? index : count - index - 1) * config.stagger
  };
}

export default function PhotoExplodeDish({
  imageUrl,
  alt = "",
  config = {},
  className = "",
  controlledExploded,
  onExplodedChange,
  showControl = true
}) {
  const reduced = useReducedMotion();
  const settings = { ...DEFAULTS, ...(config || {}) };
  const [internalExploded, setInternalExploded] = useState(false);
  const exploded = controlledExploded ?? internalExploded;
  const visualExploded = reduced ? false : exploded;
  const layerCount = Math.max(4, Math.min(16, Number(settings.layerCount) || 8));
  const layers = useMemo(() => Array.from({ length: layerCount }, (_, index) => index), [layerCount]);

  function toggle() {
    const next = !exploded;
    if (controlledExploded === undefined) setInternalExploded(next);
    onExplodedChange?.(next);
  }

  if (!imageUrl) return null;

  return (
    <motion.div
      className={`photo-explode-shell ${className}`}
      initial={reduced ? false : { opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduced ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      data-exploded={exploded ? "true" : "false"}
    >
      <div className="photo-explode-stage" aria-label={`${alt || "Dish"} photo explode preview`}>
        <div className="photo-explode-shadow" aria-hidden="true" />
        {layers.map((index) => {
          const top = (index / layerCount) * 100;
          const bottom = 100 - ((index + 1) / layerCount) * 100;
          const delta = index - (layerCount - 1) / 2;
          const direction = delta === 0 ? 0 : delta > 0 ? 1 : -1;
          const magnitude = Math.abs(delta);
          const x = visualExploded ? direction * Math.min(16, magnitude * 2.2) : 0;
          const y = visualExploded ? delta * Number(settings.gap || 18) : 0;
          const z = visualExploded ? magnitude * Number(settings.depth || 36) : 0;
          const rotateX = visualExploded ? delta * Number(settings.tilt || 2.5) : 0;
          const rotateY = visualExploded ? direction * magnitude * 0.9 : 0;
          const scale = visualExploded ? Math.max(0.94, 1 - magnitude * 0.006) : 1;

          return (
            <motion.div
              key={index}
              className="photo-explode-layer"
              aria-hidden="true"
              style={{
                zIndex: layerCount - index,
                clipPath: `inset(${top}% 0 ${bottom}% 0)`
              }}
              initial={false}
              animate={{ x, y, z, rotateX, rotateY, scale }}
              transition={transitionFor(settings, index, layerCount, visualExploded, reduced)}
            >
              <img src={imageUrl} alt="" draggable="false" />
            </motion.div>
          );
        })}
        <img src={imageUrl} alt={alt} className="photo-explode-accessible-image" />
        <motion.div
          className="photo-explode-orbit"
          aria-hidden="true"
          animate={reduced ? undefined : { rotate: visualExploded ? 180 : 0, opacity: visualExploded ? 0.55 : 0.18 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {showControl && (
        <button type="button" className="photo-explode-toggle" onClick={toggle} aria-pressed={exploded}>
          <span aria-hidden="true">{exploded ? "◉" : "◎"}</span>
          {exploded ? "Assemble image" : "Explode image"}
        </button>
      )}
    </motion.div>
  );
}
