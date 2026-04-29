"use client";

import { useState, useEffect } from "react";

interface Ad {
  id: string;
  imageUrl: string;
  link: string;
  endDate: string;
}

export default function FloatingBanner() {
  const [ad, setAd] = useState<Ad | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/ads?active=true")
      .then((r) => r.json())
      .then((ads: Ad[]) => {
        if (ads.length > 0) setAd(ads[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!ad) return;
    const calc = () => {
      const diff = new Date(ad.endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Đã hết hạn");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [ad]);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setDismissed(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!ad || dismissed) return null;

  return (
    <div
      className="fixed bottom-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-50 animate-fade-in-up"
      style={{ maxWidth: 300 }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden group">
        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          aria-label="Đóng banner"
        >
          Bỏ qua
        </button>
        {/* Banner image */}
        <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={ad.imageUrl}
            alt="banner"
            className="w-full max-h-48 object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </a>
        {/* Countdown */}
        {timeLeft && timeLeft !== "Đã hết hạn" && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 text-center">
            <div className="text-xs font-medium opacity-80 mb-0.5">⏱ Kết thúc sau</div>
            <div className="text-xl font-bold font-mono tracking-wider">{timeLeft}</div>
          </div>
        )}
      </div>
    </div>
  );
}
