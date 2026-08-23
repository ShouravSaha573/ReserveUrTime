# ReserveUrTime — Remaining Phase Animation Map

The 18 researched design/animation sources remain a selective inspiration/tool pool, not a mandate to install every library.

## Phase 6 — DONE
Real GLB prototype with custom Three.js + React Three Fiber + Drei + GSAP.

## Phase 7 — DONE
Full 3D menu + Restaurant Admin 3D Animation Editor. Previous/Next, assembly/disassembly, adjacent preloading, mobile swipe and reduced-motion fallbacks are implemented.

## Phase 8 — DONE
Favourites/dashboard/profile use restrained local feedback only. Mobbin/ScreensDesign/Design Spells were flow/micro-interaction references; no new heavy motion dependency.

## Phase 9 — DONE
Cart/order UX uses restrained local CSS; clarity and safe state transitions take priority.

## Phase 10 — DONE
SSLCOMMERZ payment UI is intentionally clarity-first:
- no 3D/parallax/shader effect around amounts or gateway state;
- simple loading, verified, failed, pending and review messages;
- no additional animation dependency;
- reduced-motion remains respected by the global UI system.

## Phase 11 — DONE: Reviews + Contact/Messages + Notifications
Recommended references:
- **Mobbin + ScreensDesign** — proven messaging/review/notification flows;
- **Design Spells** — subtle success/error/micro-feedback;
- **useAnimations** — primary candidate for tiny status/notification icons;
- **Finsweet Lottieflow** — secondary portable Lottie JSON only if a specific state benefits;
- **daisyUI** — accessibility/form/dialog pattern reference, not public visual identity.

Rules:
- animate status acknowledgement, not content for decoration;
- do not let notification motion obscure unread/read truth;
- no autoplay-heavy Lottie lists;
- all non-essential motion disabled by `prefers-reduced-motion`.

## Phase 12 (DONE) — Cinematic UX Polish
Implemented using the existing Motion runtime + CSS rather than adding another decorative package. Shared chrome now includes scroll progress, route glint, accessible mobile navigation, Restaurant-card reveal/perspective/sheen, button/form/nav micro-interactions, mobile section-nav refinement and reduced-motion/transparency fallbacks. True GLB meshes remain GSAP/R3F/Drei/Three.js owned.

Primary references remain inspiration/benchmark only; no unverified third-party component code was copied into the phase.

## Phase 13 (NEXT) — Security/Performance/Reliability QA
No new decorative library. Profile CPU/GPU/network cost, WebGL memory, reduced motion, mobile DPR, offscreen suspension, cleanup, 3D fallback and animation-induced layout shifts.

## Phase 14 — Deployment + Final Documentation
Freeze animation stack, record licences/attributions/source inspirations, remove unused experiments, production-regress desktop/mobile/reduced-motion and document final asset pipeline.

## Motion.dev runtime update — implemented before Phase 12
Motion for React is now part of the approved runtime stack for DOM/image/UI animation. Phase 12 followed this rule: Motion handles page/section/chrome/DOM interactions while GSAP remains the true 3D mesh timeline engine. Photo Explode is already implemented as a Motion-powered 2.5D image-slice animation.



## Current stack before Phase 13
DOM/image motion: Motion 13.1.0. True GLB dishes: Three 0.185.1 + R3F 9.7.0 + Drei 10.7.8 + GSAP. Phase 13 must add no decorative animation dependency; it should profile and remove/regress effects that exceed CPU/GPU/network/accessibility budgets.

## Pre-Phase-13 exploded-3D corrective note
No new animation engine was added. The signature real-3D path remains Three.js + R3F + Drei + GSAP; Motion remains DOM/image motion. The corrective work makes that existing engine reliably reachable from legacy Atlas data and increases the default demo choreography visibility. Phase 13 should optimize/profile the current stack, not replace it.

