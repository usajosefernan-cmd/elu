import React, { useRef, useEffect, useState } from 'react';
import { 
  Cpu, 
  Settings, 
  Activity, 
  Bot, 
  Zap, 
  Send, 
  Lock
} from 'lucide-react';
import { Message } from '../types';

interface ChatPanelProps {
  messages: Message[];
  inputValue: string;
  setInputValue: (val: string) => void;
  onSendMessage: () => void;
  isTyping: boolean;
  thinkingLog: string[];
  metrics: { cpu: number; ram: number; net: string };
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  inputValue,
  setInputValue,
  onSendMessage,
  isTyping,
  thinkingLog,
  metrics
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingLog]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      // Limit width between 300px and 800px
      const newWidth = Math.max(300, Math.min(800, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto'; 
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div 
      style={{ width }}
      className="flex flex-col border-r border-slate-800 bg-[#0a0a0a] relative z-20 shadow-2xl shadow-black h-full shrink-0 group"
    >
      {/* RESIZER HANDLE */}
      <div 
         className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize z-50 flex justify-center hover:bg-cyan-500/5 transition-colors"
         onMouseDown={() => setIsResizing(true)}
      >
          {/* Visual line indicating resize area */}
          <div className={`w-[1px] h-full transition-colors ${isResizing ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-transparent group-hover:bg-cyan-500/30'}`}></div>
      </div>

      {/* PRO HEADER */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-[#080808]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center animate-pulse">
            <Cpu size={18} className="text-cyan-400" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-xs font-bold text-slate-100 tracking-[0.2em] uppercase whitespace-nowrap">Gemini<span className="text-cyan-500">_OS</span></h1>
            <div className="flex items-center gap-2 text-[9px] text-slate-500 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              NÚCLEO: EN LÍNEA | v3.0.PRO
            </div>
          </div>
        </div>
        <Settings size={16} className="text-slate-600 hover:text-cyan-400 cursor-pointer transition-colors shrink-0" />
      </div>

      {/* SYSTEM STATS WIDGET */}
      <div className="p-4 grid grid-cols-3 gap-2 border-b border-slate-800 bg-[#0c0c0c]/50">
        <div className="bg-black/40 border border-slate-800 p-2 rounded flex flex-col items-center">
          <span className="text-[9px] text-slate-500 uppercase whitespace-nowrap">Carga CPU</span>
          <div className="flex items-end gap-1 h-4 mt-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-1 bg-cyan-600/50 ${i < metrics.cpu / 20 ? 'h-full bg-cyan-400' : 'h-1'}`}></div>
            ))}
          </div>
          <span className="text-[10px] text-cyan-400 mt-1">{metrics.cpu}%</span>
        </div>
        <div className="bg-black/40 border border-slate-800 p-2 rounded flex flex-col items-center">
          <span className="text-[9px] text-slate-500 uppercase whitespace-nowrap">Tokens/s</span>
          <span className="text-[10px] text-purple-400 mt-2 font-bold">{metrics.ram} K</span>
          <span className="text-[8px] text-slate-600 whitespace-nowrap">Vent. Contexto</span>
        </div>
        <div className="bg-black/40 border border-slate-800 p-2 rounded flex flex-col items-center">
          <span className="text-[9px] text-slate-500 uppercase whitespace-nowrap">E/S Red</span>
          <Activity size={14} className="text-emerald-500 mt-1" />
          <span className="text-[9px] text-slate-400 mt-1">{metrics.net} GB/s</span>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar relative">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`relative z-10 flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            
            {/* Message Meta */}
            <div className="flex items-center gap-2 text-[9px] text-slate-600 font-mono px-1">
              <span>{msg.role === 'ai' ? 'SIS.ROOT' : msg.role === 'system' ? 'KERNEL.EVENTO' : 'USR.ADMIN'}</span>
              <span>::</span>
              <span>{msg.timestamp}</span>
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[95%] p-4 rounded-sm border backdrop-blur-sm ${
              msg.role === 'ai' 
                ? 'bg-slate-900/80 border-slate-700 text-slate-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]' 
                : msg.role === 'system'
                ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-500 w-full'
                : 'bg-cyan-950/30 border-cyan-800/50 text-cyan-100'
            }`}>
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {msg.role === 'ai' && <Bot size={14} className="mb-2 text-cyan-500" />}
                {msg.role === 'system' && <Zap size={14} className="mb-2 text-yellow-500" />}
                {msg.text}
              </div>
              
              {/* Stats Footer for AI */}
              {msg.role === 'ai' && msg.stats && (
                <div className="mt-3 pt-2 border-t border-white/5 flex flex-wrap gap-3 text-[9px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1"><Zap size={8} /> {msg.stats.tokens} tokens</span>
                  <span className="flex items-center gap-1"><Activity size={8} /> {msg.stats.latency}</span>
                  <span className="flex items-center gap-1"><Cpu size={8} /> {msg.stats.model}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Thinking Log (The "Matrix" effect) */}
        {isTyping && (
          <div className="ml-2 border-l-2 border-purple-500/50 pl-4 py-2 my-2">
            {thinkingLog.map((log, i) => (
              <div key={i} className="text-[10px] font-mono text-purple-400/80 animate-pulse flex items-center gap-2">
                 <span className="text-purple-600">{'>'}</span> {log}
              </div>
            ))}
            <div className="text-[10px] font-mono text-purple-500 animate-pulse mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
              Pensando...
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* INPUT COMMAND CENTER */}
      <div className="p-4 bg-[#080808] border-t border-slate-800">
         <div className="flex items-center justify-between mb-2 px-1">
           <div className="flex gap-2">
             <button className="text-[9px] bg-slate-800 px-2 py-1 rounded text-slate-400 hover:text-white border border-slate-700 transition-colors">Auditar</button>
             <button className="text-[9px] bg-slate-800 px-2 py-1 rounded text-slate-400 hover:text-white border border-slate-700 transition-colors">Refactorizar</button>
             <button className="text-[9px] bg-slate-800 px-2 py-1 rounded text-slate-400 hover:text-white border border-slate-700 transition-colors">Depurar</button>
           </div>
           <span className="text-[9px] text-emerald-500 flex items-center gap-1 whitespace-nowrap"><Lock size={8}/> CANAL SEGURO</span>
         </div>
         
         <div className="relative group">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            placeholder={isTyping ? "Gemini está implementando..." : "// Introduce decisión de arquitectura..."}
            className="w-full bg-black border border-slate-700 rounded p-3 pr-10 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-900 transition-all font-mono placeholder:text-slate-700 h-20 resize-none disabled:opacity-50 disabled:cursor-wait"
          />
          <button 
            onClick={onSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 bottom-2 p-1.5 bg-cyan-900/20 hover:bg-cyan-600 text-cyan-400 hover:text-white rounded transition-all disabled:opacity-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;