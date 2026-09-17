import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  title?: string;
  categoryLabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  title,
  categoryLabel,
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="w-full px-4 pt-2 pb-1.5 flex flex-col gap-1.5 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 shrink-0 z-20">
      <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-300">
        <div className="flex items-center gap-1.5">
          {categoryLabel && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40">
              {categoryLabel}
            </span>
          )}
          <span>{title || 'Progress'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-stone-900 dark:text-stone-100 font-bold">
            {current} / {total}
          </span>
          <span className="text-[11px] text-stone-400 font-mono">({percentage}%)</span>
        </div>
      </div>

      {/* Thin Progress Bar */}
      <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
