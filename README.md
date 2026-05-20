# Lenticular Raster

Python CLI for generating lenticular interlaced images and standalone 16-bit
UV gloss depth maps. The defaults target the eufyMake E1 preset:

- 1440 PPI output resolution
- 330 mm x 420 mm flatbed printable area check
- vertical lenticular lenses for left-right view changes
- 16-bit grayscale PNG depth map output

The eufyMake E1 preset is based on the official published spec page, which
lists 1440 DPI print resolution, 330 mm x 420 mm printing surface area, and
5 mm max embossed print height.

## Install

Install [uv](https://docs.astral.sh/uv/getting-started/installation/) first,
then clone and run:

```powershell
git clone git@github.com:kermit-r-wood/lenticular-uv-printing.git
cd lenticular-uv-printing
uv run pytest
```

`uv` handles the virtual environment and dependencies automatically. No
separate `pip install` step is needed.

## Run the Web App

```powershell
uv run lenticular-raster-web --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000` in a browser. The web app provides:

- **生成** — upload source images and set eufyMake E1 print parameters
- **相位校准** — generate a multi-LPI × multi-phase calibration grid in one job
- a preview page for checking the generated interlaced image and depth map
- download links for `interlaced.png` and `depth.png`

Generated jobs are saved under `outputs/jobs/<job-id>/`.

## Create a 2-Image Flip

```powershell
uv run lenticular-raster make `
  --input .\image-a.png `
  --input .\image-b.png `
  --out-interlaced .\out\flip-interlaced.png `
  --out-depth .\out\flip-depth.png `
  --width-mm 42 `
  --height-mm 42 `
  --lpi 60
```

The command writes:

- `flip-interlaced.png`: the bottom color image layer
- `flip-depth.png`: the 16-bit grayscale UV gloss/depth layer

Generated PNG files include DPI metadata matching `--ppi`. This helps UV
software that infers physical size from image resolution import the file at the
intended millimeter size instead of defaulting to 72 DPI.

## Output Only the Depth Map

```powershell
uv run lenticular-raster depth `
  --out-depth .\out\depth-42mm-60lpi.png `
  --width-mm 42 `
  --height-mm 42 `
  --lpi 60
```

## Generate a Phase and LPI Calibration Grid

Prints a grid of test blocks (rows = LPI values, columns = phase values) to
find the best parameters in a single print job.

```powershell
uv run lenticular-raster calibrate `
  --input .\examples\ab-flip\A-left-view.png `
  --input .\examples\ab-flip\B-right-view.png `
  --input .\examples\ab-flip\C-center-view.png `
  --out-interlaced .\out\calib-interlaced.png `
  --out-depth .\out\calib-depth.png `
  --block-mm 20 `
  --lpis 30,40,60 `
  "--phases=0"
```

Each block is labeled with its LPI and phase value. The output is a single
wide image: one row per LPI, one column per phase. Print both files together
and observe which block shows the clearest view switching.

The `examples/ab-flip/` directory contains ready-to-use test images:

- `A-left-view.png` — blue letter A, left view
- `B-right-view.png` — red letter B, right view
- `C-center-view.png` — green letter C, center view
- `ab-flip-interlaced-42mm-60lpi.png` — example 2-frame interlaced output
- `ab-flip-depth-42mm-60lpi.png` — example depth map output

## Useful Parameters

- `--lpi`: lenticular pitch, lines per inch. Start with `60`; try `30` or `40`
  if the flip effect is only visible at extreme angles.
- `--lpis`: comma-separated LPI values for calibration grid, e.g. `30,40,60`.
- `--ppi`: output pixels per inch. Defaults to `1440` for eufyMake E1.
- `--phase`: phase offset in lens pitches, for example `-0.125`, `0`, `0.25`.
- `--phases`: comma-separated phase values for calibration grid.
- `--block-mm`: size of each calibration block in mm. Default `20`.
- `--profile`: `sine` or `arc` lens height profile.
- `--orientation`: `vertical` for left-right view changes, `horizontal` for up-down.
- `--max-depth-value`: cap the 16-bit height value, for example `32768` for 50%.

For first physical calibration, print a 20 mm calibration grid with
`--lpis 30,40,60` and `--phases 0` to find the best LPI at the printer's
minimum emboss height. Then scan phase if switching is visible but not clean.
