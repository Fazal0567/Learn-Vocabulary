import React from 'react';
import {
  Home,
  BookOpen,
  Star,
  Heart,
  RotateCcw,
  HelpCircle,
  Search,
  BarChart2,
  Settings,
} from 'lucide-react';
import { NavigationTab } from '../types';

interface BottomNavigationProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  favoritesCount: number;
  importantCount: number;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  favoritesCount,
  importantCount,
}) => {
  const items: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'revision', label: 'Revise', icon: RotateCcw },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'important', label: 'Starred', icon: Star, badge: importantCount },
    { id: 'favorites', label: 'Favorites', icon: Heart, badge: favoritesCount },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'progress', label: 'Stats', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      id="main-bottom-navigation"
      aria-label="Main Navigation"
      className="w-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 shrink-0 z-30 shadow-lg"
    >
      <div className="flex items-center justify-between px-1.5 py-1 overflow-x-auto no-scrollbar max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 min-w-[56px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 relative ${
                isActive
                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1 min-w-3.5 h-3.5 rounded-full flex items-center justify-center shadow">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0.5 w-6 h-0.5 bg-amber-500 dark:bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
