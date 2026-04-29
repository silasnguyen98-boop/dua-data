"use client";

import { useState, useEffect } from "react";

interface Ad {
  id: string;
  imageUrl: string;
  link: string;
  endDate: string;
}

export default function TopBanner() {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    fetch("/api/ads?active=true&type=top_banner")
      .then((r) => r.json())
      .then((ads: Ad[]) => {
        if (ads.length > 0) setAd(ads[0]);
      })
      .catch(() => {});
  }, []);

  if (!ad) return null;

  return (
    <a
      href={ad.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full"
    >
      <img
        src={ad.imageUrl}
        alt="banner"
        className="w-full h-auto max-h-[120px] object-contain"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
    </a>
  );
}