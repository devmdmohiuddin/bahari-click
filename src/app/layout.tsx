import type { Metadata } from "next";
import { Geist_Mono, Hind_Siliguri, Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Brand typography (docs/07-brand-guidelines.md): Plus Jakarta Sans for
// display/headings, Inter for body/UI, Hind Siliguri for Bangla. Self-hosted
// via next/font — no external CDN call, no layout shift, free.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bahari Click",
  description: "Quality products, delivered across Bangladesh. Cash on delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} ${hindSiliguri.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: some browser extensions inject attributes on
          <body> (e.g. cz-shortcut-listen) before React hydrates. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
