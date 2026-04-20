/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, RefreshCw, Disc } from 'lucide-react';

const TRACKS = [
  { id: 1, title: 'AI Neon Groove - Neural Net 1', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/MacLeod%2C_Kevin_-_Slow_Burn.ogg' },
  { id: 2, title: 'Synthwave Matrix - Generative', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/MacLeod%2C_Kevin_-_Limit_70.ogg' },
  { id: 3, title: 'Cybernetic Pulse - AI Output', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/MacLeod%2C_Kevin_-_The_Complex.ogg' },
];

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

// Speeds in ms
const GAME_SPEED = 100;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);

  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  
  const directionRef = useRef({ x: 0, y: -1 });
  // Used to prevent multiple keypresses in one tick
  const actionProcessedRef = useRef(false);
  const gameLoopRef = useRef<number | null>(null);

  // Music player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ 
      x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1, 
      y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1 
    });
    directionRef.current = { x: 0, y: -1 };
    setScore(0);
    setGameOver(false);
    setIsGameRunning(true);
  };

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y,
      };

      // Check collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        setIsGameRunning(false);
        return prevSnake;
      }

      // Check collision with self
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        setIsGameRunning(false);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check collision with food
      let ateFood = false;
      setFood((currentFood) => {
        if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
          setScore((s) => s + 10);
          ateFood = true;
          // generate new food not on snake
          let nextFood = { x: 0, y: 0 };
          let valid = false;
          while (!valid) {
             nextFood = {
              x: Math.floor(Math.random() * GRID_SIZE),
              y: Math.floor(Math.random() * GRID_SIZE),
             };
             // Ensure food isn't on the snake
             valid = !newSnake.some((s) => s.x === nextFood.x && s.y === nextFood.y);
          }
          return nextFood;
        }
        return currentFood;
      });

      if (!ateFood) {
        newSnake.pop(); // Remove tail if no food eaten
      }

      actionProcessedRef.current = false;
      return newSnake;
    });
  }, []);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  // Game Loop
  useEffect(() => {
    if (isGameRunning && !gameOver) {
      gameLoopRef.current = window.setInterval(moveSnake, GAME_SPEED);
    } else if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isGameRunning, gameOver, moveSnake]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (!isGameRunning) {
        if (e.key === " " || e.key === "Enter") {
          startGame();
        }
        return;
      }

      if (actionProcessedRef.current) return;

      const dir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (dir.y === 0) {
            directionRef.current = { x: 0, y: -1 };
            actionProcessedRef.current = true;
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (dir.y === 0) {
            directionRef.current = { x: 0, y: 1 };
            actionProcessedRef.current = true;
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (dir.x === 0) {
            directionRef.current = { x: -1, y: 0 };
            actionProcessedRef.current = true;
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (dir.x === 0) {
            directionRef.current = { x: 1, y: 0 };
            actionProcessedRef.current = true;
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, gameOver]);

  // Drawing to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    // Draw Food
    ctx.fillStyle = '#ec4899'; // pink-500
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ec4899';
    // Make the food slightly smaller than the cell for aesthetics
    const foodMargin = 2;
    ctx.fillRect(
      food.x * CELL_SIZE + foodMargin, 
      food.y * CELL_SIZE + foodMargin, 
      CELL_SIZE - foodMargin * 2, 
      CELL_SIZE - foodMargin * 2
    );

    // Draw Snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#22d3ee' : '#06b6d4'; // cyan-400 : cyan-500
      ctx.shadowBlur = isHead ? 15 : 5;
      ctx.shadowColor = '#06b6d4';
      ctx.fillRect(
        segment.x * CELL_SIZE + 1, 
        segment.y * CELL_SIZE + 1, 
        CELL_SIZE - 2, 
        CELL_SIZE - 2
      );
    });
    
    // Reset shadow
    ctx.shadowBlur = 0;
  }, [snake, food]);

  // Music Player logic
  const togglePlay = () => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error(e));
        }
        setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.play().catch(() => {
                setIsPlaying(false);
            });
        }
    }
  }, [currentTrackIndex]);

  const handleAudioEnded = () => {
    nextTrack();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-10 font-vt relative overflow-hidden pb-32 box-border selection:bg-fuchsia-500 selection:text-black">
      {/* Glitch CRT Effects */}
      <div className="static-bg" />
      <div className="crt-overlay" />
      <div className="screen-tear" />
      
      {/* Header */}
      <div className="text-center z-10 mb-8 mt-4 relative mix-blend-screen">
        <h1 className="font-pixel text-3xl md:text-5xl mb-4 tracking-tighter uppercase glitch-text" data-text="SYSTEM//SNAKE">
          SYSTEM//SNAKE
        </h1>
        <p className="text-cyan-400 font-pixel tracking-tighter text-xs md:text-sm uppercase shadow-[4px_4px_0_#ff00ff]">
          [ INITIALIZING NEURAL LINK ]
        </p>
      </div>

      {/* Score and Stats */}
      <div className="flex gap-16 text-center z-10 mb-6 font-pixel uppercase">
        <div className="flex flex-col items-center bg-black border-2 border-fuchsia-500 p-2 shadow-[4px_4px_0_#00ffff]">
          <span className="text-[10px] text-fuchsia-500 tracking-wider mb-2">Score</span>
          <span className="text-xl text-white">
            {score.toString().padStart(4, '0')}
          </span>
        </div>
        <div className="flex flex-col items-center bg-black border-2 border-cyan-400 p-2 shadow-[4px_4px_0_#ff00ff]">
          <span className="text-[10px] text-cyan-400 tracking-wider mb-2">Top</span>
          <span className="text-xl text-white">
            {highScore.toString().padStart(4, '0')}
          </span>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative z-10 border-4 border-fuchsia-500 p-1 bg-black shadow-[8px_8px_0_#00ffff]">
        <div className="relative border-2 border-cyan-400 overflow-hidden bg-[#050505]">
          <canvas 
            ref={canvasRef} 
            width={CANVAS_SIZE} 
            height={CANVAS_SIZE} 
            style={{ width: '400px', height: '400px', maxWidth: '100%', filter: 'contrast(1.5) saturate(1.5)' }}
            className="block mix-blend-screen"
          />
          
          {(!isGameRunning && !gameOver) && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-20">
              <h2 className="font-pixel text-2xl font-bold mb-6 text-white glitch-text" data-text="AWAITING IMPUT">
                AWAITING INPUT
              </h2>
              <div className="mb-8 font-pixel text-[#00FFFF] space-y-4 shadow-[2px_2px_0_#FF00FF] p-4 border border-[#FF00FF]">
                <p className="text-[10px] uppercase">Controls</p>
                <p className="text-[12px]">W A S D</p>
              </div>
              <button 
                onClick={startGame}
                className="group relative px-6 py-4 bg-fuchsia-500 text-black font-pixel text-[12px] uppercase hover:bg-cyan-400 hover:text-black transition-none shadow-[4px_4px_0_white] active:translate-y-1 active:translate-x-1 active:shadow-none"
              >
                [ EXECUTE ]
              </button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 text-center z-20 border-4 border-white">
              <h2 className="font-pixel text-3xl font-black mb-4 text-[#ff00ff] glitch-text" data-text="FATAL//ERROR">
                FATAL//ERROR
              </h2>
              <p className="text-sm mb-8 text-[#00ffff] font-pixel uppercase shadow-[2px_2px_0_#ff00ff]">
                Entity Terminated
              </p>
              <button 
                onClick={startGame}
                className="flex items-center gap-3 px-6 py-4 bg-white text-black border-2 border-black font-pixel text-[12px] uppercase hover:bg-[#00ffff] hover:text-black transition-none shadow-[4px_4px_0_#ff00ff] active:translate-y-1 active:translate-x-1 active:shadow-none"
              >
                <RefreshCw size={14} strokeWidth={3} /> REBOOT
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Music Player */}
      <div className="fixed bottom-0 left-0 w-full bg-black border-t-4 border-cyan-400 p-4 z-50 flex justify-center uppercase font-vt text-lg">
        <div className="absolute top-0 right-0 bottom-0 left-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,cyan_2px,cyan_4px)]"></div>
        <div className="w-full max-w-2xl flex items-center justify-between gap-4 px-2 relative z-10">
          
          <div className="flex items-center gap-4 flex-1 min-w-0 font-pixel">
            <div className={`w-10 h-10 border-2 border-fuchsia-500 flex items-center justify-center text-cyan-400 bg-black ${isPlaying ? 'animate-[bounce_0.2s_infinite]' : ''}`}>
               <Disc size={20} className={isPlaying ? "animate-[spin_0.5s_linear_infinite]" : ""} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] text-fuchsia-500 mb-1">SRC_FILE</span>
              <span className="text-[10px] text-white truncate shadow-[2px_2px_0_#ff00ff]">
                {TRACKS[currentTrackIndex].title}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 justify-end font-pixel">
            <button 
              onClick={prevTrack} 
              className="p-2 border-2 border-cyan-400 text-cyan-400 bg-black hover:bg-fuchsia-500 hover:text-black hover:border-fuchsia-500 shadow-[2px_2px_0_white] active:shadow-none active:translate-y-0.5 active:translate-x-0.5"
            >
              <SkipBack size={16} strokeWidth={3} />
            </button>
            
            <button 
              onClick={togglePlay} 
              className="p-3 border-2 border-fuchsia-500 text-black bg-white hover:bg-cyan-400 hover:border-cyan-400 shadow-[4px_4px_0_#ff00ff] active:shadow-none active:translate-y-1 active:translate-x-1"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-1" fill="currentColor" />}
            </button>
            
            <button 
              onClick={nextTrack} 
              className="p-2 border-2 border-cyan-400 text-cyan-400 bg-black hover:bg-fuchsia-500 hover:text-black hover:border-fuchsia-500 shadow-[2px_2px_0_white] active:shadow-none active:translate-y-0.5 active:translate-x-0.5"
            >
              <SkipForward size={16} strokeWidth={3} />
            </button>
          </div>
          
        </div>
        
        <audio 
          ref={audioRef} 
          src={TRACKS[currentTrackIndex].url} 
          onEnded={handleAudioEnded}
        />
      </div>
    </div>
  );
}
