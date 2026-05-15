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
            className={`overflow-hidden rounded-lg border bg-white transition-all duration-200 ${
              isOpen ? "border-green-200 shadow-sm shadow-green-100/50" : "border-gray-200 hover:border-green-100"
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className={`flex w-full items-center justify-between gap-4 p-4 text-left transition-colors ${
                isOpen ? "bg-green-50/70" : "bg-white hover:bg-green-50/40"
              }`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                  isOpen ? "bg-green-600 text-white" : "bg-green-100 text-green-700"
                }`}>
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-green-700">{item.phase}</p>
                  <p className="mt-0.5 font-semibold text-gray-900">{item.title}</p>
                </div>
              </div>
              <div className="flex flex-none items-center gap-3">
                <span className="hidden rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-100 sm:block">
                  {item.lessons} bài
                </span>
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-green-600" : ""}`}
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
                  <div className="border-t border-green-100 pt-3">
                    <div className="flex flex-col gap-2">
                      {item.topics.map((topic, j) => (
                        <div key={j} className="flex items-start gap-2 rounded-lg border border-green-100 bg-green-50/40 px-3 py-2.5 text-sm text-gray-700">
                          <svg className="h-4 w-4 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
