import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, noPadding = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        glass-card-gradient 
        rounded-[32px] 
        relative 
        overflow-hidden
        transition-all 
        duration-300
        ${noPadding ? '' : 'p-6'}
        ${className}
      `}
    >
      {/* Shiny thing. Investors love shiny things. */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;