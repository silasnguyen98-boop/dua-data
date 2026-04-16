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
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 text-center">
      <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
        ⏰ Hạn đăng ký: {nearest.title}
      </p>
      <div className="flex items-center justify-center gap-3">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="text-2xl font-black text-gray-900">{timeLeft.days}</div>
            <div className="text-[10px] text-gray-500 font-medium">Ngày</div>
          </div>
        )}
        <div className="text-2xl font-black text-gray-400">:</div>
        <div className="text-center">
          <div className="text-2xl font-black text-gray-900">{pad(timeLeft.hours)}</div>
          <div className="text-[10px] text-gray-500 font-medium">Giờ</div>
        </div>
        <div className="text-2xl font-black text-gray-400">:</div>
        <div className="text-center">
          <div className="text-2xl font-black text-gray-900">{pad(timeLeft.mins)}</div>
          <div className="text-[10px] text-gray-500 font-medium">Phút</div>
        </div>
        <div className="text-2xl font-black text-gray-400">:</div>
        <div className="text-center">
          <div className="text-2xl font-black text-gray-900">{pad(timeLeft.secs)}</div>
          <div className="text-[10px] text-gray-500 font-medium">Giây</div>
        </div>
      </div>
    </div>
  );
}
