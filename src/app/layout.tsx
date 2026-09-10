import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { buildPageTitle, META_DESCRIPTION, PRODUCT_NAME } from "@/lib/brand";

const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const fontArcade = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-arcade",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: buildPageTitle(),
    template: `%s — ${PRODUCT_NAME}`,
  },
  description: META_DESCRIPTION,
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: buildPageTitle(),
    description: META_DESCRIPTION,
    siteName: PRODUCT_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: buildPageTitle(),
    description: META_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontInter.variable} ${fontMono.variable} ${fontArcade.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
