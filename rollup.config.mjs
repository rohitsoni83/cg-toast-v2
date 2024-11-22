import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "rollup-plugin-esbuild";
import dts from "rollup-plugin-dts";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import json from "@rollup/plugin-json";
import packageJson from "./package.json" assert { type: "json" };

// Helper function to add "use client" for relevant builds
const clientBanner = '"use client";';

export default [
  // Main build for library
  {
    input: "src/index.ts",
    output: [
      {
        file: packageJson.main, // CommonJS output
        format: "cjs",
        sourcemap: true,
        banner: clientBanner, // Add "use client" for Node.js consumers
      },
      {
        file: packageJson.module, // ESM output
        format: "esm",
        sourcemap: true,
        banner: clientBanner, // Add "use client" for modern tools
      },
    ],
    plugins: [
      peerDepsExternal(), // Exclude peer dependencies like React from the bundle
      resolve(), // Resolve node modules
      commonjs(), // Convert CommonJS modules to ES6
      esbuild({
        target: "esnext",
        jsx: "automatic", // JSX transformation for React
        banner: clientBanner, // Add "use client" for ESM and CJS builds
      }),
      json(), // Support for importing JSON files
    ],
    external: [
      ...Object.keys(packageJson.peerDependencies || {}), // Mark peer dependencies as external
    ],
  },

  // Build for headless version (no UI, logic-only)
  {
    input: "src/headless/index.ts",
    output: [
      {
        file: "headless/index.cjs.js",
        format: "cjs",
        sourcemap: true,
      },
      {
        file: "headless/index.esm.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      esbuild({
        target: "esnext",
        jsx: "automatic",
      }),
      json(),
    ],
    external: [...Object.keys(packageJson.peerDependencies || {})],
  },

  // TypeScript declaration files
  {
    input: "src/index.ts",
    output: {
      file: packageJson.types,
      format: "esm",
    },
    plugins: [dts()],
  },
];
