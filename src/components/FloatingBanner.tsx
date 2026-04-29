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

  if (!ad || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-fade-in-up" style={{ maxWidth: 280 }}>
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden group">
        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10"
          aria-label="Đóng banner"
        >
          ✕
        </button>
        {/* Countdown */}
        {timeLeft && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded-lg backdrop-blur-sm z-10">
            ⏱ {timeLeft}
          </div>
        )}
        {/* Banner image */}
        <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={ad.imageUrl}
            alt="banner"
            className="w-full max-h-40 object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </a>
      </div>
    </div>
  );
}
