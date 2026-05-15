"use client";

import { useState, useEffect } from "react";

interface Course {
  id: string;
  title: string;
  slug: string;
  registrationDeadline?: string;
  published?: boolean;
  comingSoon?: boolean;
  isHidden?: boolean;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function getTimeLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
}

export default function RegistrationCountdown({ courses }: { courses: Course[] }) {
  // Find nearest open registration deadline
  const upcoming = courses
    .filter(c => c.registrationDeadline && new Date(c.registrationDeadline) > new Date())
    .sort((a, b) => new Date(a.registrationDeadline!).getTime() - new Date(b.registrationDeadline!).getTime());

  if (upcoming.length === 0) return null;

  const nearest = upcoming[0];
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(nearest.registrationDeadline!));

  useEffect(() => {
    if (!timeLeft) return;
    const id = setInterval(() => {
      const t = getTimeLeft(nearest.registrationDeadline!);
      setTimeLeft(t);
    }, 1000);
    return () => clearInterval(id);
  }, [nearest.registrationDeadline]);

  if (!timeLeft) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-50/50 to-white border border-emerald-100 rounded-[24px] p-6 text-center shadow-sm">
      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">
        Hạn đăng ký: {nearest.title}
      </p>
      <div className="flex items-center justify-center gap-4">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="text-3xl font-black text-gray-900 tracking-tighter">{timeLeft.days}</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">Ngày</div>
          </div>
        )}
        {timeLeft.days > 0 && <div className="text-2xl font-black text-gray-200">:</div>}
        <div className="text-center">
          <div className="text-3xl font-black text-gray-900 tracking-tighter">{pad(timeLeft.hours)}</div>
          <div className="text-[10px] text-gray-400 font-bold uppercase">Giờ</div>
        </div>
        <div className="text-2xl font-black text-gray-200">:</div>
        <div className="text-center">
          <div className="text-3xl font-black text-gray-900 tracking-tighter">{pad(timeLeft.mins)}</div>
          <div className="text-[10px] text-gray-400 font-bold uppercase">Phút</div>
        </div>
        <div className="text-2xl font-black text-gray-200">:</div>
        <div className="text-center">
          <div className="text-3xl font-black text-gray-900 tracking-tighter">{pad(timeLeft.secs)}</div>
          <div className="text-[10px] text-gray-400 font-bold uppercase">Giây</div>
        </div>
      </div>
    </div>
  );
}
