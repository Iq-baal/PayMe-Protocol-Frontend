import React from 'react';

interface AppLogoProps {
  className?: string;
}

const AppLogo: React.FC<AppLogoProps> = ({ className = "w-20 h-20" }) => {
  // Using app background color (Dark)
  const bgColor = "#0f0b1e"; 

  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} rounded-[24px] shadow-2xl`}>
        {/* Background */}
        <rect width="100" height="100" fill={bgColor} />
        
        {/* Bottom Layer - Purple */}
        <path 
            d="M50 83 L80 70 L50 57 L20 70 Z" 
            fill={bgColor} 
            stroke="#673AB7" 
            strokeWidth="6" 
            strokeLinejoin="round" 
        />
        
        {/* Middle Layer - White */}
        <path 
            d="M50 69 L80 56 L50 43 L20 56 Z" 
            fill={bgColor} 
            stroke="#FFFFFF" 
            strokeWidth="6" 
            strokeLinejoin="round" 
        />
        
        {/* Top Layer - Orange */}
        <path 
            d="M50 55 L80 42 L50 29 L20 42 Z" 
            fill={bgColor} 
            stroke="#FF5722" 
            strokeWidth="6" 
            strokeLinejoin="round" 
        />
    </svg>
  );
};

export default AppLogo;