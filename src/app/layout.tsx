
import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// One family for Thai and Latin: IBM Plex Sans Thai (open source, OFL) — less generic than Inter,
// with clear numbers for prices and Token amounts.
const plex = IBM_Plex_Sans_Thai({
  variable: "--font-plex",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ศิษย์เก่า งานเลี้ยงรุ่น",
  description: "ระบบลงทะเบียน ซื้อบัตร เสื้อรุ่น และกระเป๋า Token สำหรับงานเลี้ยงรุ่นศิษย์เก่า",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-theme is set by the inline script before paint, so React must not warn about it
    <html lang="th" className={plex.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
