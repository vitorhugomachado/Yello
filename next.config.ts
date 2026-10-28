import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  /* Permite abrir o ambiente de desenvolvimento pelo celular na rede local.
     O Next bloqueia HMR e assets internos de origens que não sejam localhost. */
  allowedDevOrigins: ["192.168.18.5", "172.31.12.225"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
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
