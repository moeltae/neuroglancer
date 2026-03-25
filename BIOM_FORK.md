# Biom Neuroglancer Fork

## Why

Biom needs a deep integration with Neuroglancer for volumetric scientific data (3D multichannel Zarr, precomputed, N5). The stock Neuroglancer works as a standalone viewer but doesn't integrate with Biom's UI, state management, or annotation system. A fork gives us full control over the rendering pipeline, UI, and data flow.

## Current State (2026-03-25)

- Fork created from `google/neuroglancer` at commit `4fe8d1c3`
- Upstream remote set to `google/neuroglancer` for pulling updates
- Biom currently loads neuroglancer as a pre-built UMD bundle from `/public/neuroglancer/`
- Basic integration exists in `NeuroglancerViewer.tsx` (~1000 lines) — creates viewer, adds layers, syncs some state
- Zarr v2 loading works via `|zarr2:` kvstore syntax but has issues with OME-NGFF metadata parsing
- Precomputed format datasource is in the bundle but untested end-to-end

## What We Intend To Do

### Phase 1: Build System Integration
- Build neuroglancer as an ES module that Vite can import directly (replace UMD bundle)
- Configure WASM/worker bundling to work with Vite's build pipeline
- Publish as `@biom/neuroglancer` npm package (private registry or local link)

### Phase 2: UI Customization
- Strip neuroglancer's built-in panels, toolbars, and controls
- Replace with Biom's sidebar controls (channel toggles, opacity, colormaps)
- Match Biom's design system (Radix UI + Tailwind + shadcn/ui)
- Custom layer control panel that integrates with Biom's `ImageLayerPanel`
- Remove neuroglancer's own settings/preferences UI

### Phase 3: State Bridge
- Bridge neuroglancer's internal state to Biom's Zustand stores
- Sync camera/navigation state with `viewportStore`
- Sync layer visibility/opacity with `viewportStore.imageLayers`
- Sync annotations with Biom's `annotationStore`
- Emit events that Biom's tools (rectangle, circle, pen) can consume

### Phase 4: Rendering Customization
- Custom annotation layer types that match Biom's annotation system (polygons, masks, keypoints)
- Segmentation overlay rendering with Biom's label colormap
- Custom shader modifications for Biom-specific visualization needs
- Measurement tools integration

### Phase 5: Data Source Enhancements
- Fix OME-NGFF coordinateTransformations parsing (graceful handling of malformed metadata)
- Add Biom Drive as a native data source (authenticated S3 via backend proxy)
- Support for BYOB bucket authentication flow
- Better error messages and fallback behavior for inaccessible data

## Architecture Notes

- Neuroglancer uses its own WebGL rendering pipeline — do NOT try to replace this with deck.gl
- State management is Signal-based (similar to SolidJS) — bridge to Zustand at boundaries
- The viewer creates its own WebGL context — must coexist with Biom's DeckGL context
- Worker-based chunk decompression (blosc, zstd) — keep this, it's good
- ~200K+ lines of TypeScript — be surgical, don't rewrite core rendering

## Key Directories in the Fork

- `src/` — main neuroglancer source
- `src/datasource/` — data source plugins (zarr, precomputed, n5)
- `src/layer/` — layer types (image, segmentation, annotation)
- `src/widget/` — UI components (panels, controls, sliders)
- `src/sliceview/` — 2D cross-section rendering
- `src/perspective_view/` — 3D projection rendering
- `src/annotation/` — annotation system

## Upstream Sync Strategy

- Periodically pull from `upstream/main` and merge
- Keep Biom-specific changes in clearly marked files/modules when possible
- Use feature flags for Biom-specific behavior where it touches shared code
- Tag upstream sync points for easy diffing
