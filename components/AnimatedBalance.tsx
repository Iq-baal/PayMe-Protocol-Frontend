import React, { useEffect, useState, useRef } from 'react';

interface AnimatedBalanceProps {
  value: number;
  prefix?: string;
  decimals?: number;
  className?: string; // Base classes
  decimalClassName?: string;
}

const AnimatedBalance: React.FC<AnimatedBalanceProps> = ({ 
    value, 
    prefix = '', 
    decimals = 2,
    className = '',
    decimalClassName = ''
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [flashColor, setFlashColor] = useState<string | null>(null);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    
    if (start === end) return;

    // Determine direction for flash
    if (end > start) {
        setFlashColor('text-green-500 dark:text-green-400');
    } else {
        setFlashColor('text-red-500 dark:text-red-400');
    }

    // Reset flash after animation
    const flashTimer = setTimeout(() => {
        setFlashColor(null);
    }, 1000);

    const duration = 1000; // 1s animation
    const startTime = performance.now();

    const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // Ease Out Quart
        
        const current = start + (end - start) * ease;
        setDisplayValue(current);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            setDisplayValue(end);
        }
    };
    
    requestAnimationFrame(animate);
    
    return () => clearTimeout(flashTimer);
  }, [value]);

  const renderContent = () => {
      // Abbreviate for large numbers (>= 1,000,000)
      if (displayValue >= 1_000_000) {
          const compact = new Intl.NumberFormat('en-US', { 
              notation: "compact", 
              maximumFractionDigits: 1,
              minimumFractionDigits: 0
          }).format(displayValue);
          
          return (
              <span className={flashColor || className}>
                  {prefix}{compact}
              </span>
          );
      }

      // Standard styling for smaller numbers (split whole/decimals)
      const formatted = displayValue.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
      });

      const parts = formatted.split('.');
      const whole = parts[0];
      const decimal = parts.length > 1 ? parts[1] : '';

      return (
          <span className={`${flashColor ? flashColor : className} transition-colors duration-300`}>
              {prefix}{whole}
              {decimal && <span className={flashColor ? '' : decimalClassName}>.{decimal}</span>}
          </span>
      );
  };

  return renderContent();
};
export default AnimatedBalance;
