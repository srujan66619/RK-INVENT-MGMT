import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(async ({ command, mode }) => {
  // Inject VITE_* env vars as define constants
  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine: Record<string, string> = {};
  for (const [key, value] of Object.entries(loadedEnv)) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  const plugins: any[] = [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      server: {
        preset: process.env.VERCEL ? "vercel" : "node-server",
        entry: "server",
      },
    }),
    react(),
  ];

  if (command === "build") {
    try {
      const { nitro } = await import("nitro/vite");
      plugins.push(
        nitro({
          defaultPreset: process.env.VERCEL ? "vercel" : "node-server",
        })
      );
    } catch (e) {
      // Nitro not installed
    }
  }

  return {
    define: envDefine,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      // Exclude all Node.js-only packages — they must NEVER end up in the client bundle
      exclude: [
        "postgres",
        "drizzle-orm",
        "drizzle-orm/postgres-js",
        "@neondatabase/serverless",
        "pg",
        "pg-native",
        "fs",
        "path",
        "crypto",
        "net",
        "tls",
        "dns",
        "child_process",
      ],
    },
    ssr: {
      // Keep these as external for SSR (Node.js handles them natively)
      external: [
        "postgres",
        "pg",
        "pg-native",
        "@neondatabase/serverless",
      ],
      // Prevent drizzle-orm from being inlined into SSR bundle (causes issues)
      noExternal: [],
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
  };
});
