import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToggleTema } from "@/components/ToggleTema";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// URL base para resolver las imágenes de preview a absolutas. En Vercel se
// toma el dominio de producción; en local cae a localhost.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const TITULO = "Bomberos Llavallol · Gestión";
const DESCRIPCION =
  "Gestión del Destacamento N°3 de Llavallol — Bomberos Voluntarios de Lomas de Zamora.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: TITULO,
  description: DESCRIPCION,
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    type: "website",
    locale: "es_AR",
    images: [
      {
        url: "/logo-bomberos.jpeg",
        width: 400,
        height: 400,
        alt: "Escudo de Bomberos Voluntarios de Lomas de Zamora",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: TITULO,
    description: DESCRIPCION,
    images: ["/logo-bomberos.jpeg"],
  },
  icons: { icon: "/logo-bomberos.jpeg", apple: "/logo-bomberos.jpeg" },
};

// Fija el tema antes del primer paint para evitar el "flash": usa la preferencia
// guardada y, si no hay, la del sistema operativo.
const scriptTema = `
(function(){try{
  var t = localStorage.getItem('tema');
  var oscuro = t ? t === 'oscuro' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (oscuro) document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
        {/* Provider de toasts global: confirmaciones de éxito de las acciones. */}
        <ToastProvider>{children}</ToastProvider>
        {/* Toggle de tema global: disponible en todas las pantallas. */}
        <div className="fixed bottom-4 right-4 z-50">
          <ToggleTema />
        </div>
      </body>
    </html>
  );
}
