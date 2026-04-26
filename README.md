# 🌌 Solar System — Interactive 3D Experience

An interactive, browser-based 3D solar system built with Next.js, Three.js, and TypeScript.

---

## ✨ Features

- 3D renderings of all 8 planets, Pluto, the Sun, and Earth's Moon
- Realistic orbital speeds based on actual astronomical data
- Clickable planets with info panels (type, atmosphere, day/year length)
- Smooth camera zoom on planet selection
- Animated asteroid belt between Mars and Jupiter (4,000 instanced meshes)
- Moon orbiting Earth in real time
- Animated cloud layer on Earth
- Animated, textured Sun with emissive glow
- Saturn's rings rendered as a separate mesh
- Pause / Play and speed multiplier controls (0.25× – 8×)
- Toggle orbit rings on/off
- Cinematic intro screen with fly-in zoom on Enter
- Futuristic UI — Orbitron + Rajdhani fonts, frosted glass panels

---

## 🗂 Project Structure

```
solarsystem/
├── app/
│   └── page.tsx              # Main scene — Three.js setup, planets, UI, tooltips
├── lib/
│   ├── celestialData.js      # Planet data (radius, orbit period, atmosphere, descriptions)
│   ├── scale.js              # scaleDistanceAU() and scaleRadius() helpers
│   └── textures.js           # Textured mesh factories for each planet + asteroid belt
├── public/
│   └── textures/
│       ├── earth/            # earth_day, earth_night, earth_clouds, normal, specular
│       ├── space/            # milky way background, sun texture
│       └── [planet]/         # Individual planet texture maps
└── README.md
```

---

## 🪐 Planet Data

All data related to the planets lives in `lib/celestialData.js` and includes:

| Field | Description |
|-------|-------------|
| `AU` | Distance from Sun in astronomical units |
| `radius_km` | Real radius in km (scaled for rendering) |
| `orbital_period_days` | Used to compute relative orbit speeds |
| `axis_rotation_period_hours` | Displayed in the info panel |
| `atmosphere_composition` | Array of gas names |
| `description` | Long-form paragraph shown in the right tooltip |
| `Nickname` | Shown as a subtitle in the left tooltip |

---

## ⚙️ Scaling

Defined in `lib/scale.js`:

- `scaleDistanceAU(au)` — converts AU to Three.js scene units
- `scaleRadius(km)` — converts real km radius to scene units

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🛠 Tech Stack

- [Next.js 14](https://nextjs.org/)
- [Three.js](https://threejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Google Fonts — Orbitron & Rajdhani](https://fonts.google.com/)

---

*Tebello Rose — 2026*
