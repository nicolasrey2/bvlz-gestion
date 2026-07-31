import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La ruta que exporta el parte lee la plantilla oficial del AcroForm
  // (docs/parte-intervencion-DTO3.pdf) desde el filesystem. Next no puede
  // inferir esa dependencia — el path se arma en runtime —, así que hay que
  // pedirle explícitamente que incluya el archivo en el bundle del deploy.
  outputFileTracingIncludes: {
    "/partes/[id]/pdf": ["./docs/parte-intervencion-DTO3.pdf"],
  },
};

export default nextConfig;
