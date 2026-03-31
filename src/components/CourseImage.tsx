export default function CourseImage({ type, size = "lg" }: { type: string; size?: "sm" | "lg" }) {
  const s = size === "lg" ? 120 : 64;
  const iconSize = size === "lg" ? "text-5xl" : "text-3xl";

  const configs: Record<string, { gradient: string; icon: string; accent: string }> = {
    python: {
      gradient: "from-blue-500 via-yellow-400 to-blue-600",
      icon: "🐍",
      accent: "bg-yellow-400/30",
    },
    datascience: {
      gradient: "from-purple-500 via-pink-400 to-indigo-600",
      icon: "📊",
      accent: "bg-pink-400/30",
    },
    fullstack: {
      gradient: "from-cyan-500 via-blue-500 to-violet-600",
      icon: "🌐",
      accent: "bg-blue-400/30",
    },
    sql: {
      gradient: "from-orange-500 via-amber-400 to-red-500",
      icon: "🗄️",
      accent: "bg-amber-400/30",
    },
  };

  const config = configs[type] || configs.python;

  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center overflow-hidden`}>
      {/* Decorative circles */}
      <div className={`absolute top-2 right-2 w-${size === "lg" ? 20 : 10} h-${size === "lg" ? 20 : 10} ${config.accent} rounded-full blur-xl`} />
      <div className={`absolute bottom-2 left-2 w-${size === "lg" ? 16 : 8} h-${size === "lg" ? 16 : 8} ${config.accent} rounded-full blur-lg`} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0M-10 10L10 -10M30 50L50 30' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
      }} />

      {/* Icon */}
      <div className="relative z-10 text-center">
        <span className={`${iconSize} block drop-shadow-lg`}>{config.icon}</span>
        {size === "lg" && (
          <div className="mt-2 flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 bg-white/60 rounded-full" />
            ))}
          </div>
        )}
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}
