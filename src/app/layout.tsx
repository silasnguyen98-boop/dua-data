import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import FloatingBanner from "@/components/FloatingBanner";

const BRAND_LOGO = "https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "vietnamese"],
  variable: "--font-space",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DUA Edu - Nâng cấp năng lực bằng Dữ liệu",
  description: "DUA Edu giúp bạn không chỉ học Data, mà dùng dữ liệu để hiểu vấn đề, nâng cấp năng lực và tạo ra quyết định có giá trị.",
  icons: {
    icon: BRAND_LOGO,
    shortcut: BRAND_LOGO,
    apple: BRAND_LOGO,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-white font-[family-name:var(--font-inter)]">{children}<FloatingBanner /></body>
    </html>
  );
}
