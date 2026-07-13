import { ReactNode } from 'react';

interface StatsCardProps {
  /** The SVG icon element to display. */
  icon: ReactNode;
  /** Short label describing the stat (e.g. "Total Users"). */
  label: string;
  /** The numeric value to display prominently. */
  value: number | string;
  /** Tailwind gradient classes for the icon container, e.g. "from-sky-400 to-indigo-500". */
  accentGradient?: string;
}

/**
 * Reusable glassmorphism stat card.
 * Shows an icon in a gradient circle, a label, and a large number.
 */
export default function StatsCard({
  icon,
  label,
  value,
  accentGradient = 'from-sky-400 to-indigo-500',
}: StatsCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-black/20 backdrop-blur-lg transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]">
      {/* Subtle gradient glow in top-right corner */}
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accentGradient} opacity-[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.12]`}
      />

      <div className="relative flex items-center gap-4">
        {/* Icon container */}
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${accentGradient} shadow-md`}
        >
          {icon}
        </div>

        {/* Text */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
