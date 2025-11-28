import { build, context } from "esbuild";

const watch = process.argv.includes("--watch");

const config = {
  bundle: true,
  entryPoints: ["src/main.ts"],
  format: "esm",
  logLevel: "info",
  minify: false,
  outdir: "dist",
  platform: "browser",
  sourcemap: true,
  target: ["es2021"],
  treeShaking: true,
  tsconfig: "tsconfig.json"
};

if (watch) {
  const ctx = await context(config);
  await ctx.watch();
  // eslint-disable-next-line no-console
  console.log("Watching frontend for changes...");
} else {
  await build(config);
  // eslint-disable-next-line no-console
  console.log("Built frontend to dist/");
}
