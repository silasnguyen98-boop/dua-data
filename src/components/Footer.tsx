import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function Footer() {
  return (
    <footer className="border-t border-green-100 bg-white py-12 text-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <BrandLogo
                href="/"
                showText={true}
                imageClassName="h-11 w-11"
                textClassName="text-xl text-green-800"
              />
            </div>
            <p className="max-w-sm text-sm leading-6 text-gray-600">
              Nâng cấp năng lực bằng Dữ liệu. DUA Edu giúp bạn không chỉ học Data, mà dùng dữ liệu để hiểu vấn đề và tạo ra quyết định có giá trị.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-gray-950">Liên kết</h4>
            <div className="space-y-2">
              <Link href="/#courses" className="block text-sm transition hover:text-green-700">Khóa học</Link>
              <Link href="/roadmap" className="block text-sm transition hover:text-green-700">Lộ trình</Link>
              <Link href="/resource" className="block text-sm transition hover:text-green-700">Tài nguyên</Link>
              <Link href="/community" className="block text-sm transition hover:text-green-700">Cộng đồng</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-gray-950">Cộng đồng</h4>
            <div className="space-y-3">
              <a href="https://www.facebook.com/duadata" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm transition hover:text-green-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs text-white">f</span>
                DUA Edu
              </a>
              <a href="https://www.facebook.com/groups/genzlamdata" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm transition hover:text-green-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-xs text-white">G</span>
                GenZ làm Data
              </a>
              <a href="https://www.facebook.com/groups/1936980600249918" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm transition hover:text-green-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs text-white">G</span>
                GenZ tìm việc Data
              </a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-gray-100 pt-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} DUA Edu. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
