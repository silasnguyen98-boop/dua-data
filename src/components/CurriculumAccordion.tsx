"use client";

import { useState } from "react";
import { CurriculumItem } from "@/types/course";

export default function CurriculumAccordion({ items }: { items: CurriculumItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={`bg-white rounded-xl border transition-all duration-300 ${
              isOpen ? "border-green-200 shadow-lg shadow-green-100/50" : "border-gray-100 shadow-sm hover:shadow-md"
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-4">
                <span className={`w-10 h-10 font-bold rounded-xl flex items-center justify-center text-sm transition-colors duration-300 ${
                  isOpen ? "bg-green-600 text-white" : "bg-green-100 text-green-700"
                }`}>
                  {i + 1}
                </span>
                <div>
                  <p className="text-xs text-green-600 font-medium">{item.phase}</p>
                  <p className="font-semibold text-gray-800">{item.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 hidden sm:block">{item.lessons} bài</span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {item.topics && item.topics.length > 0 && (
                <div className="px-4 pb-4 pt-0">
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex flex-col gap-2">
                      {item.topics.map((topic, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                          </svg>
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
