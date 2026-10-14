# State of the US Market: Art Direction v2, "Market Town"

## Concept
The whole report is ONE cozy low-poly toy-town diorama sitting on a floating island. A narrow-FOV camera with an isometric feel glides through it on scroll. Every figure lives *in the world* as a signpost, billboard or banner. The HTML overlay is minimal and only carries chapter titles, one line of context and sources.

## Look
- Low-poly, flat-shaded, rounded toy blocks with soft shadows (PCF soft) and a warm hemisphere fill.
- Postprocessing: SMAA, gentle bloom on windows and lights, tilt-shift to sell the miniature, and a subtle vignette.
- Palette: cream ground `#F4E9D2`, grass `#9ED07A`, road `#6B6A7A`, water `#7CC4FF`. Up = mint `#5ED6A0`, down = coral `#FF7A6B`, signs butter `#FFD66B`, ink `#2B2440`, accent lilac `#B9A4FF`.
- Type: Fredoka (titles), Inter (numbers). In-world signs use drei Text on wooden or cream boards.

## Map (top-down)
- **Market Square (centre):** a fountain, a CPI price billboard, and the CPI hot-air balloon tethered above it. A ghost "forecast" balloon only appears if CPI is still August.
- **Downtown (north):** 4 index landmark towers (S&P, Nasdaq, Dow, Russell). Height = YTD; the crown colour shows the 1M sign; each has a rooftop sign.
- **Sector ring:** 11 districts around a ring road. Each district has 3–5 buildings: height scales with YTD, colour with 1M, and "mood" faces (smile or frown) plus lit windows when up. Each has a signpost with the sector, ETF, YTD and 1M. Trees, people and parked cars fill the gaps.
- **Theme park (east):** a rollercoaster whose three peaks are Fed funds, 2Y and 10Y, with flags. A cart loops around it.
- **Factory (west):** a factory with chimneys puffing smoke. Workers walk in; the share marching *out* (coral) = the unemployment rate. A sign gives the rate.
- **Sky:** weather set by `mood.overall` (bull = clear sun, neutral = scattered clouds, bear = storm clouds and dim light). Risks float as grey clouds with labels.

## Scroll / camera stops (day to dusk)
1. Overview: high orbit over the island at morning. Title.
2. Downtown towers.
3. Sector ring A (tech/energy side).
4. Sector ring B (defensives/rate-sensitive side).
5. Market Square: CPI billboard and balloon, at noon.
6. Theme park rollercoaster: rates, in the afternoon.
7. Factory: jobs, at golden hour.
8. Sky pull-back: outlook, weather, risks, at dusk with streetlights on. Sources in the overlay.

## Ambient
Cars loop the ring road, birds circle, smoke puffs rise and fade, the balloons bob, the coaster cart runs, and people bob as they walk. All of it is instanced or kept to a low count so it stays smooth.

## Data
Runtime fetch of `/data.json` (a symlink to `/workspace/market-report/data.json`, no-store). Nulls show as "n/a" and fall back to neutral geometry.

---
# v3: "High-end miniature diorama" pass
- **Materials (PBR, procedural canvas textures, offline):** façades come in brick, concrete and glass curtain-wall. Each has a colour map, a roughness/metalness map (glass is smooth and reflective) and an emissive window map that lights up at dusk. Façade UVs are world-scaled so windows stay a consistent size. There's also asphalt with kerbs, square paving, grass, island rock and concrete. District tint still encodes 1M direction; height encodes YTD.
- **Lighting:** a warm sun with a day-to-dusk arc and soft PCF shadows. A procedural drei `<Environment>` built from Lightformers (no HDRI download, works offline) supplies the reflections. A low hemisphere fill and atmospheric fog tint with the sky.
- **Post:** N8AO ambient occlusion (half-res), SMAA, gentle bloom on lamps, windows and beacons, and a light vignette. Tilt-shift was removed so text stays sharp.
- **Typography:** bundled Fredoka and Inter woff in `/public/fonts`. Signs have an ink border and a slightly self-lit face so they read at dusk.
- **Townsfolk (fully instanced, about 300):** walkers (some with shopping bags), joggers, dog-walkers, bench-sitters, chatting pairs, stall shoppers, cyclists on the bike lane, wavers, a factory queue, and coral job-hunters leaving the factory. Shirt, trousers, skin, hair and hat vary, and some are kids. The mix differs by district: up districts get joggers, wavers and dog-walkers, down districts get chatters and slow walkers.
- **Street props (instanced):** lamps, benches, planters, rooftop AC units, water tanks, about 200 trees (conifer and round), and market stalls.
- **Labels:** sector signs are bigger and show sector / ETF / YTD / 1M. Hovering a sign shows the full take, and the East/West chapter cards list every take in full. Index labels sit above each tower.
