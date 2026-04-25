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
className="w-full max-w-[260px] min-h-[330px] bg-white rounded-2xl border border-green-100 shadow-lg shadow-green-100/40 p-6 text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col"
               >
                    <div className="flex justify-center mb-4">
                      {expert.avatarUrl ? (
                        <img
                          src={expert.avatarUrl}
                          alt={expert.name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-green-100 shadow-md"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-green-100 shadow-md">
                          {expert.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                      {expert.name}
                    </h3>

                    <p className="text-sm font-medium text-green-600 mt-1 line-clamp-2">
                      {expert.position}
                    </p>

                    {expert.previousWork && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {expert.previousWork}
                      </p>
                    )}

                    <div className="mt-auto pt-4">
  {expert.linkedin ? (
    <a
      href={expert.linkedin}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-green-200/60 transition hover:bg-green-700 hover:shadow-lg"
    >
      LinkedIn
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H8M17 7v9" />
      </svg>
    </a>
  ) : (
    <div className="h-10" />
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
            className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:flex w-10 h-10 items-center justify-center rounded-full bg-white border border-green-100 shadow-lg text-green-700 hover:bg-green-50 transition"
            aria-label="Chuyên gia trước"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex w-10 h-10 items-center justify-center rounded-full bg-white border border-green-100 shadow-lg text-green-700 hover:bg-green-50 transition"
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
                    ? "w-8 bg-green-600"
                    : "w-2.5 bg-green-200 hover:bg-green-300"
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