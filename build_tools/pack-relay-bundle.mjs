#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Relay Sci.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Assembles the UMD library build (`npm run build:library`) into a standalone
// npm package, `@relay-sci/neuroglancer`, ready for `npm publish`.
//
// This deliberately does NOT publish the fork's own package.json. That manifest is
// rewritten in place by build_tools/build-package.ts during `prepack`, and its
// `exports` map forces `lib/` (1137 ESM files) into any tarball while `/dist/` is
// excluded by .gitignore. Assembling a separate manifest sidesteps all of it and
// keeps upstream merges clean.
//
// Sourcemaps are excluded. Relay serves this bundle from a public path, and the
// fork's maps embed full sourcesContent.
//
// Usage:
//   npm run build:library
//   node build_tools/pack-relay-bundle.mjs [version]
//   npm publish dist/relay-package   # -> GitHub Packages (@relay-sci scope)
//
// Version resolution, in order: argv[2], $RELAY_NG_VERSION, then
// `<package.json version>-relay.1`.

import {
  readFile,
  writeFile,
  mkdir,
  rm,
  readdir,
  copyFile,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const libraryDir = join(rootDir, "dist", "library");
const outDir = join(rootDir, "dist", "relay-package");

if (!existsSync(libraryDir)) {
  console.error(`[pack-relay-bundle] missing ${libraryDir}`);
  console.error("[pack-relay-bundle] run: npm run build:library");
  process.exit(1);
}

const forkPkg = JSON.parse(
  await readFile(join(rootDir, "package.json"), "utf8"),
);
// `||` rather than `??`: CI passes an empty string when not building a tag, and an
// empty version must fall through to the default rather than produce `@…@""`.
// A leading `v` is stripped so a git tag (`v2.41.2-relay.1`) can be passed verbatim.
const requestedVersion =
  process.argv[2] ||
  process.env.RELAY_NG_VERSION ||
  `${forkPkg.version}-relay.1`;
const version = requestedVersion.replace(/^v/, "");

if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`[pack-relay-bundle] not a valid semver version: ${version}`);
  process.exit(1);
}

const bundlePath = join(libraryDir, "neuroglancer.bundle.js");
if (!existsSync(bundlePath)) {
  console.error(`[pack-relay-bundle] missing ${bundlePath}`);
  process.exit(1);
}

// Guard: the OME-NGFF scale-transform fallback must survive minification. Losing it
// silently breaks datasets whose `type: "scale"` transform stores its array under a
// misnamed key. See src/datasource/zarr/ome.ts (parseScaleTransform).
const bundle = await readFile(bundlePath, "utf8");
if (!/void 0===[A-Za-z_$]{1,4}\.scale/.test(bundle)) {
  console.error(
    "[pack-relay-bundle] scale-transform fallback missing from the built bundle.",
  );
  console.error("[pack-relay-bundle] refusing to package a regressed build.");
  process.exit(1);
}

await rm(outDir, { recursive: true, force: true });
const distDir = join(outDir, "dist");
await mkdir(distDir, { recursive: true });

let copied = 0;
for (const name of await readdir(libraryDir)) {
  if (name.endsWith(".map")) continue;
  await copyFile(join(libraryDir, name), join(distDir, name));
  copied++;
}

await writeFile(
  join(outDir, "package.json"),
  JSON.stringify(
    {
      name: "@relay-sci/neuroglancer",
      version,
      description:
        "Prebuilt UMD Neuroglancer bundle (Relay fork). Exposes window.neuroglancer.",
      license: "Apache-2.0",
      repository: {
        type: "git",
        url: "git+https://github.com/Relay-Sci/neuroglancer.git",
      },
      publishConfig: { registry: "https://npm.pkg.github.com" },
      files: ["dist"],
    },
    null,
    2,
  ) + "\n",
);

for (const name of ["LICENSE", "README.md"]) {
  if (existsSync(join(rootDir, name))) {
    await copyFile(join(rootDir, name), join(outDir, name));
  }
}

console.log(
  `[pack-relay-bundle] @relay-sci/neuroglancer@${version} -> ${outDir} (${copied} files, no sourcemaps)`,
);
