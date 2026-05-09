import type { Metadata } from "next";
import "./globals.css";
import FloatingBanner from "@/components/FloatingBanner";
import TopBanner from "@/components/TopBanner";

const BRAND_LOGO = "https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png";

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
    <html lang="vi">
      <body className="min-h-screen bg-white font-[family-name:var(--font-inter)]"><TopBanner />{children}<FloatingBanner /></body>
    </html>
  );
}
