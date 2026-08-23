import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";

const CONFIG = {
  bgColor: "#0a0a24",
  flameColor: "#aee9ff",
  flameColor2: "#c79bff",
  flameAmt: 0.085,
  colorA: "#aef6cf",
  colorB: "#5fe6a0",
  colorC: "#eafff2",
  opacity: 1.35,
  pointSize: 24,
  brightness: 1.32,
  drift: 2.35,
  twinkle: 1,
  spin: 0.03,
  repelRadius: 5,
  repelStrength: 0.35,
  scrollPush: 8,
  scrollDrift: 6,
  scrollSpin: 0.1,
  parallax: 0.6
};

const LAYERS = {
  NONE: 0,
  TORUS_SCENE: 1,
  BLOOM_SCENE: 2,
  ENTIRE_SCENE: 3
};

function hexToVec3(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return new THREE.Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255
  );
}

const starVertex = /* glsl */ `
uniform float uTime; uniform float uSize; uniform float uDrift; uniform float uDepth; uniform float uTwinkle;
uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC;
attribute float aScale; attribute float aPhase; attribute float aPalette; attribute float aBright;
varying vec3 vColor; varying float vTwinkle;
void main() {
  vec3 pos = position;
  pos.z = mod(pos.z + uDrift + (uDepth * 0.5), uDepth) - (uDepth * 0.5);

  float tw = sin(uTime * 1.6 + aPhase * 6.2831);
  vTwinkle = (1.0 - uTwinkle) + uTwinkle * (0.55 + 0.45 * tw);

  vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
  vec3 toParticle = modelPosition.xyz - uCursor;
  float dist = length(toParticle);
  float falloff = smoothstep(uRepelRadius, 0.0, dist);
  modelPosition.xyz += normalize(toParticle + vec3(0.0001)) * falloff * uRepelStrength * uActivity;

  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;
  gl_PointSize = uSize * aScale;
  gl_PointSize *= (1.0 / max(0.2, -viewPosition.z));

  vec3 base = aPalette < 0.5 ? uColorA : (aPalette < 1.5 ? uColorB : uColorC);
  vColor = base * aBright;
}
`;

const starFragment = /* glsl */ `
uniform float uOpacity; uniform float uBrightness;
varying vec3 vColor; varying float vTwinkle;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float strength = pow(1.0 - d * 2.0, 4.0);
  vec3 color = mix(vec3(0.0), vColor, strength);
  gl_FragColor = vec4(color * uBrightness, strength * uOpacity * vTwinkle);
}
`;

const finalShader = {
  uniforms: {
    iTime: { value: 0 },
    tDiffuse: { value: null },
    torusTexture: { value: null },
    bloomTexture: { value: null },
    haloTexture: { value: null },
    uBg: { value: hexToVec3(CONFIG.bgColor) },
    uFlameA: { value: hexToVec3(CONFIG.flameColor) },
    uFlameB: { value: hexToVec3(CONFIG.flameColor2) },
    uFlameAmt: { value: CONFIG.flameAmt }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform float iTime;
    uniform sampler2D tDiffuse;
    uniform sampler2D bloomTexture;
    uniform sampler2D torusTexture;
    uniform sampler2D haloTexture;
    uniform vec3 uBg;
    uniform vec3 uFlameA;
    uniform vec3 uFlameB;
    uniform float uFlameAmt;
    varying vec2 vUv;

    vec3 warp3d(vec3 pos, float t){
      float curv=.8,a=1.9,b=0.7;
      pos*=2.;
      pos.x+=curv*sin(t+a*pos.y)+t*b; pos.y+=curv*cos(t+a*pos.x);
      pos.y+=curv*sin(t+a*pos.z)+t*b; pos.z+=curv*cos(t+a*pos.y);
      pos.z+=curv*sin(t+a*pos.x)+t*b; pos.x+=curv*cos(t+a*pos.z);
      return 0.5+0.5*cos(pos.xyz+vec3(1,2,4));
    }

    void main(){
      vec2 uv = 2.*vUv - 1.;
      vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), iTime*1.5), vec3(1.5));
      vec3 flame = 1.5*uFlameA*w.x;
      flame*=w.y;
      flame += uFlameB*w.z;
      flame *= smoothstep(0.25, 1., abs(uv.y));
      float md = smoothstep(-0.7, 1., -uv.y*uv.x);
      flame *= md*md;
      vec3 bg = uBg * (1.0 - 0.4 * length(uv));
      vec3 halo = texture2D(haloTexture, vUv).xyz;
      gl_FragColor = vec4(
        bg + flame*uFlameAmt + texture2D(bloomTexture, vUv).xyz +
        texture2D(torusTexture, vUv).xyz + texture2D(tDiffuse, vUv).xyz + halo,
        1.
      );
    }
  `
};

export default function GalaxyBackground({ settings = {} }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (settings.enabled === false) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const count = reducedMotion ? 420 : coarsePointer ? 850 : 1450;
    const depth = 30;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.15 : 1.6);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarsePointer, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 0, 15);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 80);
    camera.position.set(0, 0, 5);
    camera.layers.enable(LAYERS.TORUS_SCENE);
    camera.layers.enable(LAYERS.BLOOM_SCENE);
    camera.layers.enable(LAYERS.ENTIRE_SCENE);
    scene.add(camera);

    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    const palette = new Float32Array(count);
    const bright = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 24;
      positions[i3 + 1] = (Math.random() - 0.5) * 16;
      positions[i3 + 2] = (Math.random() - 0.5) * depth;
      palette[i] = Math.floor(Math.random() * 3);
      bright[i] = 0.58 + Math.random() * 0.42;
      scales[i] = 0.34 + Math.pow(Math.random(), 1.7) * 1.45;
      phases[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("aScale", new THREE.Float32BufferAttribute(scales, 1));
    geometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
    geometry.setAttribute("aPalette", new THREE.Float32BufferAttribute(palette, 1));
    geometry.setAttribute("aBright", new THREE.Float32BufferAttribute(bright, 1));

    const densitySize = settings.density === "high" ? 1.04 : settings.density === "low" ? 0.78 : 0.9;
    const glow = settings.glowIntensity === "high" ? 1.18 : settings.glowIntensity === "low" ? 0.72 : 1;
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: CONFIG.pointSize * densitySize },
        uOpacity: { value: 0 },
        uDrift: { value: 0 },
        uDepth: { value: depth },
        uTwinkle: { value: reducedMotion ? 0.18 : CONFIG.twinkle },
        uCursor: { value: new THREE.Vector3() },
        uRepelRadius: { value: CONFIG.repelRadius },
        uRepelStrength: { value: CONFIG.repelStrength },
        uActivity: { value: 0 },
        uColorA: { value: hexToVec3(CONFIG.colorA) },
        uColorB: { value: hexToVec3(CONFIG.colorB) },
        uColorC: { value: hexToVec3(CONFIG.colorC) },
        uBrightness: { value: CONFIG.brightness }
      },
      vertexShader: starVertex,
      fragmentShader: starFragment
    });

    const points = new THREE.Points(geometry, material);
    points.layers.set(LAYERS.ENTIRE_SCENE);
    points.layers.enable(LAYERS.BLOOM_SCENE);
    points.layers.enable(LAYERS.TORUS_SCENE);
    const group = new THREE.Group();
    group.add(points);
    scene.add(group);

    const renderScene = new RenderPass(scene, camera);

    const torusComposer = new EffectComposer(renderer);
    torusComposer.renderToScreen = false;
    torusComposer.addPass(renderScene);
    torusComposer.addPass(new ShaderPass(GammaCorrectionShader));
    torusComposer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.22 * glow, 0.2, 0));
    torusComposer.addPass(new ShaderPass(CopyShader));

    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(new RenderPass(scene, camera));
    bloomComposer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4 * glow, 0.55, 0));
    bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));

    const finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(new RenderPass(scene, camera));
    const finalPass = new ShaderPass(finalShader);
    finalComposer.addPass(finalPass);

    const blackData = new Uint8Array([0, 0, 0, 255]);
    const blackTexture = new THREE.DataTexture(blackData, 1, 1, THREE.RGBAFormat);
    blackTexture.needsUpdate = true;
    finalPass.uniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;
    finalPass.uniforms.torusTexture.value = torusComposer.renderTarget1.texture;
    finalPass.uniforms.haloTexture.value = blackTexture;

    const pointer = {
      ndc: new THREE.Vector2(),
      smooth: new THREE.Vector2(),
      world: new THREE.Vector3(),
      active: false,
      activity: 0,
      lastMove: performance.now()
    };
    const targetWorld = new THREE.Vector3();
    const rayDirection = new THREE.Vector3();
    let scrollTarget = 0;
    let scrollSmooth = 0;
    let scrollCurrent = 0;
    let frameId = 0;
    let lastRender = 0;
    let t0 = performance.now() / 1000;
    const appearStart = performance.now();

    function updateScrollTarget() {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollTarget = THREE.MathUtils.clamp(window.scrollY / max, 0, 1);
    }

    function onMouseMove(event) {
      pointer.ndc.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.ndc.y = -(event.clientY / window.innerHeight) * 2 + 1;
      pointer.active = !coarsePointer;
      pointer.lastMove = performance.now();
    }

    function onMouseOut() {
      pointer.active = false;
    }

    function updatePointer(nowMs) {
      pointer.smooth.lerp(pointer.ndc, reducedMotion ? 0.02 : 0.06);
      targetWorld.set(0, 0, 0);
      if (pointer.active) {
        const point = new THREE.Vector3(pointer.ndc.x, pointer.ndc.y, 0.5).unproject(camera);
        rayDirection.copy(point).sub(camera.position).normalize();
        if (Math.abs(rayDirection.z) > 1e-4) {
          const t = -camera.position.z / rayDirection.z;
          if (Number.isFinite(t) && t > 0) {
            targetWorld.copy(camera.position).add(rayDirection.multiplyScalar(t));
          }
        }
      }
      pointer.world.lerp(targetWorld, 0.12);
      const idle = (nowMs - pointer.lastMove) / 1000;
      const want = pointer.active && idle < 3 && !reducedMotion ? 1 : 0;
      pointer.activity += (want - pointer.activity) * 0.06;
      material.uniforms.uCursor.value.copy(pointer.world);
      material.uniforms.uActivity.value = pointer.activity;
    }

    function onResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      for (const composer of [torusComposer, bloomComposer, finalComposer]) {
        composer.setPixelRatio(pixelRatio);
        composer.setSize(width, height);
      }
      updateScrollTarget();
    }

    function render(nowMs) {
      frameId = requestAnimationFrame(render);
      if (document.hidden || (!reducedMotion && nowMs - lastRender < 1000 / 45)) return;
      if (reducedMotion && lastRender > 0) return;
      lastRender = nowMs;
      const t = nowMs / 1000;
      const dt = Math.min(0.05, Math.max(0, t - t0));
      t0 = t;

      scrollSmooth = THREE.MathUtils.lerp(scrollSmooth, scrollTarget, 0.1);
      scrollCurrent = THREE.MathUtils.lerp(scrollCurrent, scrollSmooth, 0.06);
      updatePointer(nowMs);

      const motionScale = settings.movement === "normal" ? 1 : 0.72;
      material.uniforms.uTime.value = t;
      if (!reducedMotion) {
        material.uniforms.uDrift.value += dt * (CONFIG.drift + scrollCurrent * CONFIG.scrollDrift) * motionScale;
        group.rotation.z += dt * (CONFIG.spin + scrollCurrent * CONFIG.scrollSpin) * motionScale;
      }

      camera.position.set(
        pointer.smooth.x * CONFIG.parallax,
        pointer.smooth.y * CONFIG.parallax,
        5 - scrollCurrent * CONFIG.scrollPush
      );
      camera.lookAt(pointer.smooth.x * CONFIG.parallax, pointer.smooth.y * CONFIG.parallax, -10);

      const fade = THREE.MathUtils.clamp((nowMs - appearStart - 300) / 1400, 0, 1);
      material.uniforms.uOpacity.value = fade * CONFIG.opacity;
      finalPass.uniforms.iTime.value = t;

      camera.layers.set(LAYERS.TORUS_SCENE);
      torusComposer.render();
      camera.layers.set(LAYERS.BLOOM_SCENE);
      bloomComposer.render();
      camera.layers.set(LAYERS.ENTIRE_SCENE);
      finalComposer.render();

    }

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", updateScrollTarget, { passive: true });
    window.addEventListener("resize", onResize);
    updateScrollTarget();
    onResize();
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", updateScrollTarget);
      window.removeEventListener("resize", onResize);
      torusComposer.dispose();
      bloomComposer.dispose();
      finalComposer.dispose();
      blackTexture.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [settings.enabled, settings.density, settings.movement, settings.glowIntensity]);

  if (settings.enabled === false) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen"
      aria-hidden="true"
    />
  );
}
