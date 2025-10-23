import React, { useEffect, useState } from 'react';
import { Eye, Brain } from 'lucide-react';

type ViewMode = 'pbl' | 'sensa';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  onViewChange,
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved preference from localStorage
    const saved = localStorage.getItem('conceptMapView') as ViewMode;
    if (saved && (saved === 'pbl' || saved === 'sensa')) {
      onViewChange(saved);
    }
  }, []);

  const handleViewChange = (view: ViewMode) => {
    onViewChange(view);
    // Persist selection
    localStorage.setItem('conceptMapView', view);
  };

  if (!mounted) return null;

  return (
    <div className={`inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ${className}`}>
      <button
        onClick={() => handleViewChange('pbl')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
          ${currentView === 'pbl'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }
        `}
      >
        <Eye className="w-4 h-4" />
        <span>PBL View</span>
      </button>
      
      <button
        onClick={() => handleViewChange('sensa')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
          ${currentView === 'sensa'
            ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }
        `}
      >
        <Brain className="w-4 h-4" />
        <span>Sensa Learn View</span>
      </button>
    </div>
  );
};
