import "./globals.css";

export const metadata = {
  title: "Tours de Historia — Pasaporte a otra época",
  description: "Explora 76 lugares históricos con mapas, narración y rutas de viaje inmersivas.",
  applicationName: "Tours de Historia",
  appleWebApp: {
    capable: true,
    title: "Tours de Historia",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: "#ef7158",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
