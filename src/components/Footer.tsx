import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function Footer() {
  return (
    <footer className="bg-green-900 text-green-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
            <BrandLogo
              href="/"
              showText={false}
              imageClassName="h-20 w-20"
            />
            </div>
            <p className="text-sm text-green-200/80">Nâng cấp năng lực bằng Dữ liệu. DUA Edu giúp bạn không chỉ học Data, mà dùng dữ liệu để hiểu vấn đề và tạo ra quyết định có giá trị.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Liên kết</h4>
            <div className="space-y-2">
              <Link href="/#courses" className="block text-sm hover:text-green-400 transition">Khóa học</Link>
              <Link href="/roadmap" className="block text-sm hover:text-green-400 transition">Lộ trình</Link>
              <Link href="/resource" className="block text-sm hover:text-green-400 transition">Tài nguyên</Link>
              <Link href="/community" className="block text-sm hover:text-green-400 transition">Cộng đồng</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Cộng đồng</h4>
            <div className="space-y-3">
              <a href="https://www.facebook.com/duadata" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-green-400 transition text-sm">
                <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">f</span>
                DUA Edu
              </a>
              <a href="https://www.facebook.com/groups/genzlamdata" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-green-400 transition text-sm">
                <span className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">G</span>
                GenZ làm Data
              </a>
              <a href="https://www.facebook.com/groups/1936980600249918" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-green-400 transition text-sm">
                <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">G</span>
                GenZ tìm việc Data
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-green-800 mt-8 pt-8 text-center text-sm text-green-300/60">
          © {new Date().getFullYear()} DUA Edu. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
