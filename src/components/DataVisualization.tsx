"use client";

import { useEffect, useState } from "react";

const barData = [
  { label: "Q1", value: 65, color: "#22c55e" },
  { label: "Q2", value: 82, color: "#16a34a" },
  { label: "Q3", value: 74, color: "#4ade80" },
  { label: "Q4", value: 95, color: "#15803d" },
];

const linePoints = "30,120 80,90 130,100 180,60 230,70 280,35 330,45 380,20";
const dotPositions = [
  { cx: 30, cy: 120 },
  { cx: 80, cy: 90 },
  { cx: 130, cy: 100 },
  { cx: 180, cy: 60 },
  { cx: 230, cy: 70 },
  { cx: 280, cy: 35 },
  { cx: 330, cy: 45 },
  { cx: 380, cy: 20 },
];

const metrics = [
  { label: "Revenue", value: "2.4B", change: "+12.5%", up: true },
  { label: "Users", value: "70K+", change: "+8.2%", up: true },
  { label: "Retention", value: "98%", change: "+3.1%", up: true },
];

export default function DataVisualization() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full" />;

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Main dashboard card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 p-6 animate-fade-in-right">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Dashboard</p>
            <p className="text-sm font-bold text-gray-800">Data Analytics Overview</p>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse-slow"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {metrics.map((m, i) => (
            <div
              key={i}
              className={`bg-gray-50 rounded-xl p-3 animate-slide-up delay-${(i + 1) * 200}`}
            >
              <p className="text-[10px] text-gray-400 uppercase">{m.label}</p>
              <p className="text-lg font-bold text-gray-900">{m.value}</p>
              <p className={`text-xs font-medium ${m.up ? "text-green-500" : "text-red-500"}`}>
                {m.change}
              </p>
            </div>
          ))}
        </div>

        {/* Line chart */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-[10px] text-gray-400 uppercase mb-2">Growth Trend</p>
          <svg viewBox="0 0 400 140" className="w-full h-24">
            {/* Grid lines */}
            {[35, 70, 105].map((y) => (
              <line key={y} x1="20" y1={y} x2="390" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
            ))}
            {/* Area fill */}
            <polygon
              points={`30,130 ${linePoints} 380,130`}
              fill="url(#areaGradient)"
              opacity="0.3"
              className="animate-fade-in-up delay-500"
            />
            {/* Line */}
            <polyline
              points={linePoints}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-dash-draw"
            />
            {/* Dots */}
            {dotPositions.map((d, i) => (
              <circle
                key={i}
                cx={d.cx}
                cy={d.cy}
                r="0"
                fill="#22c55e"
                stroke="white"
                strokeWidth="2"
                className={`animate-dot-pop delay-${Math.min((i + 3) * 200, 1500)}`}
              />
            ))}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Bar chart */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[10px] text-gray-400 uppercase mb-3">Quarterly Performance</p>
          <div className="flex items-end justify-between gap-3 h-20">
            {barData.map((bar, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className="w-full relative h-16 flex items-end">
                  <div
                    className={`w-full rounded-t-md animate-bar-grow delay-${(i + 1) * 200}`}
                    style={{
                      height: `${bar.value}%`,
                      backgroundColor: bar.color,
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{bar.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating accent cards */}
      <div className="absolute -top-4 -right-4 bg-green-500 text-white rounded-xl px-4 py-2 shadow-lg animate-float delay-300">
        <p className="text-xs font-medium">+12.5% Growth</p>
      </div>
      <div className="absolute -bottom-3 -left-3 bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-100 animate-float delay-700">
        <p className="text-xs text-gray-500">Active Users</p>
        <p className="text-sm font-bold text-green-600">70,234</p>
      </div>
    </div>
  );
}
