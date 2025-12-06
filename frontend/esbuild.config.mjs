import { cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build, context } from "esbuild";

const translationsSourcePath = fileURLToPath(new URL("./translations/", import.meta.url));
const translationsTargetPath = fileURLToPath(new URL("../custom_components/maint/frontend/translations/", import.meta.url));

const watch = process.argv.includes("--watch");

const config = {
  bundle: true,
  entryPoints: ["src/main.ts"],
  format: "esm",
  logLevel: "info",
  minify: false,
  outdir: "../custom_components/maint/frontend",
  platform: "browser",
  plugins: [
    {
      name: "copy-translations",
      setup(build) {
        build.onEnd(async () => {
          await cp(translationsSourcePath, translationsTargetPath, {
            recursive: true,
            force: true
          });
          // eslint-disable-next-line no-console
          console.log(`Copied translations to ${translationsTargetPath}`);
        });
      }
    }
  ],
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
  console.log("Built frontend to custom_components/maint/frontend/");
}
