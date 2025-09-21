// build the project
const configs: Bun.BuildConfig[] = [
  {
    entrypoints: ["index.ts"],
    outdir: "dist",
    target: "node",
    format: "esm",
    sourcemap: true,
    minify: true,
    naming: "index.mjs",
  },
  {
    entrypoints: ["index.ts"],
    outdir: "dist",
    target: "node",
    format: "cjs",
    sourcemap: true,
    minify: true,
    naming: "index.cjs",
  },
];

for (const config of configs) {
  await Bun.build(config);
}
