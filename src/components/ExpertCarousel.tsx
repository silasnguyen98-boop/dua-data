"use client";

import { useState, useCallback } from "react";

export interface Expert {
  id: string;
  name: string;
  position: string;
  previousWork: string;
  avatarUrl: string;
  linkedin: string;
  order: number;
  published: boolean;
}

const expertColors = [
  "from-green-400 to-emerald-500",
  "from-blue-400 to-cyan-500",
  "from-purple-400 to-pink-500",
  "from-orange-400 to-red-500",
  "from-teal-400 to-green-500",
  "from-indigo-400 to-blue-500",
];

function ExpertCard({ expert, index }: { expert: Expert; index: number }) {
  return (
    <div className="flex-shrink-0 w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center border border-gray-100 flex flex-col items-center">
      {/* Avatar with verification badge */}
      <div className="relative inline-block mb-5">
        {expert.avatarUrl ? (
          <img
            src={expert.avatarUrl}
            alt={expert.name}
            className="w-24 h-24 rounded-full object-cover shadow-lg group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${expertColors[index % expertColors.length]} flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            {expert.name.charAt(0)}
          </div>
        )}
        {/* Verification badge */}
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-md border-[3px] border-white">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {/* Info */}
      <h3 className="text-lg font-bold text-gray-900 mb-1">{expert.name}</h3>
      <p className="text-green-600 font-medium text-sm mb-2">{expert.position}</p>
      {expert.previousWork && <p className="text-gray-400 text-xs mb-4">{expert.previousWork}</p>}
      {/* LinkedIn button */}
      {expert.linkedin && (
        <a
          href={expert.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn
        </a>
      )}
    </div>
  );
}

export default function ExpertCarousel({ experts }: { experts: Expert[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const cardsPerView = experts.length === 1 ? 1 : 1; // default

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => Math.min(experts.length - 1, i + 1));
  }, [experts.length]);

  if (experts.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        Đang cập nhật đội ngũ chuyên gia...
      </div>
    );
  }

  const showArrows = experts.length > 1;
  const totalDots = experts.length;

  return (
    <div className="relative">
      {/* Carousel track */}
      <div className="overflow-hidden">
        <div
          className="flex gap-6 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * (100 / 1)}%)` }}
        >
          {experts.map((expert, i) => (
            <div key={expert.id} className="w-full flex-shrink-0">
              <ExpertCard expert={expert} index={i} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {showArrows && (
        <>
          <button
            onClick={prev}
            disabled={currentIndex === 0}
            className="absolute top-1/2 -left-4 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-green-50 hover:border-green-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
            aria-label="Previous"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            disabled={currentIndex === experts.length - 1}
            className="absolute top-1/2 -right-4 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-green-50 hover:border-green-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
            aria-label="Next"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators + count */}
      <div className="flex items-center justify-center gap-3 mt-6">
        {Array.from({ length: totalDots }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`rounded-full transition-all duration-300 ${
              i === currentIndex
                ? "w-6 h-2 bg-green-600"
                : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to expert ${i + 1}`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-400 font-medium">
          {currentIndex + 1}/{experts.length}
        </span>
      </div>
    </div>
  );
}
