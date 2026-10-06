import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  Layers,
  ShieldAlert,
  Clock,
  Sparkles,
} from 'lucide-react';
import { UserAnalyticsStats } from '../types';
import { fetchUserAnalyticsStats } from '../lib/firebase';

interface UserAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return 'Just now';
  try {
    const date = new Date(isoString);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    const days = Math.floor(diff / 86400);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const UserAnalyticsModal: React.FC<UserAnalyticsModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
}) => {
  const [stats, setStats] = useState<UserAnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserAnalyticsStats();
      setStats(data);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.warn('Failed to load user analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadStats();
    }
  }, [isOpen, isAdmin]);

  if (!isOpen) return null;

  // Strict Admin Barrier
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-stone-200 dark:border-stone-800">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white">Admin Access Only</h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
              User traffic and analytics can only be viewed after authenticating as Administrator.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const mobilePercent =
    stats && stats.totalUniqueUsers > 0
      ? Math.round((stats.mobileUsersCount / stats.totalUniqueUsers) * 100)
      : 0;

  const desktopPercent =
    stats && stats.totalUniqueUsers > 0
      ? Math.round((stats.desktopUsersCount / stats.totalUniqueUsers) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-750 text-stone-900 dark:text-stone-100 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header with High-Contrast Typography & Distinct Action Buttons */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0 bg-stone-50 dark:bg-stone-850">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white tracking-tight">
                  User & Traffic Analytics
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shrink-0">
                  Admin Only
                </span>
              </div>
              <p className="text-xs font-medium text-stone-600 dark:text-stone-300 mt-0.5">
                Kitne users ne app ko open kra aur use kra (Real-time Cloud Stats)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={loadStats}
              disabled={isLoading}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs border border-stone-300/60 dark:border-stone-700"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors cursor-pointer shadow-xs border border-stone-300/60 dark:border-stone-700"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-white dark:bg-stone-900">
          {isLoading && !stats ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                Fetching real-time user records from Firestore...
              </p>
            </div>
          ) : (
            <>
              {/* Primary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Total Unique Users */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 relative overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Total Unique Users
                    </span>
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-emerald-950 dark:text-emerald-100">
                    {stats?.totalUniqueUsers ?? 1}
                  </div>
                  <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300/90 mt-1">
                    Distinct student devices
                  </p>
                </div>

                {/* Active Users Today */}
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 relative overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                      Active Today
                    </span>
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-blue-950 dark:text-blue-100 flex items-baseline gap-1.5">
                    <span>{stats?.activeToday ?? 1}</span>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300/90 mt-1">
                    Opened site in last 24h
                  </p>
                </div>

                {/* Total App Opens / Visits */}
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 col-span-2 sm:col-span-1 relative overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Total App Opens
                    </span>
                    <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-amber-950 dark:text-amber-100">
                    {stats?.totalAppOpens ?? 1}
                  </div>
                  <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300/90 mt-1">
                    Total learning sessions
                  </p>
                </div>
              </div>

              {/* Devices Breakdown Card (Correct dark mode backgrounds & high contrast) */}
              <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Device Distribution
                  </h4>
                  <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                    {stats?.totalUniqueUsers || 1} total tracked
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="h-3.5 w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.max(mobilePercent, 10)}%` }}
                    className="bg-emerald-500 h-full transition-all duration-500"
                    title={`Mobile: ${mobilePercent}%`}
                  />
                  <div
                    style={{ width: `${desktopPercent}%` }}
                    className="bg-blue-500 h-full transition-all duration-500"
                    title={`Desktop: ${desktopPercent}%`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xs">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Mobile
                    </div>
                    <div className="text-base font-extrabold font-mono text-stone-900 dark:text-stone-100 mt-0.5">
                      {stats?.mobileUsersCount ?? 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xs">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                      <Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Desktop
                    </div>
                    <div className="text-base font-extrabold font-mono text-stone-900 dark:text-stone-100 mt-0.5">
                      {stats?.desktopUsersCount ?? 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xs">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                      <Tablet className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Tablet
                    </div>
                    <div className="text-base font-extrabold font-mono text-stone-900 dark:text-stone-100 mt-0.5">
                      {stats?.tabletUsersCount ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Visitor Activity Feed */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                    Recent Learner Devices ({stats?.recentVisitors?.length || 0})
                  </h4>
                  <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    Refreshed {formatRelativeTime(lastRefreshedAt.toISOString())}
                  </span>
                </div>

                {!stats?.recentVisitors || stats.recentVisitors.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-xs">
                    No recent visitor sessions found yet.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden divide-y divide-stone-200 dark:divide-stone-700 max-h-60 overflow-y-auto">
                    {stats.recentVisitors.map((v, idx) => (
                      <div
                        key={v.id || idx}
                        className="p-3 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0 border border-stone-200 dark:border-stone-700">
                            {v.deviceType === 'Mobile' ? (
                              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : v.deviceType === 'Tablet' ? (
                              <Tablet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            ) : (
                              <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-900 dark:text-stone-100 truncate">
                                User {v.id.slice(0, 8)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                                {v.platform || v.deviceType}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">
                              First seen: {v.firstSeenAt ? new Date(v.firstSeenAt).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {formatRelativeTime(v.lastActiveAt)}
                          </div>
                          <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 font-mono">
                            {v.visitCount} {v.visitCount === 1 ? 'open' : 'opens'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy Footer with high contrast */}
              <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2 shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-stone-900 dark:text-stone-100 font-bold">Privacy Safe:</strong> Tracking uses randomized anonymous device IDs. No student names, emails, phone numbers, or passwords are ever captured or exposed.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer with high contrast and prominent Done button */}
        <div className="p-3.5 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 flex items-center justify-between shrink-0">
          <div className="text-xs font-semibold text-stone-600 dark:text-stone-400">
            Powered by Firebase Firestore
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
