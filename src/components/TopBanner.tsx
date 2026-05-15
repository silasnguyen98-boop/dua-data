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
    // Firebase-backed ads are disabled for now to avoid blocking page load.
    return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    fetch("/api/ads?active=true&type=top_banner", { signal: controller.signal })
      .then((r) => r.json())
      .then((ads: Ad[]) => {
        if (ads.length > 0) setAd(ads[0]);
      })
      .catch(() => {});

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
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
