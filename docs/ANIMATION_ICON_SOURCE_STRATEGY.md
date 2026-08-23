# ReserveUrTime Animation, Icon & Motion Source Strategy

**Research date:** 2026-08-18  
**Status:** Approved planning reference for Phase 6–14.  
**Current implementation gate:** Phase 5 is complete; Phase 6 is the first real GLB/GLTF exploded-dish phase.

## 1. Goal
ReserveUrTime should feel cinematic and premium without turning into a collection of unrelated effects. The project will use the sources below selectively for **inspiration, UI motion patterns, micro-interactions, icons, loaders, transitions, and scene ideas**. The real exploded food animation remains a custom ReserveUrTime implementation.

## 2. Permanent engine decision

### Core 3D / dish animation
Use:
- Three.js
- React Three Fiber
- Drei
- GSAP timelines
- real `.glb/.gltf` assets with named meshes

The 3D dish system must NOT be replaced by a generic UI animation component. External galleries can inspire timing, camera motion, lighting, transitions and loading states, but the dish geometry/layer movement must be implemented in our own 3D module.

### 2D UI motion
Prefer, in order:
1. CSS transforms/opacity for tiny hover/focus effects.
2. GSAP when the motion is tied to the 3D timeline or requires controlled sequencing.
3. Motion/Framer Motion only for selected React UI components where it clearly reduces complexity.
4. Lottie only for small icon/status animations; never as the primary 3D food system.

### Important anti-bloat rule
Do not install an entire UI library just to use one visual effect. Prefer copying/adapting a permitted component pattern into our own design system, and verify its licence before shipping.

---

# 3. Investigation of the 18 requested sources

## 1) Vengeance UI — https://www.vengenceui.com/
**What it provides:** animated React/Next components, hover effects, animated tooltips, scroll-driven layouts, navbars, loaders, backgrounds, rays, glass/spotlight patterns, gooey search and shadcn-compatible installation.

**ReserveUrTime decision: HIGH PRIORITY — selective UI motion source.**

Best use:
- Phase 7: 3D menu navigation, Previous/Next controls, hover states, tooltips, loaders.
- Phase 12: spotlight navigation, animated footer, subtle rays/scene fields, refined CTA interactions.
- Phase 11: tooltip/feedback ideas.

Do not use:
- as the core exploded dish engine;
- every component at once;
- heavy shader backgrounds on pages already running a 3D food canvas.

## 2) Skiper UI — https://skiper-ui.com/
**What it provides:** uncommon shadcn-oriented React components including image reveal, scroll text, parallax, perspective/carousel, drag/swipe, animated icons and mouse interactions. Some components are free and some are Pro; components can bring dependencies such as Framer Motion and Lenis.

**ReserveUrTime decision: MEDIUM-HIGH PRIORITY — interaction reference + selective component adaptation.**

Best use:
- Phase 7: perspective/carousel and touch/swipe interaction references.
- Phase 12: image reveal, text reveal, subtle parallax, card-stack ideas.
- Gallery transitions only when they do not compete with the dish canvas.

Rules:
- no global Lenis/smooth-scroll dependency unless a concrete UX need justifies it;
- verify Free/Pro and attribution requirements per selected component;
- do not copy a recreation blindly; adapt the interaction to ReserveUrTime.

## 3) Animmaster Lib — https://animmasterlib.dev/
**What it provides:** a large paid/pro library of scroll animations, hero animations, sliders, 3D animations, WebGL shaders, page transitions, hover/mouse effects, SVG, background and physics effects.

**ReserveUrTime decision: HIGH INSPIRATION VALUE, CONDITIONAL CODE USE.**

Best use:
- Phase 6/7: research 3D/WebGL transition timing and presentation.
- Phase 12: page transition/hero/scroll polish if the project has a valid licence.

Rule: treat it as inspiration unless we explicitly have rights/access to the selected component source. Do not make the project dependent on paid code that is not included/licensed.

## 4) Recent — https://recent.design/
**What it provides:** daily curated design/web/tool inspiration.

**ReserveUrTime decision: INSPIRATION ONLY.**

Best use:
- Phase 12 visual direction review;
- checking whether our motion feels contemporary rather than generic.

Do not copy layouts/code directly.

## 5) ScreensDesign — https://screensdesign.com/
**What it provides:** real app-screen and flow research, including navigation, forms, filters, dashboards, dialogs, empty/error states and motion cues.

**ReserveUrTime decision: HIGH UX REFERENCE VALUE.**

Best use:
- Phase 8 Customer profile/favourites.
- Phase 9 cart/order flows.
- Phase 10 payment states.
- Phase 11 reviews/contact/notifications.
- Phase 13 mobile/accessibility/error-state QA.

Use it for flow/state reasoning, not for copying another product's visual surface.

## 6) Design Spells — https://designspells.com/
**What it provides:** curated micro-interactions, easter eggs, hover details, reveal patterns and delightful product-level interaction examples.

**ReserveUrTime decision: HIGH MICRO-INTERACTION INSPIRATION VALUE.**

Best use:
- Phase 8 favourite/save feedback.
- Phase 9 add-to-cart/order success feedback.
- Phase 11 review/contact success states.
- Phase 12 final detail polish.

Keep interactions restrained; no gimmick should slow a booking/order action.

## 7) Mobbin — https://mobbin.com/
**What it provides:** real mobile/web product screens, complete flows, interactive hotspots and video examples showing micro-interactions and animations.

**ReserveUrTime decision: VERY HIGH UX/FLOW REFERENCE VALUE.**

Best use:
- Phase 7 mobile 3D carousel/swipe behavior.
- Phase 8 favourites/profile/dashboard.
- Phase 9 cart/order UX.
- Phase 10 checkout/payment flow.
- Phase 11 notifications/reviews.
- Phase 13 usability and mobile regression review.

Use it to study proven flows and state transitions, not to reproduce copyrighted product designs.

## 8) UI.live — https://ui.live/
**What it currently exposes:** a design/community product with limited publicly crawlable detail; external references describe design inspiration/components and Figma exports.

**ReserveUrTime decision: LOW PRIORITY / INSPIRATION ONLY UNTIL A SPECIFIC ASSET IS VERIFIED.**

Do not add any dependency or copy any asset from UI.live unless its exact source, licence and implementation are verified first.

## 9) Animos — https://animos.app/editor
**What it provides:** browser-based motion templates for design showcases; insert images/videos, tune a template and export MP4.

**ReserveUrTime decision: NOT A RUNTIME UI LIBRARY.**

Best use:
- optional project demo/presentation video;
- social/promotional showcase of ReserveUrTime screens.

Do not use it for live Restaurant, booking, admin, payment or 3D dish interaction.

## 10) Aceternity UI — https://ui.aceternity.com/
**What it provides:** React/Tailwind/Motion components including animated cards, text, heroes, background beams, spotlights, aurora, shooting stars, 3D cards and micro-interactions.

**ReserveUrTime decision: VERY HIGH PRIORITY — selective React animation source.**

Best use:
- Phase 6: 3D loading/fallback shell, subtle spotlight around 3D viewport—not the dish itself.
- Phase 7: navigation/cards/hover transitions around the 3D menu.
- Phase 12: cinematic section reveals, background accents and text motion.

Performance rule: prefer transform/opacity effects. Avoid stacking canvas/video/shader effects behind a live Three.js dish canvas.

## 11) daisyUI — https://daisyui.com/
**What it provides:** Tailwind component patterns for forms, buttons, dialogs, fields and application UI. It is primarily a component system, not a cinematic motion library.

**ReserveUrTime decision: UTILITY REFERENCE, NOT VISUAL IDENTITY.**

Best use:
- Phase 8–11 forms/dialogs/status components as accessibility/structure references.
- Admin forms where clarity matters more than animation.

Do not globally restyle the premium public site into a default daisyUI look. If used, map components to ReserveUrTime design tokens.

## 12) 21st.dev — https://21st.dev/
**What it provides:** a large community library of React/Tailwind components, including Motion primitives, animated backgrounds, text, hover effects, heroes, carousels and shaders with live previews.

**ReserveUrTime decision: VERY HIGH DISCOVERY VALUE; SELECTIVE CODE ADAPTATION.**

Best use:
- Phase 7: carousel/transition/motion primitives.
- Phase 12: text reveal, border trail, progressive blur, ambient background ideas.
- Phase 11: compact feedback components.

Rules:
- verify each individual component's dependency/licence;
- do not add overlapping implementations from multiple libraries for the same job;
- prefer small primitives over large opinionated templates.

## 13) OriginKit — https://www.originkit.dev/
**What it provides:** free animated components for React/Framer, including text, image, backgrounds, shader/3D experiments and interactive galleries.

**ReserveUrTime decision: MEDIUM-HIGH PRIORITY — selective component/reference source.**

Best use:
- Phase 6/7: 3D interaction inspiration, never dish geometry.
- Phase 12: staggered text, image motion and atmospheric background experiments.

Use only after checking the selected component's runtime cost and licence.

## 14) Casberry Particles — https://particles.casberry.in/
**What it provides:** a high-performance Three.js/WebGL 3D particle/swarm simulator intended for large particle counts and interactive procedural scenes.

**ReserveUrTime decision: SPECIALIST SOURCE — AMBIENT PARTICLES ONLY.**

Best use:
- Phase 6/7 as research for efficient star/particle ambience around a 3D dish if needed;
- Phase 12 optional subtle galaxy/transition experiments.

Do not use a 20k+ particle scene by default on mobile. Do not mix a huge particle simulation with the main dish canvas without measuring GPU cost.

## 15) useAnimations — https://useanimations.com/
**What it provides:** animated Lottie/SVG icon sets including alerts, notifications, navigation and status icons, designed for web/mobile.

**ReserveUrTime decision: PRIMARY ANIMATED ICON CANDIDATE.**

Best use:
- Phase 8 favourite/profile states.
- Phase 9 cart/order state feedback.
- Phase 11 notification/contact/review micro-icons.
- loading/success/error only where motion adds clarity.

Rule: lazy-load animation assets where possible and provide static SVG/icon fallback. Verify individual asset licence before production.

## 16) Finsweet Lottieflow — https://finsweet.com/lottieflow
**What it provides:** customizable Lottie JSON icons/animations built around Webflow interactions; categories include CTA, arrow, checkbox, dropdown, communication, ecommerce and background.

**ReserveUrTime decision: SECONDARY LOTTIE SOURCE.**

Best use:
- specific lightweight success/check/arrow/CTA icons when a useAnimations equivalent is unsuitable;
- optional marketing/demo pages.

Because ReserveUrTime is React/Vite, do not introduce Webflow-specific runtime assumptions. Use only portable JSON assets with an appropriate React Lottie renderer if selected.

## 17) GetLayers — https://www.getlayers.ai/
**What it provides:** curated templates, prompts, animated backgrounds and 3D scenes intended for AI-assisted website creation. Full source/3D access can depend on paid tiers.

**ReserveUrTime decision: VERY HIGH 3D/ATMOSPHERE INSPIRATION VALUE; CONDITIONAL ASSET USE.**

Best use:
- Phase 6: scene composition, lighting, 3D mood and transition reference.
- Phase 12: cinematic backgrounds/sections if licensed and performance-safe.

Critical rule: the food dish, ingredient meshes and exploded assembly must remain custom. Do not use a generic GetLayers scene as a substitute for a real dish model.

## 18) Awwwards — https://www.awwwards.com/
**What it provides:** curated award-winning animation, micro-interaction, WebGL, GSAP, Three.js and interaction-design examples.

**ReserveUrTime decision: TOP-LEVEL QUALITY BENCHMARK / INSPIRATION SOURCE.**

Best use:
- Phase 6/7 before locking the 3D transition/camera language.
- Phase 12 final cinematic polish benchmark.
- Phase 13 sanity check that visual ambition has not damaged usability/performance.

Awwwards is inspiration, not a code source.

---

# 4. Final source priority for ReserveUrTime

## Tier A — primary sources to actively consult
- **Awwwards** — overall motion/interaction quality benchmark.
- **Mobbin** — real product flows and mobile interaction behavior.
- **ScreensDesign** — states, forms, filters, dashboards, accessibility/mobile cues.
- **Aceternity UI** — React/Tailwind animated UI patterns.
- **21st.dev** — discovery of small React motion primitives/components.
- **Vengeance UI** — distinctive hover/nav/tooltip/loaders and scene accents.
- **Design Spells** — micro-interaction detail.
- **GetLayers** — 3D/atmosphere inspiration, conditional licensed assets.

## Tier B — use for specific needs
- **Skiper UI** — carousel, reveal, parallax, perspective/swipe patterns.
- **OriginKit** — text/image/background/3D experiment references.
- **Animmaster Lib** — premium 3D/WebGL/page-transition research; code only if licensed.
- **useAnimations** — animated icons/status feedback.
- **Casberry Particles** — particle/WebGL specialist reference.
- **Lottieflow** — secondary portable Lottie icons.
- **daisyUI** — forms/dialog/accessibility structure reference.

## Tier C — supporting only
- **Recent.design** — trend/inspiration scan.
- **Animos** — marketing/demo MP4 output, not website runtime.
- **UI.live** — inspiration only until exact source/licence is verifiable.

---

# 5. Remaining-phase animation map

## Phase 6 — 3D Asset Pipeline + ONE Exploded Assembly Prototype
**Core:** custom R3F + Drei + GSAP + GLB/GLTF.  
**Consult:** Awwwards, GetLayers, Animmaster, Casberry, OriginKit.  
**UI shell:** Aceternity/Vengeance only for lightweight loader, tooltip or viewport accents.

Required signature:
1. named ingredient/food meshes;
2. capture assembled transforms;
3. calculate deliberate exploded X/Y/Z offsets;
4. GSAP timeline exploded → assembled;
5. camera/light/idle float after assembly;
6. poster fallback and reduced-motion path;
7. one dish only until performance is proven.

## Phase 7 — Full Real 3D Menu
**Consult:** Awwwards, Mobbin, Vengeance UI, Skiper UI, 21st.dev, Aceternity, Design Spells.  
Use these for Previous/Next controls, carousel/swipe behavior, hover/tap feedback, text transitions and loading states around the 3D canvas.

## Phase 8 — Favourites + Customer Profile/Dashboard — IMPLEMENTED
**Consult:** Mobbin, ScreensDesign, Design Spells, useAnimations, daisyUI.  
Motion should communicate saved/removed, loading, empty and success states rather than feel cinematic for its own sake.

Phase 8 implementation note: the project uses a lightweight CSS heart/save state animation with optimistic rollback and reduced-motion handling; no additional runtime animation package was installed.

## Phase 9 — Cart + Orders
**Consult:** Mobbin, ScreensDesign, Design Spells, useAnimations, daisyUI, small 21st.dev primitives.  
Prioritize clear quantities, prices, confirmation, optimistic feedback only when safe, and stable state during network changes.

## Phase 10 — SSLCOMMERZ Sandbox
**Animation policy:** conservative.  
Use simple loading/success/error feedback only. No scroll hijacking, background shader, distracting parallax or 3D transition in the payment-critical flow. Mobbin/ScreensDesign may be used for checkout state reference.

## Phase 11 — Reviews, Contact, Notifications
**Consult:** useAnimations, Lottieflow, Design Spells, Mobbin, ScreensDesign, Vengeance UI/21st.dev for small feedback patterns.  
Keep notification motion brief and accessible.

## Phase 12 — Cinematic UX Polish
**Primary creative pass:** Awwwards + Recent + Vengeance + Aceternity + 21st.dev + OriginKit + Design Spells.  
**Conditional:** Animmaster/GetLayers if licensed.  
**Particle specialist:** Casberry only if GPU budget allows.

This is where page transitions, section reveals, text motion, image reveals, cursor/hover polish and final visual rhythm are unified into one system.

## Phase 13 — Security / Performance / Reliability QA
Do **not** add new decorative libraries here. Remove unnecessary effects, test reduced motion, test low-end/mobile GPU, suspend hidden/offscreen animations and verify loading/error/offline behavior.

## Phase 14 — Deployment + Final Documentation
No new animation features. Freeze dependencies, verify third-party licences/attribution, document every copied/adapted component/asset and confirm production fallbacks.

---

# 6. Motion design rules that override all libraries

1. One motion language: dark, elegant, slow-to-medium, depth-focused; no random neon SaaS style.
2. The food is the hero. UI animation must frame the dish, not compete with it.
3. 3D dish movement uses physically understandable X/Y/Z layer separation and precise return to assembled transforms.
4. Prefer transforms and opacity; avoid layout-thrashing animations.
5. Never stack multiple canvas/WebGL backgrounds on a page that already has the dish canvas without profiling.
6. Respect `prefers-reduced-motion` and provide a non-animated/less-animated path.
7. Mobile gets reduced particle count, reduced DPR/quality and touch-first controls.
8. Pause/suspend animation when tab/page/3D viewport is not visible where practical.
9. Do not autoplay sound.
10. Do not use cursor-only interaction for required actions.
11. Every animation must survive network failure and model-loading failure.
12. Static poster/DOM menu remains the fallback.
13. Payment, authentication and destructive admin operations use clarity-first motion only.
14. Before introducing a third-party asset/component, record source, licence, modifications, dependencies and performance impact.

# 7. Icon policy

Preferred order:
1. existing/static SVG icons for normal controls;
2. useAnimations for meaningful animated state icons;
3. Finsweet Lottieflow for a specific gap;
4. component-library icons only if already included in a chosen component.

Avoid animating every icon. Animate state changes such as favourite success, notification arrival, success/error, menu open/close, cart confirmation or loading.

# 8. Dependency policy

Before adding any Motion, Lottie, Lenis, shader, particle or component package:
- identify the exact screen and user benefit;
- check whether CSS/GSAP already solves it;
- verify licence and attribution;
- estimate bundle/GPU cost;
- ensure reduced-motion support;
- ensure unmount/timer/RAF cleanup;
- test desktop + mobile;
- record it in `CHANGELOG.md` and the final third-party source manifest.

## Phase 6 implementation checkpoint — 2026-08-18
The first real 3D phase used the locked custom stack only: Three.js + React Three Fiber + Drei + GSAP. No external animation-component library was installed for the core dish. The surrounding shell is custom ReserveUrTime UI. This validates the earlier strategy that Awwwards/GetLayers/Animmaster/Casberry/OriginKit are references rather than replacements for the food engine.


## Phase 7 implementation note
The full 3D menu/editor were implemented without adding another core animation framework. Three.js + React Three Fiber + Drei + GSAP remain the engine. External UI/animation sources continue to be design references or selective future micro-interaction sources only.


## Phase 9 decision
No external animation/icon runtime was added for Cart/Orders. The flow follows Mobbin/ScreensDesign-style clarity with existing local controls. Payment-critical Phase 10 was implemented with minimal, clarity-first motion and no new animation dependency.

# 19) Motion — https://motion.dev/
**What it provides:** production-grade React/JavaScript animation primitives including `motion` components, gestures, layout animation, viewport/scroll animation, Motion Values, AnimatePresence and `useReducedMotion`.

**ReserveUrTime decision: APPROVED RUNTIME LIBRARY — DOM/IMAGE MOTION LAYER.**

Implemented now:
- `motion` package with imports from `motion/react`;
- Photo Explode image-layer animation;
- public menu reveal/layout animation;
- reduced-motion-aware image motion.

Boundary:
- Motion handles DOM/SVG/image/UI motion.
- GSAP remains the true 3D mesh choreography timeline.
- R3F/Drei/Three.js remain the 3D rendering engine.
- Do not duplicate the same animation with Motion + GSAP at the same DOM node.

Useful official patterns for Phase 12: AnimatePresence, layout animation, hover/tap/focus gestures, Motion Values, scroll-linked animation and `useReducedMotion`.

## Core 3D priority reminder
External animation libraries remain secondary to the signature exploded dish. The canonical true-3D experience must remain operational before decorative polish is accepted. Current core: real GLB + named meshes + Three.js/R3F/Drei + GSAP; Motion handles DOM/image/Photo Explode only. Phase 13 must remove or defer decorative motion if it competes with 3D GPU/CPU/network budget.

