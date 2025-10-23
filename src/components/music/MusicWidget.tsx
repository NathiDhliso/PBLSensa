/**
 * MusicWidget Component
 * 
 * Brain.fm iframe widget integration
 */

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface MusicWidgetProps {
  onError?: () => void;
}

export function MusicWidget({ onError }: MusicWidgetProps) {
  const [hasError, setHasError] = useState(false);
  
  const widgetUrl = import.meta.env.VITE_BRAINFM_WIDGET_URL || '';

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (!widgetUrl) {
    return (
      <div className="flex items-center gap-2 p-4 text-text-medium dark:text-dark-text-secondary">
        <AlertCircle size={20} />
        <p className="text-sm">Music player not configured</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center gap-2 p-4 text-text-medium dark:text-dark-text-secondary">
        <AlertCircle size={20} />
        <p className="text-sm">Unable to load music player</p>
      </div>
    );
  }

  return (
    <iframe
      src={widgetUrl}
      width="100%"
      height="200"
      frameBorder="0"
      allow="autoplay"
      onError={handleError}
      className="rounded-lg"
      title="Brain.fm Focus Music Player"
    />
  );
}
