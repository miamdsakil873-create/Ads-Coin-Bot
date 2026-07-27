import React, { useState } from 'react';
import { simulateBotCommand } from '../services/api';
import { Bot, Send, X, ExternalLink, MessageSquare, Terminal } from 'lucide-react';

interface BotSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  telegramId: number;
}

export const BotSimulatorDrawer: React.FC<BotSimulatorDrawerProps> = ({
  isOpen,
  onClose,
  telegramId
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; inlineKeyboard?: any[] }>>([
    {
      sender: 'bot',
      text: '🤖 *Telegram Bot Simulator Active*\nType /start or click quick buttons below to test Telegram Bot triggers & deep links!',
      inlineKeyboard: [
        [{ text: '📱 Open WebApp Dashboard', web_app: { url: '#' } }],
        [{ text: '💰 Balance & Withdraw', callback_data: 'balance' }, { text: '👥 Refer & Earn', callback_data: 'refer' }]
      ]
    }
  ]);
  const [input, setInput] = useState('/start');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (cmdToSend?: string) => {
    const cmd = cmdToSend || input;
    if (!cmd.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: cmd }]);
    if (!cmdToSend) setInput('');
    setLoading(true);

    try {
      const res = await simulateBotCommand(cmd, telegramId);
      if (res.botReply) {
        setMessages(prev => [
          ...prev,
          { sender: 'bot', text: res.botReply, inlineKeyboard: res.inlineKeyboard }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-md w-full h-[85vh] sm:h-[650px] flex flex-col shadow-2xl overflow-hidden">
        {/* Simulator Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                Telegram Bot API Gateway
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </h3>
              <p className="text-[10px] text-slate-400">User ID: {telegramId} | @EarnAdsOfficialBot</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                }`}
              >
                <div className="whitespace-pre-line font-sans">{m.text}</div>

                {/* Render Telegram Inline Keyboard Buttons */}
                {m.inlineKeyboard && m.inlineKeyboard.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    {m.inlineKeyboard.map((row: any[], rIdx: number) => (
                      <div key={rIdx} className="flex gap-1.5">
                        {row.map((btn: any, bIdx: number) => (
                          <button
                            key={bIdx}
                            onClick={() => {
                              if (btn.callback_data) {
                                handleSend(btn.callback_data);
                              } else {
                                onClose();
                              }
                            }}
                            className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-[10px] font-bold text-cyan-300 text-center truncate transition-colors"
                          >
                            {btn.text}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 animate-pulse">
                Bot is typing...
              </div>
            </div>
          )}
        </div>

        {/* Command Controls & Input */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
          {/* Quick Command Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
            <button
              onClick={() => handleSend('/start')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold border border-slate-700 shrink-0"
            >
              /start
            </button>
            <button
              onClick={() => handleSend('balance')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold border border-slate-700 shrink-0"
            >
              /balance
            </button>
            <button
              onClick={() => handleSend('refer')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold border border-slate-700 shrink-0"
            >
              /refer
            </button>
            <button
              onClick={() => handleSend('/start ref_99111')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 font-bold border border-slate-700 shrink-0"
            >
              Deep Link Test
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Send bot command (/start, /balance)..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
            />
            <button
              onClick={() => handleSend()}
              className="p-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
