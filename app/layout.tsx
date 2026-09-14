import type { Metadata, Viewport } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Zeroshot · the daily ML architecture game",
  description:
    "Guess the machine-learning architecture in eight tries. Scored on year, modality, mechanism, paradigm, origin, scale and weights.",
};

export const viewport: Viewport = { themeColor: "#0a0a0b" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable}`}>
        {children}
      </body>
    </html>
  );
}
