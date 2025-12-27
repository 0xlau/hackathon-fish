import React from 'react';
import { GameState, RuleType, GamePhase } from '../types';

interface ChaosMonitorProps {
  gameState: GameState;
}

export const ChaosMonitor: React.FC<ChaosMonitorProps> = ({ gameState }) => {
  // Hide UI during intro, tutorial, or ending phases
  if (
    gameState.phase === GamePhase.INTRO || 
    gameState.phase === GamePhase.TUTORIAL ||
    gameState.phase === GamePhase.NAMING_ENDING ||
    gameState.phase === GamePhase.FINAL_REFLECTION
  ) {
    return null;
  }

  const getRuleText = (rule: RuleType) => {
    switch (rule) {
      case RuleType.COLOR_RED: return "收集：红色实体";
      case RuleType.COLOR_BLUE: return "收集：蓝色实体";
      case RuleType.SHAPE_ROUND: return "收集：圆形物质";
      case RuleType.SHAPE_SHARP: return "收集：尖锐物质";
      case RuleType.SOUL: return "错误：无法分类意图";
      default: return "等待指令...";
    }
  };

  const getStatusColor = () => {
    if (gameState.chaosLevel < 30) return 'text-cyan-400';
    if (gameState.chaosLevel < 70) return 'text-yellow-400';
    return 'text-red-500 animate-pulse';
  };

  // Calculate intensity based on score (cap at 200 for visual effect normalization)
  const scoreProgress = Math.min(gameState.score / 200, 1);
  const glowIntensity = scoreProgress * 20; // 0 to 20px blur
  const borderOpacity = 0.1 + (scoreProgress * 0.9);
  
  // Pulse animation when ready for the ending (score >= 200)
  const isReady = gameState.score >= 200;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 p-6 flex flex-col justify-between">
      {/* Top Bar: Rules & Timer */}
      <div className="flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-md p-4 rounded-lg border border-white/10 max-w-md">
          <h2 className="text-xs text-gray-400 tracking-widest uppercase mb-1">当前协议</h2>
          <div className="text-xl font-cinzel font-bold text-white mb-2">
            {getRuleText(gameState.currentRule)}
          </div>
          <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(gameState.ruleTimer / 60) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-black/60 backdrop-blur-md p-4 rounded-lg border border-white/10 text-right">
          <div className="text-xs text-gray-400 tracking-widest uppercase mb-1">世界稳定性</div>
          <div className={`text-3xl font-mono font-bold ${getStatusColor()}`}>
            {100 - gameState.chaosLevel}%
          </div>
        </div>
      </div>

      {/* Center Messages */}
      {gameState.message && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full">
          <h1 className="text-4xl md:text-6xl font-cinzel font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-bounce">
            {gameState.message}
          </h1>
        </div>
      )}

      {/* Bottom Right Score */}
      <div className="flex justify-end items-end">
        <div 
          className={`relative overflow-hidden bg-black/80 backdrop-blur-md p-4 rounded-lg border transition-all duration-500 ${isReady ? 'animate-pulse border-cyan-400' : 'border-white/10'}`}
          style={{
            borderColor: isReady ? '#22d3ee' : `rgba(255, 255, 255, ${borderOpacity})`,
            boxShadow: `0 0 ${glowIntensity}px rgba(34, 211, 238, ${scoreProgress * 0.5})`
          }}
        >
          {/* Progress Background */}
          <div 
            className="absolute bottom-0 left-0 h-0.5 bg-cyan-500 transition-all duration-500 ease-out opacity-70"
            style={{ width: `${scoreProgress * 100}%` }}
          />

          <div className="relative z-10 text-right">
            <div className="text-xs text-gray-400 tracking-widest uppercase mb-1">秩序重建</div>
            <div 
              className="text-3xl font-bold text-white transition-all duration-300"
              style={{
                textShadow: `0 0 ${glowIntensity}px rgba(34, 211, 238, ${scoreProgress})`,
                color: isReady ? '#22d3ee' : '#ffffff'
              }}
            >
              {gameState.score}
              <span className="text-sm font-normal text-gray-500 ml-2">/ 200</span>
            </div>
            {isReady && (
              <div className="text-[10px] text-cyan-300 font-mono mt-1 tracking-widest animate-pulse">
                阈值已突破 {'>>'} 寻找异常
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
