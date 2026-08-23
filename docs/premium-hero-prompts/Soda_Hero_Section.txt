# Recreate this site as a single HTML file: Soda

You are an expert creative front-end developer. Produce a **single self-contained `index.html`**
that reproduces the project below **exactly** — same layout, visuals, motion, and interaction.
Pure HTML/CSS/JS in one file: no build step, no framework, no bundler. Use CDN `<script>` tags for
the libraries actually used (GSAP, Google `<model-viewer>` web component). Hardcode every value
given here as a fixed constant. The CSS below can live in one `<style>` block in `<head>`; the
script in one `<script>` block before `</body>`.

## What it is

A full-viewport (no-scroll) hero landing page for a fictional "Diet Soda" beverage. A dark radial
gradient background (teal for the default "Classic" flavor, blue for the "Zero Lime" flavor) fills
the screen. A large 3D soda can floats in the center, rendered with Google's `<model-viewer>`, and
**tilts toward the cursor in real time**. Around it, dozens of 3D cherry/leaf models float and drift
with parallax, and are **repelled by the pointer** like a force field. Translucent PNG bubbles rise
endlessly from the bottom. A glassmorphism header sits on top; a left column has a giant cursive
headline + CTA + award badge; a right column has a two-card flavor carousel and a second headline.
Clicking a flavor card triggers a choreographed transition: the background color morphs, the can
spins 720° with a motion blur and swaps its base-color texture at the peak, and all the berry models
implode toward center, swap their model (cherry ↔ blueberry), then explode back out to new random
positions. Palette: near-black/teal/blue gradients, white text, a signature pink accent `#fbcfe8`.

## Page shell & libraries

In `<head>`:

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Diet Soda | Pure Zero Refreshment</title>
<meta name="description" content="Experience the crisp, clean taste of Diet Soda. Zero sugar, zero compromise.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Inter:wght@400;500&family=Manrope:wght@400;700&family=Galada&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
```

Fonts: body uses `'Inter'`, headings use `'Galada'` (cursive), nav items use `'Manrope'`. The page
does **not** scroll — `body { overflow: hidden; height: 100vh; }`.

### Global CSS (`:root` variables + reset + body)

```css
:root {
    --bg-color: #0a0a0a;
    --text-color: #ffffff;
    --accent-color: #ffffff;
    --muted-color: rgba(255, 255, 255, 0.7);
    --glass-bg: rgba(255, 255, 255, 0.05);
    --glass-border: rgba(255, 255, 255, 0.1);
    --font-main: 'Inter', sans-serif;
    --font-heading: 'Galada', cursive;

    /* Dynamic Background Variables */
    --bg-inner: #0b8a78;
    --bg-mid: #044e3b;
    --bg-outer: #011411;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background: radial-gradient(circle at center, var(--bg-inner) 0%, var(--bg-mid) 50%, var(--bg-outer) 100%);
    color: var(--text-color);
    font-family: var(--font-main);
    overflow: hidden; /* Remove scroll */
    height: 100vh;
    transition: background 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

body.blue-theme {
    --bg-inner: #0b4f8a;
    --bg-mid: #04294e;
    --bg-outer: #010c14;
}
```

## Layout & sections (in order)

The body, in order: `#bubbles-container`, `.header`, `main.hero` (containing all the floating models
and text), a hidden inline SVG `<filter id="frosted">`, and a hidden preload block.

### 1. Bubbles container

```html
<div id="bubbles-container"></div>
```

```css
#bubbles-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
}

.bubble-img {
    position: absolute;
    pointer-events: none;
}

@keyframes floatUpImg {
    0% {
        transform: translateY(0) translateX(0) rotate(0deg);
        opacity: 0;
    }
    10% { opacity: 0.4; }
    90% { opacity: 0.4; }
    100% {
        transform: translateY(-110vh) translateX(30px) rotate(360deg);
        opacity: 0;
    }
}
```

### 2. Header (glass nav)

```html
<header class="header">
    <div class="logo">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
            <path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span>Soda</span>
    </div>
    <nav class="nav glass">
        <a href="#" class="nav-item active">Home</a>
        <a href="#" class="nav-item">Ingredients</a>
        <a href="#" class="nav-item">Taste</a>
        <a href="#" class="nav-item">Eco</a>
        <a href="#" class="nav-item">Reviews</a>
    </nav>
    <button class="contact-btn">Contact Us</button>
</header>
```

```css
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 4%;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 100;
}

.logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    font-size: 1.2rem;
    font-family: var(--font-heading);
}

.nav {
    display: flex;
    gap: 0.5rem;
    background: var(--glass-bg);
    padding: 0.4rem;
    border-radius: 100px;
    border: 1px solid var(--glass-border);
}

.nav.glass {
    position: relative;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}

.nav-item {
    font-family: 'Manrope', sans-serif;
    color: var(--muted-color);
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 0.5rem 1.2rem;
    border-radius: 100px;
    transition: all 0.3s ease;
}

.nav-item:hover,
.nav-item.active {
    background: #fbcfe8;
    color: #011d17;
}

.contact-btn {
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    padding: 0.9rem 2rem;
    border-radius: 100px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: none;
}

.contact-btn:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: translateY(-2px);
    box-shadow: none;
}
```

### 3. Hero (`main.hero` → `.hero-content`)

The hero is a flex row spanning the viewport. Inside `.hero-content` (which is `position: relative`,
full height) live, in this DOM order: the leaves container, the left column, the background-berries
container, the center product, the foreground-berries container, and the right column.

```css
.hero {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4%;
    padding-top: 5rem;
}

.hero-content {
    display: flex;
    justify-content: space-between;
    align-items: stretch; /* Stretch columns to full height */
    width: 100%;
    max-width: 100%;
    padding: 0;
    height: 100%;
    position: relative;
}

/* Typography */
.main-title,
.side-title {
    font-family: var(--font-heading);
    font-size: clamp(5rem, 10vw, 12rem);
    line-height: 0.8;
    font-weight: 400;
    text-transform: none;
    white-space: nowrap;
    color: white;
    letter-spacing: normal;
}

.outline {
    color: var(--text-color);
}
```

#### 3a. Floating leaves (far background)

```html
<div class="leaves-container">
    <model-viewer class="leaf l1" src="LEAVES_GLB" environment-image="neutral" exposure="1.0" interaction-prompt="none" camera-orbit="45deg 75deg 105%"></model-viewer>
    <model-viewer class="leaf l2" src="LEAVES_GLB" environment-image="neutral" exposure="1.0" interaction-prompt="none" camera-orbit="-30deg 60deg 105%"></model-viewer>
    <model-viewer class="leaf l3" src="LEAVES_GLB" environment-image="neutral" exposure="1.0" interaction-prompt="none" camera-orbit="120deg 85deg 105%"></model-viewer>
    <model-viewer class="leaf l4" src="LEAVES_GLB" environment-image="neutral" exposure="1.0" interaction-prompt="none" camera-orbit="10deg 45deg 105%"></model-viewer>
</div>
```

(Replace `LEAVES_GLB` with the leaves asset URL from the Assets section.)

```css
.leaves-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: -1; /* Even further behind */
    transition: transform 0.1s ease-out;
}

.leaf {
    position: absolute;
    width: 60px;
    height: 60px;
    pointer-events: none;
    z-index: -1;
    filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.2));
}

.l1 { top: 10%; left: 15%; }
.l2 { top: 40%; left: 80%; width: 140px; height: 140px; opacity: 0.4; }
.l3 { top: 70%; left: 75%; width: 80px; height: 80px; }
.l4 { top: 85%; left: 20%; width: 120px; height: 120px; opacity: 0.3; }
```

#### 3b. Left column

```html
<div class="hero-left">
    <h1 class="main-title large-animation-1">
        <span class="outline">Pure</span><br>
        Zero
    </h1>
    <p class="description">
        Unleash the crisp taste of zero sugar. <br>
        Refreshment redefined in every bubble — <br>
        all in one sleek design.
    </p>
    <div class="cta-group">
        <button class="primary-btn">
            Shop Now
            <span class="plus-icon">+</span>
        </button>
    </div>
    <div class="award-badge">
        <div class="award-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15L15 18L19 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        </div>
        <div class="award-text">
            <span class="award-title">DESIGN AWARDS</span>
            <span class="award-subtitle">PREMIUM BEVERAGE 2025</span>
        </div>
    </div>
</div>
```

```css
.hero-left {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 6rem 0;
    gap: 2rem;
    z-index: 100;
}

@keyframes fadeInEntry {
    to { opacity: 1; transform: none; }
}

.description {
    color: var(--muted-color);
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 400px;
}

.primary-btn {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    padding: 0.4rem 0.4rem 0.4rem 1.5rem;
    border-radius: 100px;
    font-weight: 700;
    cursor: pointer;
    width: fit-content;
    transition: all 0.3s ease;
    box-shadow: none;
}

.primary-btn:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: translateY(-3px);
    box-shadow: none;
}

.plus-icon {
    background: #fbcfe8;
    color: #011d17;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 1.4rem;
    font-weight: 900;
    line-height: 1;
    padding-bottom: 2px; /* Compensate for baseline shift */
    border: none;
}

.award-badge {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: auto; /* Push to bottom */
}

.award-icon {
    width: 48px;
    height: 48px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.award-text { display: flex; flex-direction: column; }
.award-title { font-size: 0.7rem; letter-spacing: 0.1em; color: var(--muted-color); }
.award-subtitle { font-size: 0.85rem; font-weight: 600; }
```

#### 3c. Background berries (behind the can)

```html
<div class="berries-container-bg">
    <model-viewer class="berry b7" src="CHERRY_GLB" environment-image="neutral" exposure="1.0" interaction-prompt="none" camera-orbit="-20deg 110deg 105%"></model-viewer>
    <model-viewer class="berry b8" src="CHERRY_GLB" environment-image="neutral" exposure="1.0" interaction-prompt="none" camera-orbit="160deg 45deg 105%"></model-viewer>
    <model-viewer class="berry b9" src="CHERRY_GLB" environment-image="neutral" exposure="1.0" interaction-prompt="none" camera-orbit="45deg 20deg 105%"></model-viewer>
</div>
```

#### 3d. Center product (the 3D can)

```html
<div class="hero-center">
    <model-viewer id="product-model" src="DEIT_SODA2_GLB" alt="Diet Soda 3D Model" camera-controls
        disable-zoom shadow-intensity="0" environment-image="neutral" exposure="1.5"
        interaction-prompt="none" camera-orbit="0deg 90deg 380%" field-of-view="30deg"
        class="main-product-3d">
    </model-viewer>
</div>
```

```css
.hero-center {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    opacity: 0;
    animation: fadeIn 1.5s ease-out 0.3s forwards, float 6s ease-in-out infinite;
    pointer-events: none;
    background: radial-gradient(circle at center, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
}

@keyframes fadeIn { to { opacity: 1; } }

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
}

.main-product-3d {
    width: 80vw;
    height: 80vh;
    outline: none;
    --progress-bar-color: transparent;
    --poster-color: transparent;
    z-index: 1;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(25deg);
    pointer-events: none;
}

.main-product-3d[camera-controls] { pointer-events: auto; }
```

#### 3e. Foreground berries (above text and can)

```html
<div class="berries-container">
    <model-viewer class="berry b1" src="CHERRY_GLB" environment-image="neutral" exposure="1.2" interaction-prompt="none" camera-orbit="45deg 120deg 105%"></model-viewer>
    <model-viewer class="berry b2" src="CHERRY_GLB" environment-image="neutral" exposure="1.2" interaction-prompt="none" camera-orbit="-120deg 45deg 105%"></model-viewer>
    <model-viewer class="berry b3" src="CHERRY_GLB" environment-image="neutral" exposure="1.2" interaction-prompt="none" camera-orbit="200deg 90deg 105%"></model-viewer>
    <model-viewer class="berry b4" src="CHERRY_GLB" environment-image="neutral" exposure="1.2" interaction-prompt="none" camera-orbit="10deg 20deg 105%"></model-viewer>
    <model-viewer class="berry b5" src="CHERRY_GLB" environment-image="neutral" exposure="1.2" interaction-prompt="none" camera-orbit="-45deg 160deg 105%"></model-viewer>
    <model-viewer class="berry b6" src="CHERRY_GLB" environment-image="neutral" exposure="1.2" interaction-prompt="none" camera-orbit="80deg 75deg 105%"></model-viewer>
</div>
```

```css
.berries-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 110; /* Above text (100) and can (50) */
    transition: transform 0.1s ease-out;
}

.berries-container-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0; /* Behind everything */
    transition: transform 0.1s ease-out;
}

.berry {
    position: absolute;
    width: 120px;
    height: 120px;
    outline: none;
    --progress-bar-color: transparent;
    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
    transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.berry.no-animation { animation: none !important; }

.b1 { top: 25%; left: 30%; width: 220px; height: 220px; }
.b2 { top: 60%; left: 42%; width: 100px; height: 100px; }
.b3 { top: 30%; left: 62%; width: 250px; height: 250px; }
.b4 { top: 15%; left: 48%; width: 140px; height: 140px; }
.b5 { top: 75%; left: 20%; width: 120px; height: 120px; }
.b6 { top: 45%; left: 75%; width: 180px; height: 180px; }
.b7 { top: 15%; left: 40%; width: 80px; height: 80px; opacity: 0.7; }
.b8 { top: 50%; left: 55%; width: 70px; height: 70px; opacity: 0.6; }
.b9 { top: 80%; left: 35%; width: 75px; height: 75px; opacity: 0.7; }
```

#### 3f. Right column (flavor carousel + side title)

```html
<div class="hero-right">
    <div class="product-carousel">
        <div class="carousel-cards">
            <div class="card active" data-flavor="classic">
                <img src="GREEN_SODA_PNG" alt="Diet Classic">
                <div class="card-info">
                    <span>Diet Classic</span>
                    <span>$2.99</span>
                </div>
            </div>
            <div class="card" data-flavor="blue">
                <img src="BLUE_SODA_PNG" alt="Zero Lime" style="filter: brightness(0.7);">
                <div class="card-info">
                    <span>Zero Lime</span>
                    <span>$2.99</span>
                </div>
            </div>
        </div>
        <div class="carousel-nav">
            <button class="nav-arrow">←</button>
            <button class="nav-arrow">→</button>
        </div>
    </div>
    <h2 class="side-title large-animation-1">
        <span class="outline">Refreshingly</span><br>
        Clean
    </h2>
</div>
```

```css
.hero-right {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
    text-align: right;
    height: 100%;
    padding: 6rem 0;
    z-index: 100;
    width: 450px;
    pointer-events: none;
}

@keyframes fadeInLeft {
    to { opacity: 1; transform: translateX(0); }
}

.product-carousel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    align-items: flex-end;
    pointer-events: auto; /* Enable interaction */
}

.carousel-cards { display: flex; gap: 1rem; }

.card {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    padding: 1rem;
    padding-top: 5rem;
    border-radius: 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    width: 135px;
    position: relative;
    backdrop-filter: blur(10px);
    text-align: center;
}

.card:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.4);
}

.card.active {
    border-color: #fbcfe8;
    border-width: 1px;
    background: var(--glass-bg);
    box-shadow: none;
}

.card img {
    width: 140px;
    height: auto;
    margin-top: -8rem;
    filter: drop-shadow(0 20px 35px rgba(0, 0, 0, 0.5));
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    display: block;
    will-change: transform;
    pointer-events: none; /* Mouse passes through image to trigger card hover */
}

.card:hover img {
    transform: translateY(-30px) rotate(-12deg) scale(1.15) !important;
}

.card-info {
    display: flex;
    flex-direction: column;
    font-size: 0.7rem;
    width: 100%;
    word-wrap: break-word;
}

.card-info span:first-child { font-weight: 600; }
.card-info span:last-child { color: var(--muted-color); }

.carousel-nav { display: flex; gap: 1rem; }

.nav-arrow {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s;
}

.nav-arrow:hover { background: rgba(255, 255, 255, 0.1); }

.side-title { align-self: flex-end; text-align: right; }
```

### 4. Hidden frosted-glass SVG filter + model preload

After `</main>`, include this hidden SVG filter (declared for completeness; it is defined but not
actively applied to a visible element) and a hidden preload block so the cherry/blueberry models are
cached before a flavor switch:

```html
<svg style="position: absolute; width: 0; height: 0; opacity: 0; pointer-events: none;">
    <filter id="frosted">
        <feTurbulence type="fractalNoise" baseFrequency="0.0125" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="80" xChannelSelector="R" yChannelSelector="G" />
    </filter>
</svg>
<div style="display: none;">
    <!-- Preload berry models to avoid lag during switch -->
    <model-viewer src="BLUEBERRY_GLB"></model-viewer>
    <model-viewer src="CHERRY_GLB"></model-viewer>
</div>
```

Also add a `@keyframes shine` rule (declared in the stylesheet):

```css
@keyframes shine {
    from { transform: translateX(-100%) rotate(45deg); }
    to { transform: translateX(200%) rotate(45deg); }
}
```

### Responsive

```css
@media (max-width: 1200px) {
    .main-product-3d { width: 100vw; height: 60vh; top: 40%; }
}

@media (max-width: 1200px) {
    .hero-content { grid-template-columns: 1fr; padding-top: 8rem; }
    .hero-center { order: -1; }
    .main-title, .side-title { font-size: 5rem; }
    .hero-right { align-items: center; text-align: center; }
    .side-title { align-self: center; text-align: center; }
}
```

## The interactions / animation logic (copy VERBATIM)

This is the entire `<script>` block, placed before `</body>`. Reproduce it exactly. The only change
from the original is that the `.src` / `createTexture` paths point at the Assets-section URLs instead
of the relative `Models/…` and `Images/…` paths (see the `ASSET_BASE_URL` notes inline). Texture
swapping, the can spin, the berry implode/explode, mouse parallax, pointer repulsion of berries,
floating motion, and the bubble generator are all here.

```js
const modelViewer = document.querySelector('#product-model');
const berriesFG = document.querySelector('.berries-container');
const berriesBG = document.querySelector('.berries-container-bg');
const leavesBG = document.querySelector('.leaves-container');
const allBerries = document.querySelectorAll('.berry');
const cards = document.querySelectorAll('.card');
let isSwitching = false;
let switchSpin = 0;
let blueTexture = null;
let greenTexture = null;

// Preload textures & Warm up shaders
modelViewer.addEventListener('load', async () => {
    try {
        blueTexture = await modelViewer.createTexture('BLUE_BASE_COLOR_JPG');
        greenTexture = await modelViewer.createTexture('GREEN_BASE_COLOR_JPG');

        // Shader Warm-up: Briefly apply textures to compile shaders
        if (modelViewer.model) {
            const material = modelViewer.model.materials[0];
            if (material && material.pbrMetallicRoughness.baseColorTexture) {
                // Apply blue
                material.pbrMetallicRoughness.baseColorTexture.setTexture(blueTexture);
                await new Promise(r => requestAnimationFrame(r));
                // Apply green back
                material.pbrMetallicRoughness.baseColorTexture.setTexture(greenTexture);
            }
        }
    } catch (e) { console.error("Texture preload failed", e); }
});

cards.forEach(card => {
    card.addEventListener('click', () => {
        if (isSwitching) return;
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const flavor = card.dataset.flavor;
        switchFlavor(flavor);
    });
});

async function switchFlavor(flavor) {
    if (isSwitching) return;
    isSwitching = true;
    const body = document.body;
    const berries = document.querySelectorAll('.berry');
    const heroCenter = document.querySelector('.hero-center');

    // 1. Background Animation
    const targetColors = flavor === 'blue' ?
        { inner: '#0b4f8a', mid: '#04294e', outer: '#010c14' } :
        { inner: '#0b8a78', mid: '#044e3b', outer: '#011411' };

    gsap.to(body, {
        '--bg-inner': targetColors.inner,
        '--bg-mid': targetColors.mid,
        '--bg-outer': targetColors.outer,
        duration: 1.5,
        ease: 'power2.inOut'
    });

    // 2. Can Spin Animation (Simple 360 spin + blur with back settle)
    const spinObj = { val: 0, blur: 0 };
    gsap.to(spinObj, {
        val: 360,
        blur: 15,
        duration: 0.6,
        ease: "power2.in",
        onUpdate: () => {
            switchSpin = spinObj.val;
            modelViewer.style.filter = `blur(${spinObj.blur}px)`;
        },
        onComplete: async () => {
            // SWAP at peak
            if (flavor === 'blue') {
                body.classList.add('blue-theme');
                if (modelViewer.model && blueTexture) {
                    modelViewer.model.materials.forEach(material => {
                        if (material.pbrMetallicRoughness.baseColorTexture) {
                            material.pbrMetallicRoughness.baseColorTexture.setTexture(blueTexture);
                        }
                    });
                }
            } else {
                body.classList.remove('blue-theme');
                if (modelViewer.model && greenTexture) {
                    modelViewer.model.materials.forEach(material => {
                        if (material.pbrMetallicRoughness.baseColorTexture) {
                            material.pbrMetallicRoughness.baseColorTexture.setTexture(greenTexture);
                        }
                    });
                }
            }

            gsap.to(spinObj, {
                val: 720,
                blur: 0,
                duration: 1.5,
                ease: "back.out(0.7)",
                onUpdate: () => {
                    switchSpin = spinObj.val;
                    modelViewer.style.filter = `blur(${spinObj.blur}px)`;
                },
                onComplete: () => {
                    switchSpin = 0;
                    modelViewer.style.filter = 'none';
                }
            });
        }
    });

    // 3. Berries "Hide & Reveal" with Dynamic Positioning
    let completedBerries = 0;
    berries.forEach((berry, i) => {
        const bW = berry.offsetWidth / 2;
        const bH = berry.offsetHeight / 2;
        const centerX = (window.innerWidth / 2 - berry.offsetLeft - bW);
        const centerY = (window.innerHeight / 2 - berry.offsetTop - bH);

        const startAngle = parseFloat(berry.dataset.angle) || 0;
        const currentBaseX = parseFloat(berry.dataset.baseX) || 0;
        const currentBaseY = parseFloat(berry.dataset.baseY) || 0;

        // New random target position - Increased range for visibility
        const nextBaseX = (Math.random() - 0.5) * 200;
        const nextBaseY = (Math.random() - 0.5) * 200;

        gsap.set(berry, {
            rotation: startAngle,
            x: currentBaseX,
            y: currentBaseY
        });

        const berryTl = gsap.timeline();

        berryTl.to(berry, {
            x: centerX,
            y: centerY,
            rotation: startAngle + 45,
            scale: 0.1,
            opacity: 0,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
                berry.src = flavor === 'blue' ? 'BLUEBERRY_GLB' : 'CHERRY_GLB';
                heroCenter.style.zIndex = 50;
            }
        })
        .to(berry, {
            duration: 0.3
        })
        .to(berry, {
            onStart: () => {
                heroCenter.style.zIndex = 1;
            },
            x: nextBaseX,
            y: nextBaseY,
            rotation: startAngle + 90,
            scale: 1,
            opacity: 1,
            duration: 0.9,
            ease: "back.out(1.5)",
            onComplete: () => {
                berry.dataset.angle = startAngle + 90;
                berry.dataset.baseX = nextBaseX;
                berry.dataset.baseY = nextBaseY;
                berry.dataset.rx = 0;
                berry.dataset.ry = 0;

                completedBerries++;
                if (completedBerries === berries.length) {
                    isSwitching = false;
                }
            }
        });
    });
}


// Track berry states for smoothing
allBerries.forEach(b => {
    b.dataset.rx = 0; b.dataset.ry = 0; b.dataset.angle = Math.random() * 360;
    b.dataset.baseX = 0; b.dataset.baseY = 0;
    b.dataset.targetRx = 0; b.dataset.targetRy = 0;
});

let mouse = { x: 0, y: 0, px: 0, py: 0 };
let currentMouse = { x: 0, y: 0 };

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) - 0.5;
    mouse.y = (e.clientY / window.innerHeight) - 0.5;
    mouse.px = e.clientX;
    mouse.py = e.clientY;
});

function animate() {
    const time = Date.now() * 0.001;
    // Target camera position based on mouse
    // Smoothly interpolate current mouse to target mouse
    currentMouse.x += (mouse.x - currentMouse.x) * 0.05;
    currentMouse.y += (mouse.y - currentMouse.y) * 0.05;

    // Tilt the product can + add switch spin
    modelViewer.cameraOrbit = `${(currentMouse.x * 40) + switchSpin}deg ${90 + (currentMouse.y * 20)}deg 380%`;

    // Update parallax containers - Always
    berriesFG.style.transform = `translate(${currentMouse.x * 60}px, ${currentMouse.y * 60}px)`;
    berriesBG.style.transform = `translate(${currentMouse.x * -30}px, ${currentMouse.y * -30}px)`;
    leavesBG.style.transform = `translate(${currentMouse.x * -15}px, ${currentMouse.y * -15}px)`;

    // Update each berry with its own smoothing and float - ONLY IF NOT SWITCHING
    if (!isSwitching) {
        allBerries.forEach((berry, i) => {
            const berryRect = berry.getBoundingClientRect();
            const berryX = berryRect.left + berryRect.width / 2;
            const berryY = berryRect.top + berryRect.height / 2;

            const diffX = mouse.px - berryX;
            const diffY = mouse.py - berryY;
            const distance = Math.sqrt(diffX * diffX + diffY * diffY);

            let targetRx = 0, targetRy = 0, speedMult = 1;

            if (distance < 400) {
                const force = (400 - distance) / 400;
                targetRx = (diffX / distance) * force * -80;
                targetRy = (diffY / distance) * force * -80;
                speedMult = 1 + force * 5;
            }

            // Lerp repulsion values
            let rx = parseFloat(berry.dataset.rx) || 0;
            let ry = parseFloat(berry.dataset.ry) || 0;
            let angle = parseFloat(berry.dataset.angle) || 0;
            let baseX = parseFloat(berry.dataset.baseX) || 0;
            let baseY = parseFloat(berry.dataset.baseY) || 0;

            rx += (targetRx - rx) * 0.1;
            ry += (targetRy - ry) * 0.1;
            angle += 0.2 * speedMult;

            berry.dataset.rx = rx;
            berry.dataset.ry = ry;
            berry.dataset.angle = angle;

            // Floating effect
            const dur = [5, 7, 6, 8, 5.5, 6.5, 9, 11, 10][i % 9];
            const phase = (time + i * 0.7) * (Math.PI * 2 / dur);
            const floatY = Math.sin(phase) * 15;
            const floatAngle = Math.cos(phase) * 6;

            berry.style.transform = `translate(calc(${rx + baseX}px), calc(${ry + baseY}px + ${floatY}px)) rotate(calc(${angle}deg + ${floatAngle}deg))`;
        });
    }

    // Update leaves with float - ALWAYS
    document.querySelectorAll('.leaf').forEach((leaf, i) => {
        const dur = 10 + i * 2;
        const phase = (time + i * 1.2) * (Math.PI * 2 / dur);
        const floatY = Math.sin(phase) * 20;
        const floatX = Math.cos(phase * 0.5) * 15;
        const floatAngle = Math.sin(phase * 0.3) * 15;
        leaf.style.transform = `translate(${floatX}px, ${floatY}px) rotate(${floatAngle}deg)`;
    });

    requestAnimationFrame(animate);
}

animate();

// Bubbles Generator using bubble.png
const bubblesContainer = document.getElementById('bubbles-container');
function createBubble() {
    if (!bubblesContainer) return;
    const bubble = document.createElement('img');
    bubble.src = 'BUBBLE_PNG';
    bubble.className = 'bubble-img';
    const size = Math.random() * 20 + 10 + 'px';
    bubble.style.width = size;
    bubble.style.height = 'auto';
    bubble.style.left = Math.random() * 100 + '%';
    bubble.style.bottom = '-50px';
    bubble.style.opacity = Math.random() * 0.4 + 0.2;

    const duration = Math.random() * 6 + 4;
    bubble.style.animation = `floatUpImg ${duration}s linear forwards`;

    bubblesContainer.appendChild(bubble);
    setTimeout(() => bubble.remove(), duration * 1000);
}
setInterval(createBubble, 400);
```

## The loader / reveal

There is no separate loader screen. The reveal is the entrance of the 3D can: `.hero-center` starts
at `opacity: 0` and runs `animation: fadeIn 1.5s ease-out 0.3s forwards, float 6s ease-in-out
infinite` — so the can fades in over 1.5s (0.3s delay) while gently bobbing up and down ±20px forever
(`@keyframes float`). The `<model-viewer>` itself hides its default poster/progress bar via
`--progress-bar-color: transparent; --poster-color: transparent;`. Bubbles begin spawning at once
(every 400ms) and the mouse-driven `animate()` loop starts immediately, so the can begins tracking
the cursor as soon as the page loads. On load, the can's two base-color textures (green + blue) are
created and a one-frame shader warm-up applies blue then green so the first real flavor swap is
instant.

## Fixed parameters (bake these in)

- Default theme (Classic): `--bg-inner #0b8a78`, `--bg-mid #044e3b`, `--bg-outer #011411`.
- Blue theme (Zero Lime): `--bg-inner #0b4f8a`, `--bg-mid #04294e`, `--bg-outer #010c14`.
- Background morph on switch: `gsap.to(body, {...duration: 1.5, ease: 'power2.inOut'})`. Body CSS
  background transition: `1.2s cubic-bezier(0.4, 0, 0.2, 1)`.
- Pink accent: `#fbcfe8` (nav active, plus icon bg, active card border); accent text-on-pink `#011d17`.
- Can `<model-viewer>`: `camera-orbit="0deg 90deg 380%"`, `field-of-view="30deg"`, `exposure="1.5"`,
  `environment-image="neutral"`, `camera-controls disable-zoom shadow-intensity="0"`, base CSS
  `transform: translate(-50%,-50%) rotate(25deg)`, size `80vw × 80vh`.
- Can cursor tilt (per frame): `cameraOrbit = (currentMouse.x*40 + switchSpin)deg, (90 + currentMouse.y*20)deg, 380%`. Mouse smoothing lerp factor `0.05`.
- Spin transition: phase 1 → `val 360`, `blur 15px`, `duration 0.6`, `ease power2.in`; phase 2 →
  `val 720`, `blur 0`, `duration 1.5`, `ease back.out(0.7)`.
- Parallax multipliers: foreground berries `×60`, background berries `×-30`, leaves `×-15`.
- Berry pointer repulsion: radius `400px`, strength `-80`, lerp `0.1`, spin `angle += 0.2 * speedMult`,
  `speedMult = 1 + force*5`. Berry float amplitude `15px` Y / `6deg`; per-index durations
  `[5,7,6,8,5.5,6.5,9,11,10]`.
- Leaf float: amplitude `20px` Y, `15px` X, `15deg`; durations `10 + i*2`s.
- Berry implode/explode: implode `duration 0.5 ease power2.in` to center, `scale 0.1 opacity 0`; hold
  `0.3`; explode to random `±100px` (`(Math.random()-0.5)*200`) `duration 0.9 ease back.out(1.5)`.
- Bubbles: spawn every `400ms`, size `10–30px`, opacity `0.2–0.6`, rise duration `4–10s`, drift
  `+30px` X and `360deg` rotation over `-110vh`.
- Berry sizes/positions: b1 220px @25%/30%, b2 100px @60%/42%, b3 250px @30%/62%, b4 140px @15%/48%,
  b5 120px @75%/20%, b6 180px @45%/75%, b7 80px @15%/40% (0.7), b8 70px @50%/55% (0.6), b9 75px @80%/35% (0.7).
- Headlines: `font-family 'Galada'`, `font-size clamp(5rem, 10vw, 12rem)`, `line-height 0.8`.
- Card prices both `$2.99`; flavors `Diet Classic` (data-flavor="classic") and `Zero Lime`
  (data-flavor="blue", image `filter: brightness(0.7)`).
- Breakpoint: `max-width: 1200px`.

## Assets

`ASSET_BASE_URL = https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d`

Replace the placeholder tokens in the markup/script above with these full URLs (same materials,
scale, and usage):

- `LEAVES_GLB` → `https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/leaves.glb`
- `CHERRY_GLB` → `https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/cherry.glb`
- `BLUEBERRY_GLB` → `https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/blueberry.glb`
- `DEIT_SODA2_GLB` (the center can) → `https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/deit_soda2.glb`
- `GREEN_SODA_PNG` (Classic card) → `https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/Green Soda.png`
- `BLUE_SODA_PNG` (Zero Lime card) → `https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/Blue Soda.png`
- `GREEN_BASE_COLOR_JPG` (can texture, Classic) → `https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/green base color.jpg`
- `BLUE_BASE_COLOR_JPG` (can texture, Zero Lime) → `https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/blue base color.jpg`
- `BUBBLE_PNG` (rising bubbles) → `https://api.getlayers.ai/storage/v1/object/public/public/assets/soda-14ff8a788d/bubble.png`

(URL-encode spaces in filenames as `%20` if your environment requires it.)