import React from 'react';

interface PixelGoatIconProps {
  className?: string;
  size?: number;
}

/**
 * PixelGoatIcon - Custom retro 16x16 pixel art goat icon
 */
export const PixelGoatIcon: React.FC<PixelGoatIconProps> = ({ 
  className = "w-6 h-6", 
  size = 24 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} inline-block select-none`}
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Background soft glow / base bounding if needed */}
      
      {/* Horns (Amber / Gold) */}
      <rect x="3" y="1" width="2" height="2" fill="#F59E0B" />
      <rect x="2" y="2" width="2" height="2" fill="#D97706" />
      <rect x="11" y="1" width="2" height="2" fill="#F59E0B" />
      <rect x="12" y="2" width="2" height="2" fill="#D97706" />

      {/* Ears (Soft pink/grey) */}
      <rect x="1" y="5" width="2" height="2" fill="#94A3B8" />
      <rect x="0" y="6" width="2" height="2" fill="#F472B6" />
      <rect x="13" y="5" width="2" height="2" fill="#94A3B8" />
      <rect x="14" y="6" width="2" height="2" fill="#F472B6" />

      {/* Main Head (White / Cream / Light Slate) */}
      <rect x="4" y="3" width="8" height="2" fill="#F8FAFC" />
      <rect x="3" y="4" width="10" height="6" fill="#F1F5F9" />
      <rect x="4" y="9" width="8" height="4" fill="#E2E8F0" />
      
      {/* Forehead accent / fur highlight */}
      <rect x="6" y="3" width="4" height="2" fill="#FFFFFF" />
      <rect x="7" y="5" width="2" height="2" fill="#E2E8F0" />

      {/* Goat Eyes (Dark with horizontal pupil look) */}
      <rect x="4" y="6" width="2" height="2" fill="#0F172A" />
      <rect x="4" y="6" width="1" height="1" fill="#38BDF8" />
      <rect x="10" y="6" width="2" height="2" fill="#0F172A" />
      <rect x="11" y="6" width="1" height="1" fill="#38BDF8" />

      {/* Snout / Muzzle */}
      <rect x="5" y="9" width="6" height="3" fill="#CBD5E1" />
      <rect x="6" y="10" width="1" height="1" fill="#475569" />
      <rect x="9" y="10" width="1" height="1" fill="#475569" />
      <rect x="7" y="11" width="2" height="1" fill="#94A3B8" />

      {/* Cute Goat Beard / Goatee */}
      <rect x="6" y="13" width="4" height="2" fill="#FFFFFF" />
      <rect x="7" y="15" width="2" height="1" fill="#E2E8F0" />
    </svg>
  );
};
