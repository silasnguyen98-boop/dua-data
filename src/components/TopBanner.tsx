"use client";

import { useState, useEffect } from "react";

interface Ad {
  id: string;
  imageUrl: string;
  link: string;
  createdAt?: string;
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
    <div className="w-full bg-white overflow-hidden border-b border-gray-100">
      <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block w-full">
        <img
          src={ad.imageUrl}
          alt="banner"
          className="w-full aspect-[1920/240] object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      </a>
    </div>
  );
}
