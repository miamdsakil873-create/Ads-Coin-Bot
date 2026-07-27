import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { SPIN_WHEEL_REWARDS } from '../data/mockData';
import { Gamepad2, Sparkles, RefreshCw, Trophy, Zap, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GamesSectionProps {
  user: UserProfile;
  onSpinWheel: (isBought: boolean) => Promise<any>;
  onScratchCard: () => Promise<any>;
}

export const GamesSection: React.FC<GamesSectionProps> = ({
  user,
  onSpinWheel,
  onScratchCard
}) => {
  const [activeGame, setActiveGame] = useState<'spin' | 'scratch'>('spin');

  // Spin Wheel States
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [spinResult, setSpinResult] = useState<any>(null);
  const [spinError, setSpinError] = useState<string | null>(null);

  // Scratch Card States
  const [scratching, setScratching] = useState(false);
  const [scratchRevealed, setScratchRevealed] = useState(false);
  const [scratchPrize, setScratchPrize] = useState<number | null>(null);
  const [scratchError, setScratchError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Scratch Surface
  const initScratchCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with glossy silver scratch layer
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#94A3B8');
    grad.addColorStop(0.5, '#CBD5E1');
    grad.addColorStop(1, '#64748B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ SCRATCH HERE WITH FINGER ✨', canvas.width / 2, canvas.height / 2 + 5);
  };

  useEffect(() => {
    if (activeGame === 'scratch') {
      initScratchCanvas();
    }
  }, [activeGame, scratchRevealed]);

  // Handle Wheel Spin
  const handleStartSpin = async (isBought: boolean) => {
    if (isSpinning) return;
    setSpinError(null);
    setSpinResult(null);

    try {
      const res = await onSpinWheel(isBought);
      const won = res.reward;

      // Find segment index
      const segIndex = SPIN_WHEEL_REWARDS.findIndex(r => r.id === won.id);
      const segAngle = 360 / SPIN_WHEEL_REWARDS.length;
      const targetDeg = 360 * 5 + (360 - segIndex * segAngle - segAngle / 2);

      setIsSpinning(true);
      setRotationDegrees(prev => prev + targetDeg);

      setTimeout(() => {
        setIsSpinning(false);
        setSpinResult(won);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }, 3500);
    } catch (err: any) {
      setSpinError(err.message || 'Spin failed.');
    }
  };

  // Scratch Action Handling
  const handleScratchMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!scratching || scratchRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleStartScratchCard = async () => {
    setScratchError(null);
    try {
      const res = await onScratchCard();
      setScratchPrize(res.prizeCoins);
      setScratchRevealed(true);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      setScratchError(err.message || 'Scratch card failed');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Sub Tabs */}
      <div className="flex rounded-2xl bg-slate-900 p-1 border border-slate-800">
        <button
          onClick={() => setActiveGame('spin')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeGame === 'spin'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Spin the Wheel
        </button>

        <button
          onClick={() => setActiveGame('scratch')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeGame === 'scratch'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Scratch Cards
        </button>
      </div>

      {/* SPIN WHEEL MODULE */}
      {activeGame === 'spin' && (
        <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 text-center space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Free Spins Remaining:</span>
            <span className="font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              {user.stats.spinsRemainingToday} Free Spins
            </span>
          </div>

          {/* Wheel Graphic Container */}
          <div className="relative w-64 h-64 mx-auto my-4 flex items-center justify-center">
            {/* Top Pointer */}
            <div className="absolute -top-3 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 filter drop-shadow-md"></div>

            {/* SVG Wheel */}
            <div
              className="w-full h-full rounded-full border-4 border-amber-400/80 shadow-2xl shadow-amber-500/20 overflow-hidden transition-transform ease-out"
              style={{
                transform: `rotate(${rotationDegrees}deg)`,
                transitionDuration: isSpinning ? '3.5s' : '0s'
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {SPIN_WHEEL_REWARDS.map((item, idx) => {
                  const total = SPIN_WHEEL_REWARDS.length;
                  const angle = 360 / total;
                  const startAngle = idx * angle;
                  const endAngle = (idx + 1) * angle;

                  const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                  const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                  const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                  const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                  return (
                    <path
                      key={item.id}
                      d={pathData}
                      fill={item.color}
                      stroke="#0F172A"
                      strokeWidth="0.8"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Center Pin Button */}
            <button
              onClick={() => handleStartSpin(false)}
              disabled={isSpinning || user.stats.spinsRemainingToday <= 0}
              className="absolute z-10 w-16 h-16 rounded-full bg-slate-900 border-4 border-amber-400 text-amber-300 font-extrabold text-xs shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              SPIN
            </button>
          </div>

          {spinResult && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-amber-300 text-xs font-bold animate-bounce">
              🎉 Congratulations! You won {spinResult.label}!
            </div>
          )}

          {spinError && (
            <p className="text-xs text-red-400 font-medium">{spinError}</p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => handleStartSpin(false)}
              disabled={isSpinning || user.stats.spinsRemainingToday <= 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              Use Free Spin
            </button>

            <button
              onClick={() => handleStartSpin(true)}
              disabled={isSpinning || user.withdrawableCoins < 100}
              className="flex-1 py-3 rounded-xl bg-slate-800 border border-amber-500/30 text-amber-300 font-bold text-xs hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              Buy Spin (100 Coins)
            </button>
          </div>
        </div>
      )}

      {/* SCRATCH CARD MODULE */}
      {activeGame === 'scratch' && (
        <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 text-center space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Lucky Gold Scratch Card</h3>
            <p className="text-xs text-slate-400 mt-0.5">Scratch surface to win 50 to 800 Coins! (150 Coins / play)</p>
          </div>

          <div className="relative w-64 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-xl shadow-purple-950/30">
            {/* Hidden Prize Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center p-4">
              <Trophy className="w-8 h-8 text-amber-400 mb-1" />
              <span className="text-2xl font-extrabold text-amber-300">
                {scratchPrize ? `+${scratchPrize} Coins` : 'Scratch Below!'}
              </span>
            </div>

            {/* Canvas Scratch Layer */}
            <canvas
              ref={canvasRef}
              width={256}
              height={144}
              onMouseDown={() => setScratching(true)}
              onMouseUp={() => setScratching(false)}
              onMouseMove={handleScratchMove}
              onTouchStart={() => setScratching(true)}
              onTouchEnd={() => setScratching(false)}
              onTouchMove={handleScratchMove}
              className="absolute inset-0 cursor-pointer touch-none"
            />
          </div>

          {scratchError && (
            <p className="text-xs text-red-400 font-medium">{scratchError}</p>
          )}

          <button
            onClick={handleStartScratchCard}
            disabled={user.withdrawableCoins < 150}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 hover:brightness-110 disabled:opacity-50"
          >
            Buy Scratch Card (150 Coins)
          </button>
        </div>
      )}
    </div>
  );
};
