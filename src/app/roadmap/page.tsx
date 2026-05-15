"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { animate } from "framer-motion";

interface MapPoint {
  id: string;
  x: string;
  y: string;
  title: string;
  subtitle: string;
  description: string;
  topics: string[];
  tools?: string;
  type: 'checkpoint' | 'final' | 'lock';
  pathOffset: number;
  isOffPath?: boolean;
  hideTitle?: boolean;
  link?: string;
}

const daPoints: MapPoint[] = [
  {
    id: 'm1',
    x: '15%',
    y: '20%',
    title: "Bình Dân học Data",
    subtitle: "Cảng Tân Binh: Làm Chủ Tư Duy",
    description: "Chào mừng Thủy thủ! Trước khi ra khơi, nhiệm vụ quan trọng nhất của bạn không phải là cầm lái, mà là Làm chủ tư duy - chiếc la bàn định hướng cho mọi quyết định. Tại Cảng Tân Binh, chúng ta không học lý thuyết suông. Bạn sẽ được ném vào các 'dự án sinh tồn' thực tế để rèn luyện nhãn quan của một nhà phân tích thực thụ để nhìn thấu bản chất vấn đề trước khi chạm tay vào công cụ.",
    topics: [
      "Tư duy đặt câu hỏi đúng",
      "Quy trình xử lý dữ liệu logic",
      "Kỹ thuật lọc Insight vàng",
      "Xây dựng nền tảng Portfolio"
    ],
    tools: "Data Mindset",
    type: 'lock',
    pathOffset: 0
  },
  {
    id: 'm2',
    x: '25%',
    y: '15%',
    title: "Thực chiến phân tích dữ liệu\ncác bài toán",
    subtitle: "Vùng Biển Trực Giác",
    description: "Tại Vùng Biển Trực Giác, bạn không chỉ học lý thuyết mà sẽ được ném vào 17 dự án dữ liệu mô phỏng tình huống thực tế tại doanh nghiệp. \n\nSứ mệnh của bạn là triển khai bài toán từ đầu đến cuối: từ đọc hiểu yêu cầu kinh doanh, xử lý dữ liệu, viết SQL truy vấn, cho đến khi 'vẽ bản đồ' Insight trực quan trên Power BI. Sau hải trình này, bạn sẽ làm chủ hoàn toàn Excel, SQL và Power BI, đồng thời sở hữu một Portfolio cực 'khủng' để chinh phục mọi nhà tuyển dụng.",
    topics: [
      "Buổi 1: Kể chuyện với dữ liệu",
      "Buổi 2: Nắm vững DAX thông dụng (P1)",
      "Buổi 3: Xử lý dữ liệu phức tạp",
      "Buổi 4: Giao diện thân thiện (Cơ bản)",
      "Buổi 5: Giao diện thân thiện (Nâng cao)",
      "Buổi 6: Xử lý dữ liệu phức tạp",
      "Buổi 7: Phân tích báo cáo nâng cao",
      "Buổi 8: DAX liên quan thời gian (P2)",
      "Buổi 9: Thiết kế Dashboard thực chiến",
      "Buổi 10: Case study Tài chính/Ngân hàng",
      "Buổi 11: Case study Ecommerce",
      "Buổi 12: Case study Marketing",
      "Buổi 13-15: Hoàn thiện Đồ án Cuối Khóa"
    ],
    tools: "Excel, SQL, Power BI",
    type: 'checkpoint',
    pathOffset: 8,
    link: "https://duadata.net/courses/thuc-chien-phan-tich-du-lieu-qua-cac-bai-toan-thuc-te"
  },
  {
    id: 'b1',
    x: '40%',
    y: '40%',
    title: "Thực chiến phân tích dữ liệu\nchuyên sâu domain\ntài chính - ngân hàng",
    subtitle: "Quần Đảo Tài Chính: Bậc Thầy Dữ Liệu Tài chính - Ngân Hàng",
    description: "Chào mừng bạn đến với hải trình khai phá dữ liệu dành cho những người mới bắt đầu. Đây là 13 buổi học tập trung vào thực chiến, giúp bạn nhanh chóng nắm bắt cách xử lý các bộ dữ liệu Tài chính - Ngân hàng thực tế.\n\nBạn sẽ được trang bị kỹ thuật truy vấn SQL chuyên nghiệp để trích xuất Insight và học cách biến những con số khô khan thành các báo cáo (Dashboard) giá trị cho doanh nghiệp. Sau chặng này, bạn sẽ sở hữu nền tảng tư duy sắc bén và bộ kỹ năng sẵn sàng để bước chân vào thế giới phân tích dữ liệu Tài chính - Ngân hàng thực thụ.",
    topics: [
      "Buổi 1: DA 101 & Setup môi trường",
      "Buổi 2: Truy vấn dữ liệu thực tế",
      "Buổi 3: SQL nâng cao cho Business",
      "Buổi 4: Tổng hợp & Phân tích dữ liệu",
      "Buổi 5: JOIN & Ghép bảng Insight",
      "Buổi 6: Thực hành xử lý Case thực tế",
      "Buổi 7: Subquery & Logic phức tạp",
      "Buổi 8: Hàm thống kê & Chỉ số phân tích",
      "Buổi 9: Thực hành Dataset thực tế 1",
      "Buổi 10: Thực hành Dataset thực tế 2",
      "Buổi 11: Trực quan hóa với PowerBI",
      "Buổi 12: Thiết kế Dashboard Insight",
      "Buổi 13: Đồ án cuối khóa - Giải bài toán DN"
    ],
    tools: "SQL, Power BI",
    type: 'checkpoint',
    pathOffset: 25,
    link: "https://duadata.net/courses/thuc-chien-phan-tich-du-lieu-cho-nguoi-moi-bat-dau"
  },
  { id: 'b2', x: '55%', y: '35%', title: "SQL Query", subtitle: "Hang Động SQL", description: "Vùng biển này đang được các nhà thám hiểm Dứa khai phá, hãy quay lại sau nhé!", topics: [], type: 'lock', pathOffset: 41, hideTitle: true },
  {
    id: 'py1',
    x: '55%',
    y: '12%',
    title: "Tự học Python",
    subtitle: "Đảo Hoang Python: Nhật Ký Tự Học",
    description: "Chào bạn! Đây không phải là một khóa học hàn lâm, mà là cuốn nhật ký hành trình của Dứa khi tự mình chinh phục Python từ con số 0. Dứa đã chắt lọc những 'ghi chép sinh tồn' quan trọng nhất, từ những lỗi sai ngớ ngẩn đến những bài học đắt giá để giúp bạn tự mình chế tạo vũ khí phân tích mạnh mẽ.\n\nHãy coi đây là một bản hướng dẫn từ người đi trước dành cho cả nhà cùng nhau tự học, ghi chép và tiến bộ mỗi ngày. Hiện tại, cuốn nhật ký này đang được Dứa biên soạn lại để hoàn thiện hơn trước khi truyền tay tới các bạn.",
    topics: ["Cấu trúc dữ liệu", "Hàm & Module", "Logic lập trình", "Ghi chép sinh tồn của Dứa"],
    type: 'lock',
    pathOffset: 0,
    isOffPath: true
  },
  { id: 'b3', x: '65%', y: '50%', title: "Power BI", subtitle: "Ngọn Hải Đăng BI", description: "Vùng biển này đang được các nhà thám hiểm Dứa khai phá, hãy quay lại sau nhé!", topics: [], type: 'lock', pathOffset: 57, hideTitle: true },
  {
    id: 'pb_ui',
    x: '40%',
    y: '6%',
    title: "Power BI UI/UX:\nNghệ thuật kể chuyện\nbằng dữ liệu",
    subtitle: "Đảo San Hô UI/UX: Nghệ Thuật Kể Chuyện",
    description: "Tại Đảo San Hô UI/UX, bạn sẽ khám phá bí mật để biến những biểu đồ khô khan thành những tác phẩm nghệ thuật đầy mê hoặc. Đây là nghệ thuật dẫn dắt người xem qua từng câu chuyện dữ liệu bằng giao diện người dùng (UI) chuyên biệt trên Power BI.\n\nBạn sẽ làm chủ quy trình thiết kế từ Background, thanh điều hướng (Navigation) đến việc sử dụng Bookmark để tạo ra trải nghiệm mượt mà như một ứng dụng thực thụ. Đây là chặng hành trình giúp bạn khẳng định đẳng cấp của một nhà phân tích có tư duy thẩm mỹ vượt trội và khả năng kể chuyện dữ liệu đỉnh cao.",
    topics: [
      "Bài 1-5: Nguyên lý thiết kế & Trực quan hóa",
      "Bài 6-8: Thiết kế Background chuyên nghiệp",
      "Bài 9: Import & Xử lý dữ liệu thực tế",
      "Bài 10-11: Master Header & Navigation",
      "Bài 12-14: Xây dựng Card & Chart Visual",
      "Bài 15-17: Logic tương tác & Visual Interaction",
      "Bài 18: Tạo Profit View & Order View",
      "Bài 19: Làm chủ Bookmark nâng cao",
      "Bài 20-22: Hoàn thiện Home & Help Report",
      "Bài 23: Tổng kết hành trình nghệ thuật"
    ],
    tools: "Power BI, Figma, PowerPoint",
    type: 'checkpoint',
    pathOffset: 0,
    isOffPath: true,
    link: "https://duadata.net/courses/khoa-e-learning-power-bi-ui-ux-nghe-thuat-ke-chuyen-bang-du-lieu"
  },
  { id: 'f1', x: '35%', y: '70%', title: "Python Data", subtitle: "Vực Thẳm Automation", description: "Vùng biển này đang được các nhà thám hiểm Dứa khai phá, hãy quay lại sau nhé!", topics: [], type: 'lock', pathOffset: 75, hideTitle: true },
  { id: 'f2', x: '50%', y: '80%', title: "Machine Learning", subtitle: "Đảo Tiên Tri", description: "Vùng biển này đang được các nhà thám hiểm Dứa khai phá, hãy quay lại sau nhé!", topics: [], type: 'lock', pathOffset: 90, hideTitle: true },
  { id: 'f3', x: '75%', y: '75%', title: "Big Data & AI", subtitle: "Kho Báu Cuối Cùng", description: "Vùng biển này đang được các nhà thám hiểm Dứa khai phá, hãy quay lại sau nhé!", topics: [], type: 'lock', pathOffset: 100, hideTitle: true },
  { id: 'e1', x: '85%', y: '20%', title: "Data Engineer", subtitle: "Kỹ Sư Hải Trình", description: "Trở thành người xây dựng những con tàu và hải lộ vững chắc nhất đại dương.", topics: [], type: 'lock', pathOffset: 0, isOffPath: true },
  { id: 's1', x: '85%', y: '45%', title: "Data Science", subtitle: "Nhà Thông Thái Dữ Liệu", description: "Bậc thầy giải mã mọi bí ẩn của đại dương thông qua toán học và AI nâng cao.", topics: [], type: 'lock', pathOffset: 0, isOffPath: true },
];

function MapIsland({ point, selectedPoint, onSelect }: { point: MapPoint, selectedPoint: MapPoint | null, onSelect: (p: MapPoint) => void }) {
  const [imgError, setImgError] = useState(false);
  const isSelected = selectedPoint?.id === point.id;
  const lineCount = point.title.split('\n').length;
  const isCoral = point.id === 'py1' || point.id === 'pb_ui';

  let islandImg = "/island_palm.png";
  if (point.id === 'm1') islandImg = "/island.png";
  else if (point.type === 'final' || point.id === 'f3') islandImg = "/island_treasure.png";
  else if (point.id === 'e1') islandImg = "/island_mermaid.png";
  else if (point.id === 's1') islandImg = "/island_skull.png";
  else if (isCoral) islandImg = "/island_coral.png";

  return (
    <div className={`absolute transition-all duration-500 ${isSelected ? 'z-50' : 'z-30'}`} style={{ left: point.x, top: point.y }}>
      <button
        onClick={() => onSelect(point)}
        className={`relative group flex flex-col items-center justify-center w-10 h-10 lg:w-16 lg:h-16 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isSelected ? 'scale-125' : 'hover:scale-110'}`}
      >
        {!point.hideTitle && (
          <span
            className={`hidden lg:block absolute whitespace-pre-line text-center w-40 text-[8px] font-black uppercase tracking-widest leading-tight transition-all duration-500 ${
              isSelected
              ? (lineCount >= 3 ? '-top-14' : lineCount === 2 ? '-top-10' : '-top-7') + ' text-emerald-600 scale-110'
              : 'top-10 lg:top-14 text-slate-300'
            }`}
          >
            {point.title}
          </span>
        )}
        {!imgError ? (
          <img src={islandImg} alt="" onError={() => setImgError(true)} className={`w-full h-full object-contain transition-all drop-shadow-md ${isCoral ? 'scale-75' : ''} ${point.type === 'lock' ? 'grayscale opacity-30' : isSelected ? 'drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/50 rounded-full backdrop-blur-sm border border-white/80 shadow-inner">
            <span className="text-2xl lg:text-3xl transform hover:scale-110 transition-transform">{isCoral ? '🪸' : '🏝️'}</span>
          </div>
        )}
        <div className={`absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 rounded-full flex items-center justify-center shadow-lg border border-white ${point.type === 'lock' ? 'bg-slate-200 text-slate-500' : point.type === 'final' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
          <span className="text-[7px] lg:text-[8px] font-black">{point.type === 'lock' ? '🔒' : point.type === 'final' ? '⭐' : '✓'}</span>
        </div>
      </button>
    </div>
  );
}

export default function RoadmapPage() {
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(daPoints[0]);
  const [shipPos, setShipPos] = useState({ x: 15, y: 20 });
  const [currentOffset, setCurrentOffset] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);

  const generateZigZagPath = () => {
    const points = daPoints.filter(p => p.type !== 'lock' && !p.isOffPath);
    if (points.length === 0) return "";
    return points.reduce((acc, p, i) => {
      const x = parseFloat(p.x);
      const y = parseFloat(p.y);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, "");
  };

  const zigZagPath = generateZigZagPath();

  const findOffsetForPoint = (pointX: number, pointY: number) => {
    if (!pathRef.current) return 0;
    const path = pathRef.current;
    const totalLength = path.getTotalLength();
    let bestOffset = 0;
    let minDistance = Infinity;
    for (let i = 0; i <= 100; i++) {
      const p = path.getPointAtLength((i / 100) * totalLength);
      const distance = Math.sqrt(Math.pow(p.x - pointX, 2) + Math.pow(p.y - pointY, 2));
      if (distance < minDistance) {
        minDistance = distance;
        bestOffset = i;
      }
    }
    return bestOffset;
  };

  useEffect(() => {
    if (pathRef.current && selectedPoint && !selectedPoint.isOffPath && selectedPoint.type !== 'lock') {
      const targetOffset = findOffsetForPoint(parseFloat(selectedPoint.x), parseFloat(selectedPoint.y));
      const controls = animate(currentOffset, targetOffset, {
        duration: 1.0,
        ease: "easeInOut",
        onUpdate: (latest) => setCurrentOffset(latest)
      });
      return () => controls.stop();
    }
  }, [selectedPoint]);

  useEffect(() => {
    if (pathRef.current) {
      const path = pathRef.current;
      const totalLength = path.getTotalLength();
      const point = path.getPointAtLength((currentOffset / 100) * totalLength);
      setShipPos({ x: point.x, y: point.y });
    }
  }, [currentOffset]);

  const handleActionClick = () => {
    if (selectedPoint?.link) {
      window.open(selectedPoint.link, '_blank');
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rocking {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
        .animate-rocking { animation: rocking 4s ease-in-out infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="min-h-screen bg-white font-sans selection:bg-emerald-500 selection:text-white overflow-hidden">
        <Navbar />

        <div className="flex flex-col lg:flex-row h-screen pt-0 overflow-hidden">
          <div className="relative w-full lg:w-1/2 h-[50vh] lg:h-full bg-[#f8fafc] border-b lg:border-b-0 lg:border-r border-slate-200 overflow-hidden flex items-center justify-center p-0">
            {/* TAGLINE BADGE - Desktop Only */}
            <div className="hidden lg:block absolute top-12 left-8 z-[80] animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="flex items-center gap-4 px-6 py-3 bg-white/70 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)] transition-all hover:scale-105 hover:bg-white/90">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-xl">🚢</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-0.5">Dua Data Roadmap</span>
                  <p className="text-sm font-bold text-slate-800 leading-tight">
                    Cả nhà lên thuyền cùng DUA để chinh phục đại dương Data nha!
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            <div className="relative w-full max-w-[95%] lg:max-w-[90%] aspect-[16/11] max-h-[90%]">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path ref={pathRef} d={zigZagPath} fill="none" stroke="#10b981" strokeWidth="0.25" strokeDasharray="1 3" strokeLinecap="round" className="opacity-30" />
              </svg>
              <div className="absolute z-[70] w-10 h-10 lg:w-16 lg:h-16 pointer-events-none" style={{ left: `${shipPos.x}%`, top: `${shipPos.y}%` }}>
                <div className="relative w-full h-full animate-rocking -translate-x-[100%] -translate-y-[40%]">
                  <img src="/ship.png" alt="Ship" className="w-full h-full object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.15)]" />
                </div>
              </div>
              {daPoints.map((point) => (
                <MapIsland key={point.id} point={point} selectedPoint={selectedPoint} onSelect={setSelectedPoint} />
              ))}
            </div>
          </div>

          <div className="w-full lg:w-1/2 bg-white flex flex-col overflow-hidden relative shadow-[-40px_0_80px_-20px_rgba(0,0,0,0.03)] z-[100]">
            <div className="flex-1 overflow-y-auto px-10 py-16 scrollbar-hide">
              <div className="max-w-xl mx-auto">
                {selectedPoint ? (
                  <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {!selectedPoint.hideTitle ? (
                      <>
                        <div className="flex items-start justify-between mb-12">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-emerald-500 rounded-[24px] flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(16,185,129,0.4)] rotate-3">
                              <span className="text-2xl font-black text-white">
                                {selectedPoint.id.startsWith('m') ? 'M' : selectedPoint.id.startsWith('b') ? 'B' : selectedPoint.id.startsWith('pb') ? 'UX' : 'F'}
                              </span>
                            </div>
                            <div>
                              <div className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.25em] mb-2">{selectedPoint.subtitle}</div>
                              <h2 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tight">{selectedPoint.title}</h2>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-10">
                          <section><div className="text-slate-500 text-base lg:text-lg leading-relaxed font-medium whitespace-pre-line">{selectedPoint.description}</div></section>
                          {selectedPoint.topics.length > 0 && (
                            <section className="space-y-6">
                              <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-slate-100"></div>
                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                  {selectedPoint.id === 'm2' || selectedPoint.id === 'b1' || selectedPoint.id === 'pb_ui' ? `Hải trình ${selectedPoint.topics.length} bài học` : "Chiến lợi phẩm (Kỹ năng)"}
                                </div>
                                <div className="h-px flex-1 bg-slate-100"></div>
                              </div>
                              <div className={`grid gap-4 ${selectedPoint.topics.length > 8 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                                {selectedPoint.topics.map((topic, i) => (
                                  <div key={i} className="group flex items-start gap-4 p-5 bg-slate-50/50 rounded-[24px] border border-slate-100 transition-all duration-300 hover:bg-white hover:border-emerald-200 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.15)]">
                                    <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10 transition-transform group-hover:scale-125" />
                                    <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{topic}</span>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}
                          {selectedPoint.tools && (
                            <section className="space-y-6">
                              <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-slate-100"></div>
                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Trang bị đi kèm</div>
                                <div className="h-px flex-1 bg-slate-100"></div>
                              </div>
                              <div className="flex flex-wrap gap-3">
                                {selectedPoint.tools.split(',').map((tool, i) => {
                                  const t = tool.trim();
                                  let colorClass = "bg-slate-50 text-slate-500 border-slate-100";
                                  if (t.includes("Mindset")) colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                  return (
                                    <div key={i} className={`flex items-center gap-3 px-6 py-3 rounded-2xl border font-bold text-sm transition-all duration-300 hover:scale-105 hover:shadow-md ${colorClass}`}>{t}</div>
                                  );
                                })}
                              </div>
                            </section>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="h-[50vh] flex flex-col items-center justify-center text-center px-6">
                        <div className="text-6xl mb-8 animate-pulse">⚓</div>
                        <p className="text-lg font-bold text-slate-400 italic max-w-md mx-auto leading-relaxed">
                          "Vùng biển này đang được các nhà thám hiểm Dứa khai phá, hãy quay lại sau nhé!"
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="px-10 py-8 border-t border-slate-50 bg-white/80 backdrop-blur-md">
              <div className="max-w-xl mx-auto flex flex-col gap-6">
                {selectedPoint && (
                  <button onClick={handleActionClick} disabled={selectedPoint.type === 'lock'} className={`w-full py-6 rounded-[28px] font-black text-xl transition-all duration-500 shadow-[0_20px_40px_-12px_rgba(16,185,129,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.4)] ${selectedPoint.type === 'lock' ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-[1.02] active:scale-95'}`}>
                    {selectedPoint.type === 'lock' ? (selectedPoint.id === 'm1' || selectedPoint.id === 'py1' ? 'Hải trình đã khởi hành' : 'Sương mù dày đặc') : 'Gia nhập Thủy thủ đoàn'}
                  </button>
                )}
                <Link href="/" className="group flex items-center justify-center gap-3 py-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-emerald-600 transition-colors">
                  <span className="group-hover:-translate-x-2 transition-transform">←</span> Về Cảng chính
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
