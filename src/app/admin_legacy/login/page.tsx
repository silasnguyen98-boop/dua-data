"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          data.error === "No users found"
            ? "Không tìm thấy người dùng nào. Vui lòng liên hệ quản trị viên."
            : data.error === "Invalid credentials"
              ? "Sai tài khoản hoặc mật khẩu"
              : "Lỗi kết nối. Vui lòng thử lại."
        );
        return;
      }

      const role = String(data.role || "").trim();
      const token = String(data.token || "");

      if (!role || !token) {
        setError("Không nhận được phiên đăng nhập hợp lệ. Vui lòng thử lại.");
        return;
      }

      sessionStorage.setItem("admin_auth", "true");
      sessionStorage.setItem("admin_role", token);
      sessionStorage.setItem("admin_id", String(data.id || ""));
      sessionStorage.setItem("admin_name", String(data.name || role).trim());
      sessionStorage.setItem(
        "admin_username",
        String(data.username || username).trim()
      );
      router.push("/adminv2");
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans select-none">
      {/* Left Column: Technical Branding Section */}
      <div className="flex-1 bg-slate-900 relative flex flex-col justify-center px-12 lg:px-24 xl:px-32 overflow-hidden">
        {/* Complex Technical Background */}
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#10a37f 1px, transparent 1px), linear-gradient(90deg, #10a37f 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-green-900/20"></div>
        
        {/* Moving Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent absolute top-0 animate-scanline"></div>
        </div>

        {/* Technical Circles & Orbits */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-green-500/5 rounded-full animate-spin-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-green-500/10 rounded-full animate-reverse-spin-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-dashed border border-green-500/10 rounded-full animate-spin-slow"></div>

        <div className="relative z-10">
          <div className="mb-16 scale-[1.7] origin-left opacity-90 brightness-200">
            <BrandLogo href="/" showText={false} className="gap-3" imageClassName="h-20 w-20" />
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
               <div className="h-[1px] w-16 bg-green-500/50"></div>
               <span className="text-xs font-black text-green-400 uppercase tracking-[0.5em] drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">Data Ops Center</span>
            </div>
            <h1 className="text-6xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter">
              Nâng cấp <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">năng lực</span> <br /> 
              bằng dữ liệu
            </h1>
            <div className="flex flex-wrap gap-3 pt-6">
              {['Processing', 'Analytics', 'Visualization', 'Security'].map((tag) => (
                <span key={tag} className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-md text-[9px] font-black text-green-400 uppercase tracking-widest">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: High-End Login Section */}
      <div className="flex-1 bg-[#0a0f18] flex items-center justify-center p-8 relative">
        {/* Technical Dot Grid Background */}
        <div className="absolute inset-0 opacity-[0.2] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="w-full max-w-[480px] bg-[#161b22] rounded-[54px] p-12 lg:p-16 border border-white/5 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-1000">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,1)]"></div>
              <span className="text-[11px] font-black text-green-500 uppercase tracking-[0.3em]">Access Protocol</span>
            </div>
            <h2 className="text-[44px] font-black text-white mb-4 tracking-tighter leading-tight">Chào mừng trở lại</h2>
            <p className="text-slate-400 font-medium text-base leading-relaxed">Vui lòng xác thực danh tính để truy cập hệ thống quản trị nội bộ.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Username</label>
                <span className="text-[10px] font-bold text-slate-600">ID: ADMIN_SEC_01</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#eef2f6] border-none rounded-3xl px-7 py-5 text-base font-black outline-none focus:ring-4 focus:ring-green-500/20 transition-all text-slate-900 placeholder:text-slate-400"
                  placeholder="duadata"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                <span className="text-[10px] font-bold text-slate-600 uppercase">Encrypted</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#eef2f6] border-none rounded-3xl px-7 py-5 text-base font-black outline-none focus:ring-4 focus:ring-green-500/20 transition-all text-slate-900 placeholder:text-slate-400"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in shake duration-300">
                <p className="text-xs font-bold text-red-500 flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></div>
                  {error}
                </p>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#10a37f] text-white font-black text-sm uppercase tracking-[0.2em] py-6 rounded-3xl hover:bg-[#0e8c6d] transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Xác thực truy cập"}
              </button>
            </div>
          </form>

          <div className="mt-12 pt-10 border-t border-white/5 text-center">
             <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">Internal Security Protocol v2.4</p>
             <p className="text-[10px] font-medium text-slate-700 italic">Unauthorized access is strictly monitored and logged.</p>
          </div>
        </div>

        {/* Global Footer */}
        <div className="absolute bottom-10 left-0 right-0 text-center opacity-30 pointer-events-none">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">
            &copy; 2026 DUA EDU LEARNING OPERATIONS. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-scanline {
          animation: scanline 8s linear infinite;
        }
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes reverse-spin-slow {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 60s linear infinite;
        }
        .animate-reverse-spin-slow {
          animation: reverse-spin-slow 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
