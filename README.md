# Market Town: State of the US Market

### 🔗 Live: **[koktongkt.github.io/market-town](https://koktongkt.github.io/market-town/)**

A scroll-driven 3D toy-town diorama that turns a snapshot of the US market into a tiny floating island. Scroll to fly the camera through 8 chapters:

1. **Overview**: title, data date and as-of note
2. **Downtown**: index towers (S&P 500, Nasdaq, Dow, …); height = YTD change
3. **Sector Ring · East**: growth and cyclical sector districts
4. **Sector Ring · West**: defensive and rate-sensitive districts (building height = YTD, tint = 1-month direction, signposts with ETF stats)
5. **Market Square**: CPI price board and balloon
6. **Rates Ride**: rollercoaster through Fed funds → 2Y → 10Y
7. **The Jobs Works**: factory for unemployment and commodities
8. **Town Forecast**: weather set by overall market mood, risk clouds, and the list of sources

Missing values show as `n/a`.

## Controls

Buttons sit in the top-right corner.

**Story mode (default):** scroll or swipe to move between chapters.
- **Look around:** drag with the mouse, or use a two-finger drag on touch, to tilt and rotate the view around the chapter's focus (within limits).
- **Zoom:** use Ctrl + wheel or a trackpad pinch, a two-finger pinch on touch, or the **＋ / －** buttons. A plain wheel still scrolls the story.
- **⟲ Reset view:** restores the chapter's framing. Changing chapters also resets the view smoothly.

**🧭 Free view:** detaches the camera from scrolling.
- Drag to rotate. Right-drag or a two-finger drag pans. Wheel or pinch zooms (distance and angle are limited, so the camera stays above the island).
- **WASD / arrow keys** move around.
- **✕ Exit free view** glides back to the current chapter's camera.

## Data

Everything comes from `public/data.json`, which is fetched at runtime (no-store). Top-level keys: `as_of`, `as_of_note`, `generated_at_utc`, `indices`, `sectors`, `macro`, `mood`, `risks`, `themes`, `sources`, and notes. To update the town, replace this file and rebuild.

## Tech stack

- [Vite](https://vitejs.dev/) + React 18
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) / three.js, with [drei](https://github.com/pmndrs/drei) (Text, Environment, Clouds)
- [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing): N8AO, SMAA, Bloom, Vignette
- GSAP ScrollTrigger for scroll-linked camera and overlay animation
- Fredoka and Inter fonts via @fontsource

Source lives in `src/` (`App.jsx` overlay and chapters, `Scene.jsx` world, `Crowd.jsx`, `tex.js` procedural textures, `data.js` loader and helpers). `ART_DIRECTION.md` covers the design notes.

## Run locally

```bash
npm install
npm run dev      # dev server on http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the build on http://localhost:4173
```

## Deploy

Every push to `main` runs `.github/workflows/pages.yml`, which runs `npm ci && npm run build` and deploys `dist/` to GitHub Pages. You can also start it by hand with *Run workflow* (workflow_dispatch). Vite uses `base: './'`, so assets resolve under `/market-town/`.
