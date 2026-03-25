/**
 * Rspack config for building neuroglancer as a UMD library bundle.
 *
 * Usage:
 *   npm run build:library
 *
 * Output: dist/library/neuroglancer.bundle.js
 *
 * The bundle exposes `window.neuroglancer` with:
 *   - Viewer, makeMinimalViewer, makeDefaultViewer
 *   - NeuroglancerExternalEvents, NeuroglancerExternalControl (Biom integration)
 *
 * This config is merged with rspack.config.ts via the CLI's --config flag.
 */

import path from "node:path";
import type { Configuration } from "@rspack/core";

const config: Configuration = {
  entry: {
    neuroglancer: "./src/main_module.ts",
  },
  output: {
    path: path.resolve(import.meta.dirname, "dist", "library"),
    filename: "[name].bundle.js",
    chunkFilename:
      "[name].neuroglancer.bundle.js",
    library: {
      name: "neuroglancer",
      type: "umd",
    },
    globalObject: "globalThis",
    asyncChunks: true,
    clean: true,
  },
  experiments: {
    css: true,
  },
  // No HTML plugin needed for library build
  plugins: [],
  optimization: {
    splitChunks: {
      chunks: "async" as const,
    },
  },
};

export default config;
