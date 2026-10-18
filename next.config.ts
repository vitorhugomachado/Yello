import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  /* O package-lock.json do diretório pai confundia a raiz do Turbopack e
     deixava o CSS compilado em cache. Fixar a raiz resolve o aviso e o cache. */
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
