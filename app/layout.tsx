import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const sans = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-sans",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-mono",
});

// Vercel sets this in production; the OG image needs an absolute URL.
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const description =
  "A daily guessing game for machine-learning architectures. Name the model from its year, data, block type, training, lab, size and weights. 7 tries.";

export const metadata: Metadata = {
  metadataBase: new URL(host ? `https://${host}` : "http://localhost:3000"),
  title: "Zeroshot · the daily ML architecture game",
  description,
  openGraph: {
    title: "Zeroshot",
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zeroshot · the daily ML architecture game",
    description,
  },
};

export const viewport: Viewport = { themeColor: "#11131c" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
