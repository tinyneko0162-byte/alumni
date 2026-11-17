import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  // 800 is needed for Thai glyphs inside Inter ExtraBold text (e.g. the "ศิษย์เก่า" wordmark)
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ศิษย์เก่า · งานเลี้ยงรุ่น",
  description: "ระบบลงทะเบียน ซื้อบัตร เสื้อรุ่น และกระเป๋า Token สำหรับงานเลี้ยงรุ่นศิษย์เก่า",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-theme is set by the inline script before paint, so React must not warn about it
    <html lang="th" className={`${notoThai.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
