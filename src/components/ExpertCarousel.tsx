"use client";

import { useMemo, useState } from "react";

export interface Expert {
  id: string;
  name: string;
  position: string;
  previousWork?: string;
  avatarUrl?: string;
  linkedin?: string;
  order?: number;
  published?: boolean;
}

function chunkExperts(experts: Expert[], size: number) {
  const chunks: Expert[][] = [];

  for (let i = 0; i < experts.length; i += size) {
    chunks.push(experts.slice(i, i + size));
  }

  return chunks;
}

export default function ExpertCarousel({ experts }: { experts: Expert[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const sortedExperts = useMemo(() => {
    return [...experts].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [experts]);

  const slides = useMemo(() => chunkExperts(sortedExperts, 4), [sortedExperts]);

  if (!sortedExperts.length) {
    return null;
  }

  const goPrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goNext = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, slideIndex) => (
            <div key={slideIndex} className="w-full flex-shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center max-w-6xl mx-auto">
                {slide.map((expert) => (
                  <div
                    key={expert.id}
                    className="flex min-h-[280px] w-full max-w-[260px] flex-col rounded-[32px] border border-emerald-100 bg-white p-6 text-center shadow-sm shadow-emerald-100/50 transition hover:border-emerald-200 hover:shadow-md"
                  >
                    <div className="mb-4 flex justify-center">
                      {expert.avatarUrl ? (
                        <img
                          src={expert.avatarUrl}
                          alt={expert.name}
                          className="h-20 w-20 rounded-full border border-emerald-100 object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-100 bg-gradient-to-br from-emerald-500 to-emerald-400 text-2xl font-bold text-white shadow-sm">
                          {expert.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <h3 className="line-clamp-2 text-lg font-bold text-gray-950">
                      {expert.name === "Dứa Data" ? "DUA Edu" : expert.name}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm font-bold uppercase tracking-wider text-emerald-600">
                      {expert.position}
                    </p>

                    {expert.previousWork && (
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-400 font-light">
                        {expert.previousWork}
                      </p>
                    )}

                    <div className="mt-auto pt-4">
                      {expert.linkedin ? (
                        <a
                          href={expert.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 transition hover:border-emerald-200 hover:bg-emerald-100"
                        >
                          LinkedIn
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H8M17 7v9" />
                          </svg>
                        </a>
                      ) : (
                        <div className="h-9" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50 md:flex"
            aria-label="Chuyên gia trước"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50 md:flex"
            aria-label="Chuyên gia tiếp theo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex items-center justify-center gap-2 mt-8">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  currentSlide === index
                    ? "w-8 bg-emerald-600"
                    : "w-2.5 bg-emerald-200 hover:bg-emerald-300"
                }`}
                aria-label={`Đi tới slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
