import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import "@google/model-viewer";
import GalaxyRestaurantSearch from "./GalaxyRestaurantSearch";
import PhotorealFoodHero from "./motion/PhotorealFoodHero";

const SODA = {
  leaves: "/hero-assets/soda/leaves.glb",
  cherry: "/hero-assets/soda/cherry.glb",
  blueberry: "/hero-assets/soda/blueberry.glb",
  can: "/hero-assets/soda/diet-soda.glb",
  greenCard: "/hero-assets/soda/green-soda.png",
  blueCard: "/hero-assets/soda/blue-soda.png",
  greenTexture: "/hero-assets/mojo-green-bangladesh-v3.png",
  blueTexture: "/hero-assets/mojo-blue-bangladesh-v3.png"
};

const FOOD_HEROES = [
  {
    id: "burger-hero",
    variant: "burger",
    dishName: "Burger",
    categories: ["Fast Food", "Burger"],
    index: "02",
    eyebrow: "RESERVEURTIME / FIRE-GRILLED FAVORITES",
    title: ["Stacked", "to", "satisfy"],
    body: "A premium burger experience built around char, melt and a perfectly balanced bite.",
    cta: "Find a table",
    badgeTitle: "SIGNATURE HERO",
    badgeText: "GOURMET BURGER EXPERIENCE",
    rightTitle: ["Boldly", "Layered"],
    themes: [
      { name: "Charred Classic", note: "Fire & brioche", inner: "#7a3419", mid: "#2e130c", outer: "#090503", accent: "#f8e8ce" },
      { name: "Smoked Cheese", note: "Melt & smoke", inner: "#8b5f16", mid: "#3a2208", outer: "#0b0702", accent: "#f6e1ae" }
    ],
    particle: "dust"
  },
  {
    id: "pizza-hero",
    variant: "pizza",
    dishName: "Pizza",
    categories: ["Italian", "Pizza"],
    index: "03",
    eyebrow: "RESERVEURTIME / WOOD-FIRED MOMENTS",
    title: ["Heat", "meets", "craft"],
    body: "Stone, flame and a slow melt — an artisan pizza moment built for the table.",
    cta: "Explore restaurants",
    badgeTitle: "OVEN FEATURE",
    badgeText: "ARTISAN PIZZA",
    rightTitle: ["Fired", "Beautifully"],
    themes: [
      { name: "Wood-Fired Classic", note: "Tomato & basil", inner: "#7d2114", mid: "#3b0f0b", outer: "#080303", accent: "#fff0d9" },
      { name: "Truffle White", note: "Earth & melt", inner: "#6d5c31", mid: "#2d2514", outer: "#080703", accent: "#f6e8c5" }
    ],
    particle: "flour"
  },
  {
    id: "momo-hero",
    variant: "momo",
    dishName: "Momo",
    categories: ["Nepali", "Momo"],
    index: "04",
    eyebrow: "RESERVEURTIME / STEAMED BY HAND",
    title: ["Soft", "warm", "perfect"],
    body: "Hand-folded comfort, rising through steam and spice.",
    cta: "Find momo nearby",
    badgeTitle: "STEAM FEATURE",
    badgeText: "HAND-FOLDED FAVORITE",
    rightTitle: ["Folded", "Fresh"],
    themes: [
      { name: "Steamed Classic", note: "Soft & delicate", inner: "#6b3230", mid: "#2d1116", outer: "#080405", accent: "#f6e6d6" },
      { name: "Chili Seared", note: "Heat & spice", inner: "#8e2a1d", mid: "#3b0d0a", outer: "#090302", accent: "#f5d4c8" }
    ],
    particle: "steam"
  },
  {
    id: "kebab-hero",
    variant: "kebab",
    dishName: "Kebab",
    categories: ["Arabic", "Kebab"],
    index: "05",
    eyebrow: "RESERVEURTIME / OVER LIVE FIRE",
    title: ["Charred", "just", "right"],
    body: "Smoke, glaze and fire-kissed flavor — brought into focus before the first bite.",
    cta: "Explore grills",
    badgeTitle: "LIVE-FIRE FEATURE",
    badgeText: "SIGNATURE KEBAB",
    rightTitle: ["Fire", "Refined"],
    themes: [
      { name: "Charcoal Classic", note: "Smoke & char", inner: "#6c2d16", mid: "#281008", outer: "#060403", accent: "#f4dfc2" },
      { name: "Herb & Lemon", note: "Fresh & bright", inner: "#59671c", mid: "#222b0c", outer: "#050703", accent: "#ecf1bd" }
    ],
    particle: "ember"
  }
];

function usePointerStage() {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  const onMove = useCallback((event) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.setProperty("--px", x.toFixed(4));
    ref.current.style.setProperty("--py", y.toFixed(4));
  }, [reduced]);

  const onLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.setProperty("--px", "0");
    ref.current.style.setProperty("--py", "0");
  }, []);

  return { ref, onMove, onLeave };
}

function IntroHero({ content }) {
  const reduced = useReducedMotion();
  return (
    <section id="home-intro-hero" className="premium-intro-hero" aria-labelledby="home-intro-title">
      <div className="premium-intro-veil" aria-hidden="true" />
      <motion.div
        className="premium-intro-copy"
        initial={reduced ? false : { opacity: 0, x: -30, filter: "blur(10px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ duration: reduced ? 0 : 0.95, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="premium-food-eyebrow">{content?.hero?.eyebrow || "MULTI-RESTAURANT DINING PLATFORM"}</p>
        <h1 id="home-intro-title" className="premium-intro-title">
          {content?.hero?.title || "Discover dining"}
          <span>{content?.hero?.titleAccent || "beyond ordinary."}</span>
        </h1>
        <p className="premium-intro-body">{content?.hero?.body || "Browse publicly. Login only when you want to reserve a table or use personal customer features."}</p>
        <div className="premium-intro-actions">
          <Link className="btn-primary" to={content?.hero?.browseCtaPath || "/restaurants"}>{content?.hero?.browseCtaLabel || "Browse all restaurants"}</Link>
          <Link className="btn-secondary" to={content?.hero?.registerCtaPath || "/customer/register"}>{content?.hero?.registerCtaLabel || "Create customer account"}</Link>
        </div>
      </motion.div>
      {content?.hero?.searchEnabled !== false && (
        <motion.div
          className="premium-intro-search"
          initial={reduced ? false : { opacity: 0, x: 36, scale: .96, filter: "blur(12px)" }}
          animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : .18, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="premium-food-eyebrow">FIND YOUR TABLE</p>
          <h2>Where would you like to eat?</h2>
          <GalaxyRestaurantSearch placeholder={content?.hero?.searchPlaceholder || "Search a restaurant or cuisine..."} />
        </motion.div>
      )}
    </section>
  );
}

function SodaStyleFoodHero({ config }) {
  const stage = usePointerStage();
  const reduced = useReducedMotion();
  const particlesRef = useRef(null);
  const themeIndex = 0;
  const theme = config.themes[0];

  const searchCategory = (query) => {
    window.dispatchEvent(new CustomEvent("reserveurtime:set-search", { detail: { query } }));
    document.getElementById("home-intro-hero")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  };

  return (
    <section
      id={config.id}
      className={`food3d-hero food3d-${config.variant} theme-${themeIndex}`}
      style={{ "--hero-inner": theme.inner, "--hero-mid": theme.mid, "--hero-outer": theme.outer, "--hero-accent": theme.accent }}
      aria-label={`Premium ${config.variant} 3D hero`}
    >
      <div className="food3d-environment" aria-hidden="true" />
      <div className="food3d-orbits" aria-hidden="true"><i /><i /><i /></div>
      <div ref={particlesRef} className={`food3d-particles particle-${config.particle}`} aria-hidden="true">
        {Array.from({ length: config.variant === "kebab" ? 24 : config.variant === "momo" ? 12 : 18 }, (_, index) => <i key={index} style={{ "--i": index }} />)}
      </div>
      {(config.variant === "momo" || config.variant === "kebab") && (
        <div className={`food3d-vapor food3d-vapor-${config.variant}`} aria-hidden="true">
          {Array.from({ length: config.variant === "kebab" ? 5 : 7 }, (_, index) => <i key={index} style={{ "--i": index }} />)}
        </div>
      )}

      <motion.div
        className="food3d-left"
        initial={reduced ? false : { opacity: 0, x: -28, filter: "blur(9px)" }}
        whileInView={reduced ? undefined : { opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.28 }}
        transition={{ duration: reduced ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="premium-food-eyebrow">FEATURED DISH</p>
        <h2 className="food3d-dish-name">{config.dishName}</h2>
        <div className="food3d-category-list" aria-label={`${config.dishName} categories`}>
          {config.categories.map((category) => (
            <button type="button" key={category} onClick={() => searchCategory(category)}>
              <span>{category}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <div ref={stage.ref} onMouseMove={stage.onMove} onMouseLeave={stage.onLeave} className="food3d-stage">
        <div className="food3d-halo" aria-hidden="true" />
        <div className="food3d-floor-shadow" aria-hidden="true" />
        <div className="food3d-model-parallax">
          <div className="food3d-model-switcher">
            <PhotorealFoodHero variant={config.variant} title={config.themes[0].name} />
          </div>
        </div>
      </div>

      <motion.div
        className="food3d-right"
        initial={reduced ? false : { opacity: 0, x: 24, filter: "blur(9px)" }}
        whileInView={reduced ? undefined : { opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.28 }}
        transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <h3>{config.rightTitle[0]}<br /><span>{config.rightTitle[1]}</span></h3>
      </motion.div>
    </section>
  );
}

function SodaHero() {
  const modelRef = useRef(null);
  const stageRef = useRef(null);
  const berryRefs = useRef([]);
  const reduced = useReducedMotion();
  const [flavor, setFlavor] = useState("classic");
  const [ready, setReady] = useState(false);
  const textures = useRef({ green: null, blue: null });
  const mouse = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const switchSpin = useRef(0);
  const switching = useRef(false);

  const searchCategory = (query) => {
    window.dispatchEvent(new CustomEvent("reserveurtime:set-search", { detail: { query } }));
    document.getElementById("home-intro-hero")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || customElements.get("model-viewer")) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || customElements.get("model-viewer") || document.querySelector("script[data-model-viewer]")) return;
      const script = document.createElement("script");
      script.type = "module";
      script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
      script.dataset.modelViewer = "true";
      document.head.appendChild(script);
      observer.disconnect();
    }, { rootMargin: "1200px 0px" });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const model = modelRef.current;
    const stage = stageRef.current;
    if (!model || !stage) return undefined;

    let raf = 0;
    const onMove = (event) => {
      const rect = stage.getBoundingClientRect();
      mouse.current.x = (event.clientX - rect.left) / rect.width - 0.5;
      mouse.current.y = (event.clientY - rect.top) / rect.height - 0.5;
    };
    const onLeave = () => { mouse.current.x = 0; mouse.current.y = 0; };
    const onLoad = async () => {
      setReady(true);
      try {
        textures.current.blue = await model.createTexture(SODA.blueTexture);
        textures.current.green = await model.createTexture(SODA.greenTexture);
        if (model.model && textures.current.green) {
          model.model.materials.forEach((material) => {
            const slot = material?.pbrMetallicRoughness?.baseColorTexture;
            if (slot) slot.setTexture(textures.current.green);
          });
        }
      } catch { /* base GLB remains visible */ }
    };
    const animate = () => {
      current.current.x += (mouse.current.x - current.current.x) * 0.05;
      current.current.y += (mouse.current.y - current.current.y) * 0.05;
      if (!reduced) {
        model.cameraOrbit = `${current.current.x * 40 + switchSpin.current}deg ${90 + current.current.y * 20}deg 380%`;
        stage.style.setProperty("--soda-x", current.current.x.toFixed(4));
        stage.style.setProperty("--soda-y", current.current.y.toFixed(4));
      }
      raf = requestAnimationFrame(animate);
    };

    model.addEventListener("load", onLoad);
    stage.addEventListener("mousemove", onMove);
    stage.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      model.removeEventListener("load", onLoad);
      stage.removeEventListener("mousemove", onMove);
      stage.removeEventListener("mouseleave", onLeave);
    };
  }, [reduced]);

  const switchFlavor = (nextFlavor) => {
    if (nextFlavor === flavor || switching.current) return;
    setFlavor(nextFlavor);
    const model = modelRef.current;
    if (!model || reduced) return;
    switching.current = true;
    const spinObj = { val: 0, blur: 0 };
    gsap.to(spinObj, {
      val: 360, blur: 15, duration: 0.6, ease: "power2.in",
      onUpdate: () => { switchSpin.current = spinObj.val; model.style.filter = `blur(${spinObj.blur}px)`; },
      onComplete: () => {
        const texture = nextFlavor === "blue" ? textures.current.blue : textures.current.green;
        try {
          if (model.model && texture) {
            model.model.materials.forEach((material) => {
              const slot = material?.pbrMetallicRoughness?.baseColorTexture;
              if (slot) slot.setTexture(texture);
            });
          }
        } catch { /* keep existing material */ }

        berryRefs.current.forEach((berry, index) => {
          if (!berry) return;
          const rect = berry.getBoundingClientRect();
          const stageRect = stageRef.current?.getBoundingClientRect();
          if (!stageRect) return;
          const centerX = stageRect.left + stageRect.width / 2 - (rect.left + rect.width / 2);
          const centerY = stageRect.top + stageRect.height / 2 - (rect.top + rect.height / 2);
          gsap.timeline()
            .to(berry, { x: centerX, y: centerY, scale: 0.1, opacity: 0, duration: 0.5, ease: "power2.in", delay: index * 0.015 })
            .add(() => { berry.src = nextFlavor === "blue" ? SODA.blueberry : SODA.cherry; })
            .to(berry, { x: (Math.random() - 0.5) * 180, y: (Math.random() - 0.5) * 180, scale: 1, opacity: 1, duration: 0.9, ease: "back.out(1.5)" });
        });

        gsap.to(spinObj, {
          val: 720, blur: 0, duration: 1.5, ease: "back.out(0.7)",
          onUpdate: () => { switchSpin.current = spinObj.val; model.style.filter = `blur(${spinObj.blur}px)`; },
          onComplete: () => { switchSpin.current = 0; model.style.filter = "none"; switching.current = false; }
        });
      }
    });
  };

  return (
    <section id="soda-hero" ref={stageRef} className={`premium-soda-hero ${flavor === "blue" ? "is-blue" : ""}`} aria-label="Premium soda hero">
      <div className="premium-soda-left">
        <div className="food3d-section-index"><span>06</span><i /></div>
        <p className="premium-food-eyebrow">RESERVEURTIME / ZERO SUGAR SHOWCASE</p>
        <h2 className="premium-soda-title"><span>Pure</span><br />Zero</h2>
        <p>Unleash the crisp taste of zero sugar. Refreshment redefined in every bubble — all in one sleek design.</p>
        <div className="food3d-category-list premium-soda-categories" aria-label="Mojo drink categories">
          {["Drinks", "Mojo"].map((category) => (
            <button type="button" key={category} onClick={() => searchCategory(category)}>
              <span>{category}</span>
            </button>
          ))}
        </div>
        <div className="premium-soda-award"><b>DESIGN FEATURE</b><small>INTERACTIVE BEVERAGE HERO</small></div>
      </div>

      <div className="premium-soda-object-layer premium-soda-leaves" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => <model-viewer key={index} src={SODA.leaves} environment-image="neutral" exposure="1" interaction-prompt="none" class={`premium-soda-leaf leaf-${index + 1}`} />)}
      </div>
      <div className="premium-soda-object-layer premium-soda-berries-bg" aria-hidden="true">
        {[6, 7, 8].map((index) => <model-viewer key={index} ref={(node) => { berryRefs.current[index] = node; }} src={flavor === "blue" ? SODA.blueberry : SODA.cherry} environment-image="neutral" exposure="1" interaction-prompt="none" class={`premium-soda-berry berry-${index + 1}`} />)}
      </div>

      <div className="premium-soda-center">
        <model-viewer ref={modelRef} src={SODA.can} alt="Floating 3D diet soda can" camera-controls disable-zoom shadow-intensity="0" environment-image="neutral" exposure="1.5" interaction-prompt="none" camera-orbit="0deg 90deg 380%" field-of-view="30deg" className="premium-soda-can" />
        {!ready && <span className="premium-soda-loading">Loading 3D can…</span>}
      </div>

      <div className="premium-soda-object-layer premium-soda-berries-fg" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((index) => <model-viewer key={index} ref={(node) => { berryRefs.current[index] = node; }} src={flavor === "blue" ? SODA.blueberry : SODA.cherry} environment-image="neutral" exposure="1.15" interaction-prompt="none" class={`premium-soda-berry berry-${index + 1}`} />)}
      </div>

      <div className="premium-soda-right">
        <div className="premium-soda-cards" role="group" aria-label="Soda flavor">
          <button type="button" className={flavor === "classic" ? "is-active" : ""} onClick={() => switchFlavor("classic")}>
            <img src={SODA.greenCard} alt="Diet Classic soda" /><span><b>Diet Classic</b><small>Classic</small></span>
          </button>
          <button type="button" className={flavor === "blue" ? "is-active" : ""} onClick={() => switchFlavor("blue")}>
            <img src={SODA.blueCard} alt="Zero Lime soda" /><span><b>Zero Lime</b><small>Lime</small></span>
          </button>
        </div>
        <h3><span>Refreshingly</span><br />Clean</h3>
      </div>
    </section>
  );
}

export default function SignatureFoodHero({ content }) {
  return (
    <div className="premium-home-hero-stack">
      <IntroHero content={content} />
      {FOOD_HEROES.map((config) => <SodaStyleFoodHero key={config.id} config={config} />)}
      <SodaHero />
    </div>
  );
}
