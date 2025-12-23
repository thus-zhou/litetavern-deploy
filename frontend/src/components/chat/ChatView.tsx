import React, { useEffect, useRef } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useRuntimeStore } from '../../store/runtime';
import { useCharacterStore } from '../../store/character';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import type { Message } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Loader2 } from 'lucide-react';

export const ChatView: React.FC = () => {
  const { messages, isTyping } = useRuntimeStore();
  const { getActiveCharacter } = useCharacterStore();
  const activeChar = getActiveCharacter();
  
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        align: 'end',
        behavior: 'smooth'
      });
    }
  }, [messages.length, messages[messages.length - 1]?.content]);

  return (
    <div className="flex-1 h-full relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />

      <Virtuoso
        ref={virtuosoRef}
        style={{ height: '100%' }}
        data={messages}
        followOutput={'auto'}
        atBottomThreshold={60}
        initialTopMostItemIndex={messages.length - 1}
        components={{
          Footer: () => <div className="h-32" /> 
        }}
        itemContent={(_index: number, msg: Message) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={clsx(
              "flex w-full px-4 py-6 hover:bg-slate-800/30 transition-colors group",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            {/* Assistant Avatar */}
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full overflow-hidden mr-3 mt-1 shadow-lg ring-1 ring-white/10 shrink-0 bg-slate-800 flex items-center justify-center">
                 {activeChar?.avatar ? (
                   <img src={activeChar.avatar} alt="Bot" className="w-full h-full object-cover" />
                 ) : (
                   <Bot size={18} className="text-blue-400" />
                 )}
              </div>
            )}

            <div className={clsx(
              "max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-base leading-relaxed shadow-lg backdrop-blur-sm",
              msg.role === 'user' 
                ? "bg-blue-600 text-white rounded-br-none bg-gradient-to-br from-blue-600 to-blue-700" 
                : "bg-slate-800/80 text-slate-100 rounded-bl-none border border-slate-700/50"
            )}>
              {/* Markdown Rendering */}
              <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:rounded-lg max-w-none break-words">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({node, ...props}) => <img {...props} className="rounded-lg shadow-md max-w-full h-auto mt-2 mb-2 border border-slate-700" loading="lazy" />,
                    p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />,
                    a: ({node, ...props}) => <a {...props} className="text-blue-300 hover:underline" target="_blank" rel="noreferrer" />,
                    code: ({node, ...props}) => <code {...props} className="bg-slate-900/50 px-1 py-0.5 rounded text-sm font-mono" />,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* User Avatar (Optional) */}
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full overflow-hidden ml-3 mt-1 shadow-lg ring-1 ring-white/10 shrink-0 bg-slate-700 flex items-center justify-center">
                <User size={18} className="text-slate-300" />
              </div>
            )}
          </motion.div>
        )}
      />
      
      {/* Enhanced Typing Indicator */}
      <AnimatePresence>
        {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-4 left-14 z-20"
          >
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700/50 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-xl flex items-center gap-3">
              <Loader2 className="animate-spin text-blue-400" size={16} />
              <div className="flex gap-1 h-2 items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
