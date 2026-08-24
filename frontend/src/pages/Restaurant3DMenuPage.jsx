import { Component, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ExplodedDishCanvas, { useGLTF } from "../components/three/ExplodedDishCanvas";
import PageMessage from "../components/PageMessage";
import AddToCartButton from "../components/AddToCartButton";
import LottieFlowIcon from "../components/LottieFlowIcon";
import { apiFetch } from "../lib/api";

function hasWebGLSupport() {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
        canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true })
    );
  } catch {
    return false;
  }
}

class ViewerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("3D menu viewer failed:", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function cyclicIndex(index, length) {
  if (!length) return 0;
  return (index + length) % length;
}

export default function Restaurant3DMenuPage() {
  const { slug, dishSlug } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [state, setState] = useState({ loading: true, error: "", transitioning: false });
  const [mode, setMode] = useState("loading");
  const controlsRef = useRef(null);
  const touchStartRef = useRef(null);
  const webglSupported = useMemo(() => hasWebGLSupport(), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, error: "", transitioning: false });

    apiFetch(`/restaurants/${slug}/menu/3d`, { signal: controller.signal })
      .then((data) => {
        setPayload(data);
        setState({ loading: false, error: "", transitioning: false });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ loading: false, error: error.message, transitioning: false });
        }
      });

    return () => controller.abort();
  }, [slug]);

  const items = payload?.items || [];
  const currentIndex = useMemo(() => {
    if (!items.length) return -1;
    if (!dishSlug) return 0;
    const index = items.findIndex((item) => item.slug === dishSlug);
    return index >= 0 ? index : 0;
  }, [dishSlug, items]);
  const item = currentIndex >= 0 ? items[currentIndex] : null;
  const previous = items.length > 1 ? items[cyclicIndex(currentIndex - 1, items.length)] : null;
  const next = items.length > 1 ? items[cyclicIndex(currentIndex + 1, items.length)] : null;

  useEffect(() => {
    if (!payload || !items.length || dishSlug) return;
    navigate(`/restaurant/${slug}/menu/${items[0].slug}/3d`, { replace: true });
  }, [dishSlug, items, navigate, payload, slug]);

  useEffect(() => {
    if (!webglSupported) return;
    for (const candidate of [item, previous, next]) {
      if (candidate?.threeD?.modelUrl) useGLTF.preload(candidate.threeD.modelUrl);
    }
  }, [item, next, previous, webglSupported]);

  async function goTo(candidate) {
    if (!candidate || candidate.slug === item?.slug || state.transitioning) return;
    setState((current) => ({ ...current, transitioning: true }));
    try {
      await controlsRef.current?.explode?.();
    } finally {
      navigate(`/restaurant/${slug}/menu/${candidate.slug}/3d`);
      setMode("loading");
      window.setTimeout(
        () => setState((current) => ({ ...current, transitioning: false })),
        120
      );
    }
  }

  function onTouchStart(event) {
    const touch = event.changedTouches?.[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = event.changedTouches?.[0];
    if (!start || !touch || items.length < 2) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    goTo(dx < 0 ? next : previous);
  }

  if (state.loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-24 md:px-8">
        <div className="dish3d-page-loading">Preparing the full 3D menu…</div>
      </main>
    );
  }

  if (state.error || !payload) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-24 md:px-8">
        <PageMessage title="3D menu unavailable" message={state.error || "The 3D menu could not be loaded."} />
        <Link to={`/restaurant/${slug}/menu`} className="mt-8 inline-flex text-sm text-white/70 hover:text-white">
          <LottieFlowIcon name="arrow" className="rotate-180" /> Return to the normal menu
        </Link>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-24 md:px-8">
        <PageMessage title="No 3D dishes yet" message="This Restaurant currently has no enabled 3D dishes. The normal menu is still available." />
        <Link to={`/restaurant/${slug}/menu`} className="mt-8 inline-flex text-sm text-white/70 hover:text-white">
          <LottieFlowIcon name="arrow" className="rotate-180" /> Open normal menu
        </Link>
      </main>
    );
  }

  const { restaurant } = payload;
  const asset = item.threeD;
  const fallbackImage = asset.posterUrl || item.imageUrl || restaurant.coverImageUrl;
  const fallback = (
    <div className="dish3d-fallback">
      {fallbackImage && <img src={fallbackImage} alt={item.name} />}
      <div className="dish3d-fallback-copy">
        <p className="eyebrow">Reliable fallback</p>
        <h2>3D is not available on this device.</h2>
        <p>The ordinary menu remains available without WebGL.</p>
        <Link to={`/restaurant/${slug}/menu`} className="btn-secondary">Open normal menu</Link>
      </div>
    </div>
  );

  return (
    <main className="dish3d-page">
      <section className="mx-auto max-w-[1500px] px-5 pb-20 pt-8 md:px-8 md:pb-28 md:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link to={`/restaurant/${slug}/menu`} className="text-xs uppercase tracking-[.2em] text-white/45 transition hover:text-white">
            <LottieFlowIcon name="arrow" className="rotate-180" /> Normal menu
          </Link>
          <p className="text-xs uppercase tracking-[.24em] text-white/32">
            Phase 7 · Full 3D menu · {currentIndex + 1}/{items.length}
          </p>
        </div>

        <div className="dish3d-layout">
          <div className="dish3d-copy-panel">
            <p className="eyebrow">{restaurant.name} · {item.categoryId?.name || "Menu"}</p>
            <h1>{item.name}</h1>
            <p className="dish3d-price">৳{Number(item.price || 0).toLocaleString("en-BD")}</p>
            <div className="flex flex-wrap gap-3">
              <AddToCartButton menuItemId={item._id} />
            </div>
            <p className="dish3d-description">{item.description}</p>
            {item.ingredients?.length > 0 && <p className="dish3d-ingredients">{item.ingredients.join(" · ")}</p>}

            <div className="dish3d-controls" aria-label="3D assembly controls">
              <button type="button" onClick={() => controlsRef.current?.explode()} disabled={mode === "animating" || !webglSupported || state.transitioning}>
                Explode layers
              </button>
              <button type="button" onClick={() => controlsRef.current?.assemble()} disabled={mode === "animating" || !webglSupported || state.transitioning}>
                Assemble dish
              </button>
            </div>

            <div className="dish3d-status-row">
              <span className="dish3d-status-dot" aria-hidden="true" />
              <span>{state.transitioning ? "Transitioning to next dish" : mode === "animating" ? "Animating layers" : mode === "exploded" ? "Exploded view" : mode === "assembled" ? "Assembled view" : "Loading 3D scene"}</span>
            </div>

            <div className="dish3d-layer-list">
              <p className="eyebrow">Exploded layers</p>
              <ol>
                {(asset.layers || []).filter((layer) => layer.enabled !== false).sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)).map((layer, index) => (
                  <li key={layer.meshName}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{layer.label || layer.meshName}</strong>
                    <code>{layer.meshName}</code>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="dish3d-stage-column">
            <div
              className={`dish3d-stage-frame ${state.transitioning ? "dish3d-stage-transitioning" : ""}`}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div className="dish3d-stage-orbit" aria-hidden="true" />
              <div className="dish3d-stage-glow" aria-hidden="true" />
              {webglSupported ? (
                <ViewerErrorBoundary key={item.slug} fallback={fallback}>
                  <ExplodedDishCanvas key={item.slug} asset={asset} controlsRef={controlsRef} onModeChange={setMode} />
                </ViewerErrorBoundary>
              ) : fallback}
              {webglSupported && <div className="dish3d-interaction-hint">Drag to orbit · Scroll/pinch to zoom · Swipe dishes on mobile</div>}
            </div>

            <div className="dish3d-menu-navigation" aria-label="3D dish navigation">
              <button type="button" onClick={() => goTo(previous)} disabled={!previous || state.transitioning}>
                <span><LottieFlowIcon name="arrow" className="rotate-180" /> Previous</span>
                <strong>{previous?.name || item.name}</strong>
              </button>
              <div className="dish3d-menu-dots" aria-label="3D menu position">
                {items.map((candidate, index) => (
                  <button
                    key={candidate._id || candidate.slug}
                    type="button"
                    className={index === currentIndex ? "is-active" : ""}
                    aria-label={`Open ${candidate.name}`}
                    aria-current={index === currentIndex ? "true" : undefined}
                    onClick={() => goTo(candidate)}
                    disabled={state.transitioning}
                  />
                ))}
              </div>
              <button type="button" onClick={() => goTo(next)} disabled={!next || state.transitioning}>
                <span>Next <LottieFlowIcon name="arrow" /></span>
                <strong>{next?.name || item.name}</strong>
              </button>
            </div>

            <div className="dish3d-tech-strip">
              <span>GLB/GLTF</span><span>Three.js</span><span>R3F</span><span>Drei</span><span>GSAP</span><span>Adjacent preload</span>
            </div>
          </div>
        </div>

        <div className="dish3d-phase-note">
          <p>Restaurant Admin can now tune each dish&apos;s safe exploded-layer sequence, offsets, timing and easing from the 3D Animation Editor.</p>
          <Link to="/dashboard/cart" className="btn-primary">Review cart & reserve</Link>
        </div>
      </section>
    </main>
  );
}
