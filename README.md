# Lenticular Raster

> **在线访问地址**：[https://kermit-r-wood.github.io/lenticular-uv-printing/](https://kermit-r-wood.github.io/lenticular-uv-printing/)

浏览器内运行的光栅画生成器：上传 2 张以上视角图片，生成底部交错图（8-bit RGB
PNG）和 16-bit 光油深度图（带 1440 PPI 元数据），用于 eufyMake E1 等 UV
打印机。**纯前端，不需要服务器，构建产物可以双击打开 `dist/index.html`
直接用，也可托管到 GitHub Pages 或任意静态站点。**

## 默认面向 eufyMake E1

- 1440 PPI 输出分辨率（PNG `pHYs` chunk 写入 56693 ppm）
- 330 mm × 420 mm 打印面积校验
- 5 mm 最大浮雕高度
- 16-bit 光油深度通道（sine / arc 两种透镜剖面）

## 开发

需要 Node.js 22+ 和 npm。

```powershell
git clone <repo-url>
cd <repo>
npm install
npm run dev      # 启动 Vite 开发服务器（默认 http://localhost:5173）
```

## 测试

```powershell
npm test         # 单元测试 + 端到端 sanity（输出到 out/）
```

51 个单元测试覆盖：lens 周期 / 像素物理映射、sine + arc 剖面、按列与按行的
帧索引、E1 床尺寸校验、PNG 编码 (8-bit RGB + 16-bit 灰度) 与 pHYs DPI 元数据、
校准网格几何。

## 构建与部署

```powershell
npm run build    # 产出 dist/，包含 index.html + assets/
npm run preview  # 本地预览生产构建
```

`vite.config.ts` 中 `base: "./"` 让 `dist/` 与部署路径解耦：

- **双击 `dist/index.html`** —— 直接在浏览器跑，不需要 HTTP 服务器
- **GitHub Pages** —— 已配置 GitHub Actions 自动部署至 [在线地址](https://kermit-r-wood.github.io/lenticular-uv-printing/)，无需手动维护分支
- **静态托管** —— Netlify / Vercel / S3 / nginx 任意路径都能用

## 用户操作

打开站点后：

1. **生成** —— 上传 ≥2 张视角图片，填宽高（mm）、PPI、LPI、相位、深度曲线，
   提交后预览交错图和 16-bit 深度图，点链接下载两张 PNG。
2. **相位校准** —— 折叠区域里展开。一次生成多个 LPI × 多个相位的测试块拼图
   （行 = LPI，列 = 相位），每块左上角带文字标签。打印一张就能挑出最佳参数。

## 参数说明

| 参数 | 说明 |
|---|---|
| 宽 / 高 | 物理打印尺寸（毫米）。当前软上限 100 mm × 100 mm，超过会弹警告但仍允许。E1 床上限 330 × 420 mm 强制校验。 |
| PPI | 输出分辨率，默认 1440 |
| LPI | 透镜每英寸线数。`60` 起步；视角切换太陡可降到 `30` / `40`。1440 / 60 = 24 px/pitch |
| 相位 | 透镜节距偏移，单位为节距比例。例如 `-0.125`、`0`、`0.25` |
| 曲线 | `sine`（正弦）或 `arc`（圆弧 cap），决定深度图剖面 |
| 方向 | `vertical` 左右视角切换 / `horizontal` 上下视角切换 |
| 最大深度值 | 16-bit 灰度上限。例如 `32768` 限制成 50% 浮雕高 |

第一次物理校准建议：用 20 mm 块 × 多 LPI（`30,40,60`）× 单相位 `0`，找出最低
浮雕能稳定切换的 LPI；然后用最佳 LPI 扫相位定位。

## 示例素材

`examples/ab-flip/` 里有现成的双视角和三视角源图，可以直接拖进网页测试：

- `A-left-view.png` / `B-right-view.png` / `C-center-view.png`
- `ab-flip-interlaced-42mm-60lpi.png` / `ab-flip-depth-42mm-60lpi.png` 是
  早期 Python 版本的示例输出，作为视觉参考保留

## 技术栈

- TypeScript + Vite（vanilla，没有 UI 框架）
- [pica](https://github.com/nodeca/pica) Lanczos3 重采样（约 30 KB wasm）
- [fflate](https://github.com/101arrowz/fflate) deflate 压缩
- 自写 PNG 编码器（IHDR + pHYs + IDAT + IEND，~150 行）
- 自写 CRC32 表
- 测试：vitest

总运行时 payload ≈ 56 KB JS（gzip 23 KB）+ 3 KB CSS。

## 已知限制

- 计算放在主线程，渲染期间页面会有几秒卡顿。≤100 mm × 100 mm 体感可接受；
  更大尺寸建议二期挪到 Web Worker。
- Canvas 文字标签在 1440 PPI 下偏小（11 px ≈ 0.2 mm）。校准块上肉眼勉强能
  辨认，需要更清晰可二期做 LPI 自适应字号。
- 上传超大源图（4K+ JPG）`createImageBitmap` 会占内存高，pica 缩放也耗时。
  建议源图压到目标分辨率 2–3 倍以内。
- Lanczos3 实现细节与 PIL 的 LANCZOS 不完全一致，缩放结果有 ≤ 1 LSB 量级
  的差异（不影响视觉与光栅效果）。
