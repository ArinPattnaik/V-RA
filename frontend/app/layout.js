import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: "VÉRA — Greenwashing NLP Scanner",
  description:
    "Expose greenwashing in fashion. Paste a product link, get the True Eco-Score powered by NLP analysis of sustainability claims, material composition, and brand accountability.",
  keywords: [
    "greenwashing",
    "sustainability",
    "fashion",
    "NLP",
    "eco-score",
    "fast fashion",
    "environmental",
  ],
  openGraph: {
    title: "VÉRA — The Greenwashing Scanner",
    description: "See through fast fashion's eco-marketing. Get the True Eco-Score.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
