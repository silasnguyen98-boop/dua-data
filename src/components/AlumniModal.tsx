"use client";

import { Alumni } from "@/types/alumni";

interface Props {
  alumni: Alumni;
  onClose: () => void;
}

export default function AlumniModal({ alumni, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 p-8 pb-24 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center text-xl transition"
          >
            ×
          </button>
          <div className="relative inline-block">
            {alumni.imageUrl ? (
              <img
                src={alumni.imageUrl}
                alt={alumni.name}
                className="w-28 h-28 rounded-full object-cover border-4 border-white/30 shadow-xl mx-auto"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-green-200 border-4 border-white/30 shadow-xl mx-auto flex items-center justify-center">
                <span className="text-4xl font-bold text-green-700">
                  {alumni.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 -mt-16 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-4">
              <h3 className="text-2xl font-extrabold text-gray-900">{alumni.name}</h3>
              <p className="text-green-600 font-semibold text-sm mt-1">{alumni.job}</p>
              {alumni.linkedin && (
                <a
                  href={alumni.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-4" />

            {/* Content */}
            <div className="text-gray-700 text-sm leading-relaxed [&_p]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold">
              <div dangerouslySetInnerHTML={{ __html: alumni.content }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
