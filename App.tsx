import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GamePhase, Fish, FishType, RuleType } from './types';
import { FishEntity } from './components/FishEntity';
import { ChaosMonitor } from './components/ChaosMonitor';

// --- Constants ---
const MAX_FISH = 20;
const SPAWN_RATE_MS = 1500;
const CHAOS_VELOCITY_CAP = 2.5;

const ORDER_NAMES = [
  "SEQUENCE", "METHOD", "LOGIC", "AXIOM", "NULL", "VOID", 
  "EGO", "DATA", "UNIT", "ATOM", "FLUX", "CORE", 
  "ECHO", "PRIME", "FORM", "SHAPE", "LAW", "RULE", 
  "NORM", "INDEX", "VECTOR", "CIPHER", "CODE"
];

const App: React.FC = () => {
  // --- Refs & State ---
  const requestRef = useRef<number | null>(null);
  const draggingId = useRef<string | null>(null);
  const [finalName, setFinalName] = useState('');
  const [hasRefusedNaming, setHasRefusedNaming] = useState(false);

  // Game State
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.INTRO,
    chaosLevel: 20,
    score: 0,
    currentRule: RuleType.COLOR_RED,
    ruleTimer: 60,
    message: '',
  });

  const [fishes, setFishes] = useState<Fish[]>([]);
  
  // --- Helper Functions ---

  const generateFish = (type: FishType = FishType.NORMAL): Fish => {
    const isGlitch = Math.random() < (gameState.chaosLevel / 200);
    const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24']; 
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + 50,
      vx: (Math.random() - 0.5) * 1,
      vy: -(Math.random() * 1.5 + 0.5),
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? 'round' : 'sharp',
      type: isGlitch ? FishType.GLITCH : type,
      scale: 0.8 + Math.random() * 0.4,
      rotation: 0,
      locked: false,
    };
  };

  const triggerEnding = useCallback(() => {
    // 1. Clear all current fish (The world becomes still)
    setFishes([]);
    
    // 2. Spawn the "Undefined Entity" (Mirror Fish) in the exact center
    // It has no definition, no movement, just existence.
    const lastFish: Fish = {
      id: 'final-entity',
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: 0,
      vy: 0,
      color: '#ffffff',
      shape: 'round',
      type: FishType.MIRROR,
      scale: 3.5, // Slightly larger for the clear view
      rotation: 0,
      locked: true, // Cannot be moved physically, only conceptually
    };
    
    setFishes([lastFish]);

    // 3. Transition State
    setGameState(prev => ({
      ...prev,
      phase: GamePhase.NAMING_ENDING,
      message: '',
      chaosLevel: 0 // Absolute zero chaos (Stillness)
    }));
  }, []);

  // --- Initialization ---

  const startTutorial = () => {
    setGameState(prev => ({ ...prev, phase: GamePhase.TUTORIAL }));
  };

  const startGame = () => {
    setGameState(prev => ({ ...prev, phase: GamePhase.PLAYING, message: "构建秩序" }));
    setTimeout(() => setGameState(prev => ({ ...prev, message: '' })), 3000);
  };

  const restartGame = () => {
    setGameState({
      phase: GamePhase.INTRO,
      chaosLevel: 20,
      score: 0,
      currentRule: RuleType.COLOR_RED,
      ruleTimer: 60,
      message: '',
    });
    setFishes([]);
    setFinalName('');
    setHasRefusedNaming(false);
  };

  // --- Game Loop (Physics & Logic) ---

  const updateGame = useCallback(() => {
    // Stop physics update during naming/ending phase for stillness
    if (gameState.phase !== GamePhase.PLAYING) return;

    // --- ENDING TRIGGERS ---
    // 1. COLLAPSE: Chaos Overload (Chaos >= 100) -> Resets to ending flow as "system failure" leading to void.
    // Note: The "Success" trigger (Score >= 200) is now handled via capturing the Mirror Fish in checkClassification.
    if (gameState.chaosLevel >= 100) {
        triggerEnding();
        return;
    }

    setFishes(currentFishes => {
      return currentFishes.map(fish => {
        if (fish.locked) return fish;

        let { x, y, vx, vy, rotation } = fish;

        // --- Logic for COLLECTED fish (In Order Zone) ---
        if (fish.isCollected) {
            // Calm Movement in the "Order" zone
            x += vx;
            y += vy;
            const zoneHeight = window.innerHeight * 0.2;
            if (x <= 10 || x >= window.innerWidth - 10) vx *= -1;
            if (y <= 10 || y >= zoneHeight - 10) vy *= -1;
            x = Math.max(10, Math.min(x, window.innerWidth - 10));
            y = Math.max(10, Math.min(y, zoneHeight - 10));
            rotation += 0.5;
            return { ...fish, x, y, vx, vy, rotation };
        }

        // --- Logic for NORMAL fish (Chaos Water) ---
        const stability = Math.max(0, (100 - gameState.chaosLevel) / 100);
        const chaosFactor = 1 - stability;
        
        const time = Date.now() / 1000;
        const driftAmplitude = 0.01 + (chaosFactor * 0.15); 
        const driftX = Math.sin(time + fish.id.charCodeAt(0)) * driftAmplitude;
        
        const turbulenceX = (Math.random() - 0.5) * chaosFactor * 0.8;
        const turbulenceY = (Math.random() - 0.5) * chaosFactor * 0.8;

        vx += driftX + turbulenceX;
        vy += turbulenceY - 0.02; // Buoyancy
        vx *= 0.95;
        vy *= 0.95;

        // Cap velocity
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed > CHAOS_VELOCITY_CAP) {
            const ratio = CHAOS_VELOCITY_CAP / speed;
            vx *= ratio;
            vy *= ratio;
        }
        
        x += vx;
        y += vy;

        // Rotation follows velocity
        const targetRotation = Math.atan2(vy, vx) * (180 / Math.PI);
        let diff = targetRotation - rotation;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        rotation += diff * 0.1;

        // Screen wrap
        if (x < -50) x = window.innerWidth + 50;
        if (x > window.innerWidth + 50) x = -50;
        if (y < -50) y = window.innerHeight + 50;
        if (y > window.innerHeight + 50) y = -50;

        return { ...fish, x, y, vx, vy, rotation };
      });
    });

    // Update Game Rules & Timer
    setGameState(prev => {
      let newMessage = prev.message;
      let newRule = prev.currentRule;
      let newChaos = prev.chaosLevel;
      const newTime = prev.ruleTimer - (1/60);
      
      if (newTime <= 0) {
        const rules = [RuleType.COLOR_RED, RuleType.COLOR_BLUE, RuleType.SHAPE_ROUND, RuleType.SHAPE_SHARP];
        newRule = rules[Math.floor(Math.random() * rules.length)];
        
        if (prev.chaosLevel > 50 && Math.random() > 0.7) {
           newRule = RuleType.SOUL;
           newMessage = "警告：检测到无法归类的异常";
           newChaos += 10;
        } else {
           newMessage = "规则变动中...";
           newChaos += 2;
        }
        
        return {
          ...prev,
          ruleTimer: 60,
          currentRule: newRule,
          message: newMessage,
          chaosLevel: Math.min(100, newChaos)
        };
      }
      return { ...prev, ruleTimer: newTime, message: newMessage === "规则变动中..." && newTime < 58 ? "" : newMessage };
    });

    requestRef.current = requestAnimationFrame(updateGame);
  }, [gameState.phase, gameState.chaosLevel, triggerEnding]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateGame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [updateGame]);

  // --- Spawning Logic ---
  useEffect(() => {
    if (gameState.phase !== GamePhase.PLAYING) return;
    const interval = setInterval(() => {
      setFishes(prev => {
        const activeFishCount = prev.filter(f => !f.isCollected).length;
        if (activeFishCount >= MAX_FISH) return prev;
        
        // Spawn Mirror Fish ONLY if score >= 200 and one doesn't already exist
        // It has a random chance to appear once requirements are met
        const existingMirror = prev.find(f => f.type === FishType.MIRROR);
        const scoreConditionMet = gameState.score >= 200;
        const shouldSpawnMirror = scoreConditionMet && !existingMirror && Math.random() > 0.3; // 30% chance per tick once score is high enough

        return [...prev, generateFish(shouldSpawnMirror ? FishType.MIRROR : FishType.NORMAL)];
      });
    }, SPAWN_RATE_MS); 
    return () => clearInterval(interval);
  }, [gameState.phase, gameState.score]); // Added gameState.score dependency

  // --- Interaction ---
  const checkClassification = (fish: Fish) => {
    if (fish.y < window.innerHeight * 0.2) {
      
      // SPECIAL ENDING TRIGGER
      if (fish.type === FishType.MIRROR) {
        triggerEnding();
        return;
      }

      let correct = false;
      const { currentRule } = gameState;

      if (currentRule === RuleType.COLOR_RED && fish.color === '#f87171') correct = true;
      else if (currentRule === RuleType.COLOR_BLUE && fish.color === '#60a5fa') correct = true;
      else if (currentRule === RuleType.SHAPE_ROUND && fish.shape === 'round') correct = true;
      else if (currentRule === RuleType.SHAPE_SHARP && fish.shape === 'sharp') correct = true;
      // Note: RuleType.SOUL logic removed here as Mirror fish now triggers ending directly

      if (correct) {
        const randomName = ORDER_NAMES[Math.floor(Math.random() * ORDER_NAMES.length)];
        setGameState(prev => ({
          ...prev,
          score: prev.score + 10,
          chaosLevel: Math.max(0, prev.chaosLevel - 5),
          message: "秩序验证通过"
        }));
        setFishes(prev => prev.map(f => {
            if (f.id === fish.id) {
                return { 
                    ...f, 
                    locked: false, 
                    isCollected: true,
                    name: randomName,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    y: Math.min(f.y, window.innerHeight * 0.15)
                };
            }
            return f;
        }));
      } else {
        setGameState(prev => ({
          ...prev,
          chaosLevel: Math.min(100, prev.chaosLevel + 10),
          message: "无效实体"
        }));
        setFishes(prev => prev.map(f => {
            if (f.id === fish.id) return { ...f, locked: false, vx: (Math.random()-0.5)*5, vy: 5, y: window.innerHeight*0.25 };
            return f;
        }));
      }
      setTimeout(() => setGameState(prev => ({ ...prev, message: '' })), 1500);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (gameState.phase !== GamePhase.PLAYING) return;
    const fish = fishes.find(f => f.id === id);
    if (fish && fish.isCollected) return;
    draggingId.current = id;
    setFishes(prev => prev.map(f => f.id === id ? { ...f, locked: true } : f));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId.current) {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      setFishes(prev => prev.map(f => f.id === draggingId.current ? { ...f, x: mouseX, y: mouseY, vx: 0, vy: 0 } : f));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggingId.current) {
      const draggedFish = fishes.find(f => f.id === draggingId.current);
      if (draggedFish) {
        if (draggedFish.y < window.innerHeight * 0.2) checkClassification(draggedFish);
        else setFishes(prev => prev.map(f => f.id === draggingId.current ? { ...f, locked: false, vx: (Math.random()-0.5)*2, vy: 1 } : f));
      } else {
        setFishes(prev => prev.map(f => f.id === draggingId.current ? { ...f, locked: false } : f));
      }
      draggingId.current = null;
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!finalName.trim()) return;
      setHasRefusedNaming(false);
      transitionToReflection();
  };

  const handleRefuseNaming = () => {
      setHasRefusedNaming(true);
      setFinalName(''); // Clear name
      transitionToReflection();
  };

  const transitionToReflection = () => {
      // Fade out the last fish
      setFishes([]); 
      setTimeout(() => {
          setGameState(prev => ({ ...prev, phase: GamePhase.FINAL_REFLECTION }));
      }, 800);
  };

  // --- Render Sections ---

  const renderIntro = () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white p-8 z-50 relative">
      <h1 className="text-5xl md:text-7xl font-cinzel mb-4 tracking-widest text-cyan-500 text-center">无序之海</h1>
      <h2 className="text-xl md:text-2xl text-cyan-800 mb-8 font-serif tracking-[0.5em] text-center">SEA OF DISORDER</h2>
      <p className="max-w-md text-center text-gray-400 mb-12 font-inter leading-relaxed">
        尝试在混乱中建立秩序。<br/>
        但请记住，任何分类都是一种偏见。
      </p>
      <button 
        onClick={startTutorial}
        className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-full transition-all hover:scale-105"
      >
          <div className="absolute inset-0 w-full h-full bg-cyan-600/20 border border-cyan-500 blur-sm group-hover:blur-md transition-all"></div>
          <div className="relative flex items-center gap-3 text-cyan-300 font-bold tracking-[0.2em] group-hover:text-white">
            <span>开始构建</span>
            <span className="text-xl">→</span>
          </div>
      </button>
    </div>
  );

  const renderTutorial = () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black/90 text-white p-8 z-50 absolute inset-0 backdrop-blur-xl">
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        <h3 className="text-3xl font-cinzel text-cyan-400">重建协议</h3>
        <div className="bg-white/5 p-8 rounded-xl border border-white/10 max-w-md mx-auto">
          <div className="text-4xl mb-4">👆</div>
          <p className="text-lg leading-relaxed mb-4">
            根据屏幕上方的指令，将符合条件的实体<br/>
            <b>拖拽至屏幕顶部</b>进行归档。
          </p>
          <p className="text-sm text-yellow-400/80">达到 200 分后，寻找异常实体以稳定现实。</p>
        </div>
        <button onClick={startGame} className="mt-12 px-10 py-3 bg-white text-black font-bold tracking-widest hover:bg-cyan-400 transition-colors rounded-full">
          潜入
        </button>
      </div>
    </div>
  );

  const renderNamingEnding = () => (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.9)_70%)] animate-fade-in">
          {/* We use a radial gradient above so the center is CLEAR and the edges are DARK. 
              The FishEntity is rendered in the main loop behind this div, but since this div is transparent in the middle, we see the fish clearly.
          */}
          
          <div className="absolute top-[15%] w-full text-center px-4">
              <h3 className="text-gray-300 font-serif text-lg tracking-widest mb-2 opacity-80 leading-loose drop-shadow-md">
                  世界归于静止，唯有它存在。
              </h3>
          </div>

          {/* Controls positioned below the fish (center screen) */}
          <div className="mt-[40vh] relative z-50 flex flex-col items-center space-y-8">
              <h2 className="text-cyan-200 font-bold text-xl tracking-[0.2em] animate-pulse drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                  你想给它一个名字吗？
              </h2>
              
              <div className="flex flex-col items-center gap-6 bg-black/40 p-8 rounded-2xl border border-white/5 backdrop-blur-sm">
                  <form onSubmit={handleNameSubmit} className="flex flex-col items-center gap-4 w-full">
                      <input 
                          type="text" 
                          value={finalName}
                          onChange={(e) => setFinalName(e.target.value)}
                          placeholder="输入名字..."
                          className="bg-transparent border-b border-white/30 text-center text-2xl font-serif text-white placeholder-white/20 focus:outline-none focus:border-cyan-400 transition-colors w-64 pb-2"
                          autoFocus
                      />
                      <button 
                        type="submit" 
                        disabled={!finalName.trim()}
                        className={`w-full py-3 text-sm tracking-[0.3em] uppercase border border-cyan-500/30 bg-cyan-900/20 hover:bg-cyan-500 hover:text-white transition-all duration-500 rounded ${finalName.trim() ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`}
                      >
                          确认定义
                      </button>
                  </form>

                  <div className="flex items-center gap-2 w-full">
                      <div className="h-px bg-white/10 flex-grow"></div>
                      <span className="text-white/20 text-xs uppercase tracking-widest">OR</span>
                      <div className="h-px bg-white/10 flex-grow"></div>
                  </div>

                  <button 
                      onClick={handleRefuseNaming}
                      className="text-gray-400 hover:text-white text-xs tracking-[0.2em] transition-colors border-b border-transparent hover:border-white/50 pb-1"
                  >
                      不，我不定义它
                  </button>
              </div>
          </div>
      </div>
  );

  const renderFinalReflection = () => {
    if (hasRefusedNaming) {
      // Branch B: Refused Naming
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] transition-all duration-1000">
            <div className="max-w-3xl text-center px-8 animate-fade-in-slow space-y-12">
                <p className="text-6xl text-white/5 font-serif">ø</p>
                <h2 className="text-xl md:text-3xl text-gray-400 font-cinzel leading-relaxed tracking-wide">
                    你拒绝了强加定义的诱惑。<br/><br/>
                    在没有任何名字的注视下，它依然存在。<br/>
                    <span className="text-white/90 mt-4 block text-lg font-serif italic">未被定义的，或许才是最真实的。</span>
                </h2>
                <p className="text-gray-700 font-inter text-xs tracking-[0.5em] pt-16 uppercase">
                    无序之海 · 终
                </p>
            </div>
            <button 
                onClick={restartGame}
                className="absolute bottom-12 text-white/20 hover:text-white transition-colors text-xs tracking-[0.2em]"
            >
                再次尝试
            </button>
        </div>
      );
    }

    // Branch A: Named
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0f172a] transition-all duration-1000">
            <div className="max-w-3xl text-center px-8 animate-fade-in-slow space-y-12">
                <p className="text-6xl text-white/10 font-serif">“</p>
                <h2 className="text-xl md:text-3xl text-gray-300 font-cinzel leading-relaxed tracking-wide">
                    秩序，不曾存在。<br/><br/>
                    <span className="text-white font-bold">秩序，从你说出 <span className="text-cyan-400 border-b border-cyan-400/30 pb-1 px-2">{finalName}</span> 的那一刻开始存在。</span>
                </h2>
                <p className="text-gray-600 font-inter text-xs tracking-[0.5em] pt-16 uppercase">
                    无序之海 · 终
                </p>
            </div>
            <button 
                onClick={restartGame}
                className="absolute bottom-12 text-white/20 hover:text-white transition-colors text-xs tracking-[0.2em]"
            >
                再次尝试构建
            </button>
        </div>
    );
  };

  // --- Main Render ---

  return (
    <>
      {gameState.phase === GamePhase.INTRO && renderIntro()}
      {gameState.phase === GamePhase.TUTORIAL && renderTutorial()}
      {gameState.phase === GamePhase.FINAL_REFLECTION && renderFinalReflection()}

      {(gameState.phase === GamePhase.PLAYING || gameState.phase === GamePhase.NAMING_ENDING) && (
        <div 
          className="h-screen w-screen relative overflow-hidden sea-background cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <ChaosMonitor gameState={gameState} />

          {/* Collection Zone Indicator */}
          {gameState.phase === GamePhase.PLAYING && (
              <div className="absolute top-0 left-0 w-full h-[20%] border-b border-white/10 bg-white/5 flex items-center justify-center pointer-events-none z-0">
                <span className="text-white/20 text-4xl font-cinzel font-bold tracking-[0.5em]">秩序归档区</span>
              </div>
          )}

          {/* Fish Layer */}
          {fishes.map(fish => (
            <FishEntity 
              key={fish.id} 
              fish={fish} 
              onMouseDown={handleMouseDown}
            />
          ))}

          {/* Ending Overlay */}
          {gameState.phase === GamePhase.NAMING_ENDING && renderNamingEnding()}

          {/* Atmospheric Overlays */}
          <div className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 
            ${gameState.chaosLevel > 70 && gameState.phase === GamePhase.PLAYING ? 'opacity-30' : 'opacity-0'} 
            bg-red-900 mix-blend-overlay`} 
          />
        </div>
      )}
    </>
  );
};

export default App;