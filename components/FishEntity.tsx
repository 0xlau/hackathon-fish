import React from 'react';
import { Fish, FishType } from '../types';

interface FishEntityProps {
  fish: Fish;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
}

export const FishEntity: React.FC<FishEntityProps> = ({ fish, onMouseDown }) => {
  const isMirror = fish.type === FishType.MIRROR;
  const isGlitch = fish.type === FishType.GLITCH;

  const style: React.CSSProperties = {
    transform: `translate(${fish.x}px, ${fish.y}px) rotate(${fish.rotation}deg) scale(${fish.scale})`,
    position: 'absolute',
    left: 0,
    top: 0,
    width: '60px',
    height: '40px',
    cursor: 'grab',
    zIndex: fish.locked ? 50 : 10,
    transition: fish.locked ? 'none' : 'transform 0.1s linear',
  };

  const nameTag = fish.name && (
    <div 
      className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[10px] text-cyan-300 font-mono tracking-widest bg-black/60 px-2 py-0.5 rounded border border-cyan-500/30 whitespace-nowrap shadow-[0_0_10px_rgba(34,211,238,0.2)] pointer-events-none"
      style={{ transform: `translateX(-50%) rotate(${-fish.rotation}deg)` }} // Counter-rotate text so it stays readable
    >
      {fish.name}
    </div>
  );

  // Render Mirror Fish (Reflective/Soul entity)
  if (isMirror) {
    return (
      <div 
        style={style} 
        onMouseDown={(e) => onMouseDown(e, fish.id)}
        className="flex items-center justify-center drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
      >
        {nameTag}
        <svg width="60" height="40" viewBox="0 0 100 60">
           <defs>
             <linearGradient id="mirrorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="#e2e8f0" />
               <stop offset="50%" stopColor="#94a3b8" />
               <stop offset="100%" stopColor="#f1f5f9" />
             </linearGradient>
           </defs>
           <path 
             d="M90 30 Q70 0 40 10 T10 30 T40 50 T90 30 Z" 
             fill="url(#mirrorGradient)" 
             stroke="white" 
             strokeWidth="2"
           />
        </svg>
        <div className="absolute text-[10px] text-slate-800 font-bold mix-blend-overlay">
          ???
        </div>
      </div>
    );
  }

  // Normal / Glitch Fish
  return (
    <div
      style={style}
      onMouseDown={(e) => onMouseDown(e, fish.id)}
      className={`
        flex items-center justify-center
        ${isGlitch ? 'animate-pulse' : ''}
      `}
    >
      {nameTag}
      <svg width="60" height="40" viewBox="0 0 100 60" className="drop-shadow-lg">
        <path
          d={fish.shape === 'round' 
            ? "M90 30 Q70 0 40 10 T10 30 T40 50 T90 30 Z" 
            : "M95 30 L60 5 L10 30 L60 55 Z"} // Sharp is a diamond/triangle shape
          fill={fish.color}
          fillOpacity={0.8}
          stroke={isGlitch ? "#00ff00" : "rgba(255,255,255,0.4)"}
          strokeWidth={isGlitch ? 3 : 1}
          className="transition-all duration-300"
        />
        {/* Eye */}
        <circle cx="75" cy="25" r="3" fill="white" />
      </svg>
      {isGlitch && (
        <div className="absolute inset-0 text-[#00ff00] text-xs font-mono font-bold opacity-60">
          ERR
        </div>
      )}
    </div>
  );
};