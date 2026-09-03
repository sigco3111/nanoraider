interface EnergyBarProps {
  current: number;
  max: number;
}

export function EnergyBar({ current, max }: EnergyBarProps) {
  const pct = Math.min(1, current / max);
  const color = pct > 0.5 ? "bg-yellow-400" : pct > 0.25 ? "bg-orange-400" : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-yellow-400 font-bold text-sm tracking-widest">⚡ 에너지</span>
      <div className="flex-1 h-4 bg-gray-800 rounded border border-gray-600 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className="text-white font-bold text-sm w-20 text-right">
        {current} / {max}
      </span>
    </div>
  );
}