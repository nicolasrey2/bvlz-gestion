import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bomberos Llavallol · Gestión",
  description: "Gestión del Destacamento N°3 de Llavallol",
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
        {children}
      </body>
    </html>
  );
}
