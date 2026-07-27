import React, { useState } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface CaptchaModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const CaptchaModal: React.FC<CaptchaModalProps> = ({ onSuccess, onClose }) => {
  const [num1, setNum1] = useState(Math.floor(Math.random() * 10) + 1);
  const [num2, setNum2] = useState(Math.floor(Math.random() * 10) + 1);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refreshCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setUserAnswer('');
    setError(null);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userAnswer, 10) === num1 + num2) {
      onSuccess();
    } else {
      setError('Incorrect CAPTCHA answer! Please try again.');
      refreshCaptcha();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Anti-Bot Verification</h3>
          <p className="text-xs text-slate-400">Solve quick math puzzle to continue task verification.</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-3">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <span className="text-lg font-mono font-bold text-cyan-300">
              {num1} + {num2} = ?
            </span>

            <button
              type="button"
              onClick={refreshCaptcha}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <input
            type="number"
            placeholder="Enter answer"
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono text-center text-lg"
            autoFocus
          />

          {error && <p className="text-xs text-red-400 font-bold text-center">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold shadow-md shadow-cyan-500/20"
            >
              Verify & Proceed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
