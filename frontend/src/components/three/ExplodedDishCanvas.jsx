import {
  Float,
  Html,
  OrbitControls,
  useGLTF,
  useProgress
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import {
  forwardRef,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

function Loader3D() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="dish3d-loader" role="status" aria-live="polite">
        <span className="dish3d-loader-dot" />
        Loading 3D dish {Math.round(progress)}%
      </div>
    </Html>
  );
}

const DEFAULT_ANIMATION = {
  duration: 1.15,
  stagger: 0.075,
  easing: "power3.inOut",
  autoAssemble: true,
  autoAssembleDelay: 650,
  floatIntensity: 0.1,
  rotationIntensity: 0.06
};

const ExplodedDishModel = forwardRef(function ExplodedDishModel(
  { asset, onModeChange },
  ref
) {
  const { scene } = useGLTF(asset.modelUrl);
  const reducedMotion = useReducedMotion();
  const model = useMemo(() => scene.clone(true), [scene]);
  const timelineRef = useRef(null);
  const pendingResolveRef = useRef(null);

  const animation = useMemo(
    () => ({ ...DEFAULT_ANIMATION, ...(asset.animation || {}) }),
    [asset.animation]
  );

  const targets = useMemo(() => {
    return (asset.layers || [])
      .map((layer, index) => {
        const object = model.getObjectByName(layer.meshName);
        if (!object) return null;
        return {
          object,
          meshName: layer.meshName,
          enabled: layer.enabled !== false,
          sequence: Number.isFinite(Number(layer.sequence))
            ? Number(layer.sequence)
            : index,
          assembled: object.position.clone(),
          assembledRotation: object.rotation.clone(),
          assembledScale: object.scale.clone(),
          offset: {
            x: Number(layer.explodedOffset?.x || 0),
            y: Number(layer.explodedOffset?.y || 0),
            z: Number(layer.explodedOffset?.z || 0)
          },
          rotationOffset: {
            x: Number(layer.rotationOffset?.x || 0) * (Math.PI / 180),
            y: Number(layer.rotationOffset?.y || 0) * (Math.PI / 180),
            z: Number(layer.rotationOffset?.z || 0) * (Math.PI / 180)
          },
          explodeScale: Number(layer.explodeScale ?? 1)
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.sequence - b.sequence);
  }, [asset.layers, model]);

  const stopTweens = useCallback(() => {
    timelineRef.current?.kill();
    timelineRef.current = null;
    for (const target of targets) {
      gsap.killTweensOf(target.object.position);
      gsap.killTweensOf(target.object.rotation);
      gsap.killTweensOf(target.object.scale);
    }
    pendingResolveRef.current?.();
    pendingResolveRef.current = null;
  }, [targets]);

  const moveTo = useCallback(
    (mode, immediate = false) => {
      stopTweens();
      const exploded = mode === "exploded";

      if (reducedMotion || immediate) {
        for (const target of targets) {
          const useOffset = exploded && target.enabled;
          target.object.position.set(
            target.assembled.x + (useOffset ? target.offset.x : 0),
            target.assembled.y + (useOffset ? target.offset.y : 0),
            target.assembled.z + (useOffset ? target.offset.z : 0)
          );
          target.object.rotation.set(
            target.assembledRotation.x + (useOffset ? target.rotationOffset.x : 0),
            target.assembledRotation.y + (useOffset ? target.rotationOffset.y : 0),
            target.assembledRotation.z + (useOffset ? target.rotationOffset.z : 0)
          );
          const scaleFactor = useOffset ? target.explodeScale : 1;
          target.object.scale.set(
            target.assembledScale.x * scaleFactor,
            target.assembledScale.y * scaleFactor,
            target.assembledScale.z * scaleFactor
          );
        }
        onModeChange?.(mode);
        return Promise.resolve(mode);
      }

      onModeChange?.("animating");

      return new Promise((resolve) => {
        pendingResolveRef.current = () => resolve(mode);
        const timeline = gsap.timeline({
          defaults: {
            duration: Number(animation.duration || DEFAULT_ANIMATION.duration),
            ease: animation.easing || DEFAULT_ANIMATION.easing
          },
          onComplete: () => {
            timelineRef.current = null;
            pendingResolveRef.current = null;
            onModeChange?.(mode);
            resolve(mode);
          }
        });

        targets.forEach((target, index) => {
          const useOffset = exploded && target.enabled;
          const at = index * Number(animation.stagger || 0);
          timeline.to(
            target.object.position,
            {
              x: target.assembled.x + (useOffset ? target.offset.x : 0),
              y: target.assembled.y + (useOffset ? target.offset.y : 0),
              z: target.assembled.z + (useOffset ? target.offset.z : 0)
            },
            at
          );
          timeline.to(
            target.object.rotation,
            {
              x: target.assembledRotation.x + (useOffset ? target.rotationOffset.x : 0),
              y: target.assembledRotation.y + (useOffset ? target.rotationOffset.y : 0),
              z: target.assembledRotation.z + (useOffset ? target.rotationOffset.z : 0),
              duration: Math.max(0.25, Number(animation.duration || DEFAULT_ANIMATION.duration) * 0.92)
            },
            at
          );
          const scaleFactor = useOffset ? target.explodeScale : 1;
          timeline.to(
            target.object.scale,
            {
              x: target.assembledScale.x * scaleFactor,
              y: target.assembledScale.y * scaleFactor,
              z: target.assembledScale.z * scaleFactor,
              duration: Math.max(0.25, Number(animation.duration || DEFAULT_ANIMATION.duration) * 0.78)
            },
            at
          );
        });

        timelineRef.current = timeline;
      });
    },
    [animation.duration, animation.easing, animation.stagger, onModeChange, reducedMotion, stopTweens, targets]
  );

  useLayoutEffect(() => {
    if (reducedMotion || animation.autoAssemble === false) {
      moveTo("assembled", true);
      return stopTweens;
    }

    moveTo("exploded", true);
    const timer = window.setTimeout(
      () => moveTo("assembled"),
      Math.max(0, Number(animation.autoAssembleDelay || 0))
    );

    return () => {
      window.clearTimeout(timer);
      stopTweens();
    };
  }, [animation.autoAssemble, animation.autoAssembleDelay, moveTo, reducedMotion, stopTweens]);

  useImperativeHandle(
    ref,
    () => ({
      assemble: () => moveTo("assembled"),
      explode: () => moveTo("exploded"),
      setImmediate: (mode) => moveTo(mode, true)
    }),
    [moveTo]
  );

  return (
    <Float
      speed={reducedMotion ? 0 : 1.05}
      rotationIntensity={reducedMotion ? 0 : Number(animation.rotationIntensity || 0)}
      floatIntensity={reducedMotion ? 0 : Number(animation.floatIntensity || 0)}
    >
      <group scale={Number(asset.modelScale || 1)}>
        <primitive object={model} />
      </group>
    </Float>
  );
});

export default function ExplodedDishCanvas({ asset, controlsRef, onModeChange }) {
  const cameraPosition = asset.cameraPosition || { x: 4.8, y: 3.8, z: 5.8 };
  const cameraTarget = asset.cameraTarget || { x: 0, y: 0, z: 0.5 };

  return (
    <div className="dish3d-canvas-shell">
      <Canvas
        dpr={[1, 1.5]}
        camera={{
          position: [cameraPosition.x, cameraPosition.y, cameraPosition.z],
          fov: 38,
          near: 0.1,
          far: 100
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        aria-label="Interactive 3D exploded dish viewer"
      >
        <ambientLight intensity={1.15} />
        <directionalLight position={[4, 6, 5]} intensity={2.4} />
        <directionalLight position={[-4, 2, -3]} intensity={0.8} />
        <pointLight position={[0, 4, 1]} intensity={1.2} />

        <Suspense fallback={<Loader3D />}>
          <ExplodedDishModel
            key={`${asset.modelUrl}-${JSON.stringify(asset.layers || [])}-${JSON.stringify(asset.animation || {})}`}
            ref={controlsRef}
            asset={asset}
            onModeChange={onModeChange}
          />
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={3.2}
          maxDistance={9}
          minPolarAngle={0.35}
          maxPolarAngle={Math.PI - 0.35}
          target={[cameraTarget.x, cameraTarget.y, cameraTarget.z]}
        />
      </Canvas>
    </div>
  );
}

export { useGLTF };
