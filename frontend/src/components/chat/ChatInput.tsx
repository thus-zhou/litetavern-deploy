import React, { useState } from 'react';
import { useRuntimeStore } from '../../store/runtime';
import { useSettingsStore } from '../../store/settings';
import { translations } from '../../lib/i18n';
import { Send } from 'lucide-react';

export const ChatInput: React.FC = () => {
  const [text, setText] = useState('');
  const { addMessage, generateResponse, isTyping } = useRuntimeStore();
  const { language } = useSettingsStore();
  const t = translations[language];

  const handleSend = () => {
    if (!text.trim() || isTyping) return;
    
    addMessage({ role: 'user', content: text });
    setText('');
    generateResponse();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="absolute bottom-0 left-0 w-full p-4 pb-safe-area-bottom pointer-events-none z-10">
      <div className="max-w-4xl mx-auto flex gap-3 items-end pointer-events-auto">
        <div className="flex-1 glass-panel rounded-[24px] p-1 flex items-end shadow-2xl ring-1 ring-white/10 transition-all focus-within:ring-blue-500/50 focus-within:bg-slate-900/90">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.typeMessage}
            className="w-full bg-transparent text-slate-100 px-4 py-3.5 max-h-32 min-h-[48px] resize-none focus:outline-none placeholder:text-slate-500 text-base"
            rows={1}
            style={{ height: 'auto', minHeight: '48px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
        </div>
        <button 
          onClick={handleSend}
          disabled={!text.trim() || isTyping}
          className="p-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-blue-600 text-white rounded-full transition-all shadow-lg shadow-blue-900/30 ring-1 ring-blue-400/20"
        >
          <Send size={22} className={text.trim() && !isTyping ? "translate-x-0.5 translate-y-[-1px]" : ""} />
        </button>
      </div>
    </div>
  );
};
