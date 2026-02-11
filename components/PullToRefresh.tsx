import React, { useState, useRef } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, className = '' }) => {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only enable pull if we are at the top of the scroll container
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || refreshing) return;
    
    // Only if we are at the top
    if (containerRef.current && containerRef.current.scrollTop > 0) {
        setStartY(0);
        return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 0) {
        // Add resistance (logarithmic/power pull)
        const resistance = Math.pow(diff, 0.8); 
        setPullDistance(resistance);
        
        // Prevent default scrolling if we are pulling down significantly
        if (e.cancelable && diff > 5) {
             // We don't prevent default here to allow scroll recovery, 
             // but strictly handling it usually requires 'touch-action: none' or similar.
             // For this simple implementation, we let the browser decide but visual feedback is key.
        }
    } else {
        setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD); // Snap to loading position
      
      // Haptic feedback if available
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
      }

      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
        setStartY(0);
      }
    } else {
      setPullDistance(0);
      setStartY(0);
    }
  };

  return (
    <div 
        ref={containerRef}
        className={`h-full overflow-y-auto relative no-scrollbar overscroll-contain ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      {/* Loading Indicator Layer */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center items-center pointer-events-none z-20"
        style={{ 
            height: `${Math.max(pullDistance, refreshing ? THRESHOLD : 0)}px`,
            opacity: Math.min(pullDistance / (THRESHOLD * 0.8), 1),
            transition: refreshing ? 'height 0.2s ease' : 'none'
        }}
      >
          <div className="bg-white dark:bg-[#1c1c1e] p-2 rounded-full shadow-lg border border-black/5 dark:border-white/10 flex items-center justify-center">
            {refreshing ? (
                <Loader2 className="animate-spin text-[#FF5722]" size={20} />
            ) : (
                <ArrowDown 
                    className={`text-[#FF5722] transition-transform duration-300 ${pullDistance > THRESHOLD ? 'rotate-180' : ''}`} 
                    size={20} 
                />
            )}
          </div>
      </div>
      
      {/* Content Layer */}
      <div 
        className="transition-transform duration-300 ease-out min-h-full"
        style={{ transform: `translateY(${Math.max(pullDistance, refreshing ? THRESHOLD : 0)}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;