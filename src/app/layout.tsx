import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Providers } from "@/components/ui/Providers";
import "./globals.css";

// next/font self-hosts and size-adjusts fallbacks → no font-swap layout shift
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument-serif", display: "swap" });
const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "NexaBank · Meet Nova, the banker you can just ask",
  description: "Conversational banking powered by an in-house NLU, dialogue manager and NLG engine.",
};
export const viewport: Viewport = { themeColor: "#030d10", width: "device-width", initialScale: 1 };

// Runs before first paint: decides motion vs. reduced-motion so hidden
// start states never flash and never shift layout.
const motionFlag = `(function(){var d=document.documentElement;var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;d.classList.add(r?'reduced':'motion');if(location.pathname==='/')d.classList.add('is-loading');})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionFlag }} />
        <noscript><style>{`.preloader{display:none!important}.split-word,[data-fade]{transform:none!important;opacity:1!important}[data-scrub-word]{opacity:1!important}`}</style></noscript>
      </head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
