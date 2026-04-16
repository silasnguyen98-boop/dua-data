"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

interface AdminDashboardChartsProps {
  registrationChartData: ChartDataPoint[];
  documentChartData: ChartDataPoint[];
}

export default function AdminDashboardCharts({
  registrationChartData,
  documentChartData,
}: AdminDashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 text-sm mb-4">Tăng trưởng đăng ký (30 ngày)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={registrationChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="Đăng ký" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 text-sm mb-4">Tăng trưởng nhận tài liệu (30 ngày)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={documentChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="Nhận tài liệu" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
