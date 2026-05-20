import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import FloatingBanner from "@/components/FloatingBanner";
import TopBanner from "@/components/TopBanner";
import { authOptions } from "@/lib/auth";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="vi">
      <body className="min-h-screen bg-white font-[family-name:var(--font-inter)]">
        <AuthProvider session={session}>
          <TopBanner />
          {children}
          <FloatingBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
