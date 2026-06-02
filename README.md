# Lenticular Raster

[中文版](./README.md)

> **Online Demo**: [https://kermit-r-wood.github.io/lenticular-uv-printing/](https://kermit-r-wood.github.io/lenticular-uv-printing/)

An in-browser lenticular image generator: upload 2 or more perspective images to generate an interlaced bottom image (8-bit RGB PNG) and a 16-bit varnish depth map (with 1440 PPI metadata) for UV printers like eufyMake E1. **Pure front-end, no server required. The build output `dist/index.html` can be double-clicked to run directly, or hosted on GitHub Pages or any static site.**

## Default Settings for eufyMake E1

- 1440 PPI output resolution (PNG `pHYs` chunk set to 56693 ppm)
- 330 mm × 420 mm print area validation
- 5 mm maximum relief height
- 16-bit varnish depth channel (sine and arc lens profiles)

## Development

Requires Node.js 22+ and npm.

```powershell
git clone <repo-url>
cd <repo>
npm install
npm run dev      # Start Vite dev server (defaults to http://localhost:5173)
```

## Testing

```powershell
npm test         # Unit tests + end-to-end sanity tests (output to out/)
```

51 unit tests covering: lens pitch / physical pixel mapping, sine + arc profiles, frame indexing by column/row, E1 bed size validation, PNG encoding (8-bit RGB + 16-bit grayscale) with pHYs DPI metadata, and calibration grid geometry.

## Build and Deployment

```powershell
npm run build    # Output to dist/, including index.html + assets/
```

`vite.config.ts` uses `base: "./"` to decouple the build from the deployment path:

- **Double-click `dist/index.html`**: Runs directly in the browser without an HTTP server.
- **GitHub Pages**: Configured with GitHub Actions for automatic deployment to the [Live Demo](https://kermit-r-wood.github.io/lenticular-uv-printing/).
- **Static Hosting**: Compatible with Netlify, Vercel, S3, nginx, or any custom path.

## Usage

Open the site and follow these steps:

1. **Generation**: Upload ≥2 perspective images, set width/height (mm), PPI, LPI, phase, and depth curve. Submit to preview the interlaced image and 16-bit depth map, and click links to download the two PNGs.
2. **Phase Calibration**: Expand the calibration section. Generate a grid of multiple LPI × multiple phase test blocks (rows = LPI, columns = phase) labeled in the top-left corner of each block. Printing this single grid helps identify the optimal parameters.

## Parameters

| Parameter | Description |
|---|---|
| Width / Height | Physical print size (mm). Soft limit of 100 mm × 100 mm (warns but allows). Forced validation for E1 bed size (330 × 420 mm). |
| PPI | Output resolution, defaults to 1440 |
| LPI | Lenticular lines per inch. Starts at `60`; if view switching is too steep, reduce to `30` / `40`. 1440 / 60 = 24 px/pitch |
| Phase | Lens pitch offset as a fraction of pitch. For example, `-0.125`, `0`, `0.25` |
| Curve | `sine` (sinusoidal) or `arc` (cylindrical cap), determines the depth map profile |
| Direction | `vertical` (left/right view switching) or `horizontal` (up/down view switching) |
| Max Depth Value | 16-bit grayscale upper limit. For example, `32768` limits depth to 50% relief height |

**First-time physical calibration tip**: Use a 20 mm block × multiple LPIs (`30, 40, 60`) × single phase `0` to find the lowest relief LPI that switches stably. Then sweep phases with the best LPI.

## Example Assets

`examples/ab-flip/` contains pre-made dual-view and triple-view source images that can be dragged into the web interface for testing:

- `A-left-view.png` / `B-right-view.png` / `C-center-view.png`
- `ab-flip-interlaced-42mm-60lpi.png` / `ab-flip-depth-42mm-60lpi.png` are legacy Python version outputs kept as visual references.

## Tech Stack

- TypeScript + Vite (vanilla, no UI framework)
- [pica](https://github.com/nodeca/pica) Lanczos3 resampling (~30 KB wasm)
- [fflate](https://github.com/101arrowz/fflate) deflate compression
- Custom PNG encoder (IHDR + pHYs + IDAT + IEND, ~150 lines)
- Custom CRC32 table
- Testing: vitest

Total runtime payload: ≈ 56 KB JS (gzip 23 KB) + 3 KB CSS.

## Known Limitations

- Computations run on the main thread, causing the page to freeze for a few seconds during rendering. This is acceptable for sizes ≤100 mm × 100 mm. For larger sizes, offloading to a Web Worker is planned for phase two.
- Canvas text labels at 1440 PPI are small (11 px ≈ 0.2 mm). They are barely legible on the calibration blocks. Adaptive LPI font sizing is planned for phase two to improve legibility.
- Uploading massive source images (4K+ JPG) consumes significant memory and slows down pica scaling. It is recommended to resize source images to 2–3x of the target resolution.
- The Lanczos3 implementation has minor differences compared to PIL's LANCZOS, resulting in scaling variances of ≤ 1 LSB (does not affect visual or lenticular quality).
