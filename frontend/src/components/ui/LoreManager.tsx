import React from 'react';
import { X, BookOpen, Save } from 'lucide-react';
import { useSettingsStore } from '../../store/settings';

export const LoreManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { globalLore, setGlobalLore } = useSettingsStore();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-200">World Info / Lore</h2>
              <p className="text-xs text-slate-500">Global settings shared across all chats</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                Global Lore
              </label>
              <p className="text-sm text-slate-400 mb-2">
                This content will be appended to the system prompt for <b>every character</b>. 
                Use this for world rules, formatting instructions, or shared knowledge.
              </p>
              <textarea 
                className="w-full h-96 bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-300 font-mono text-sm leading-relaxed outline-none focus:border-purple-500 resize-none"
                value={globalLore || ""}
                onChange={(e) => setGlobalLore(e.target.value)}
                placeholder="e.g. The year is 2077. The world is ruled by mega-corporations..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-purple-900/20"
          >
            <Save size={18} />
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
