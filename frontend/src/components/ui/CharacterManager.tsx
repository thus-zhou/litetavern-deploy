import React, { useState, useRef } from 'react';
import { X, Plus, User, Edit2, Trash2, Check, MessageSquare } from 'lucide-react';
import { importCharacter } from '../../lib/importer';
import type { Character } from '../../store/character';
import { useCharacterStore } from '../../store/character';
import { useRuntimeStore } from '../../store/runtime';
import { useSettingsStore } from '../../store/settings';
import { translations } from '../../lib/i18n';
import clsx from 'clsx';

export const CharacterManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { characters, activeCharacterId, setActiveCharacter, addCharacter, updateCharacter, deleteCharacter } = useCharacterStore();
  const { clearHistory } = useRuntimeStore();
  const { language } = useSettingsStore();
  const t = translations[language];

  const [selectedId, setSelectedId] = useState<string>(activeCharacterId || characters[0]?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedChar = characters.find(c => c.id === selectedId) || characters[0];

  const handleImport = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const file = files[0];
      const charData = await importCharacter(file);
      
      const newChar: Character = {
        id: charData.meta.id,
        name: charData.meta.name,
        avatar: charData.meta.avatar,
        description: charData.persona.description || "No description",
        systemPrompt: charData.system.system_prompt || charData.persona.description || "You are a helpful assistant.",
        firstMessage: charData.persona.first_message,
        scenario: charData.persona.scenario,
        personality: charData.persona.personality,
        mesExample: charData.persona.example_dialogue,
        tags: charData.meta.tags
      };
      
      addCharacter(newChar);
      setActiveCharacter(newChar.id);
      setSelectedId(newChar.id);
      clearHistory();
    } catch (e) {
      console.error(e);
      alert(t.character.importFail);
    }
  };

  const handleCreate = () => {
    const newChar: Character = {
      id: crypto.randomUUID(),
      name: t.character.newChar,
      description: t.character.newDesc,
      systemPrompt: "You are a helpful assistant.",
      firstMessage: "Hello!",
      tags: [],
      scenario: "",
      personality: ""
    };
    addCharacter(newChar);
    setSelectedId(newChar.id);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t.character.deleteConfirm)) {
      deleteCharacter(id);
      if (selectedId === id) {
        setSelectedId(characters[0]?.id || 'default');
      }
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setActiveCharacter(id);
    clearHistory();
    // onClose(); // Optional: Close on select? Maybe not.
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl relative overflow-hidden flex flex-col md:flex-row">
        
        {/* Sidebar List */}
        <div className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="font-bold text-slate-200">{t.character.title}</h2>
            <button onClick={handleCreate} className="p-2 hover:bg-slate-800 rounded-lg text-blue-400">
              <Plus size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {characters.map(char => (
              <button
                key={char.id}
                onClick={() => setSelectedId(char.id)}
                className={clsx(
                  "w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left",
                  selectedId === char.id ? "bg-blue-600/20 text-blue-100 border border-blue-500/30" : "hover:bg-slate-800 text-slate-400"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {char.avatar ? (
                    <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{char.name}</div>
                  <div className="text-xs opacity-60 truncate">{char.description}</div>
                </div>
                {activeCharacterId === char.id && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-green-500 shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div 
            className="p-4 border-t border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-colors cursor-pointer text-center text-sm text-slate-500 hover:text-slate-300"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleImport(e.dataTransfer.files);
            }}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept=".json,.png" onChange={(e) => handleImport(e.target.files)} />
            {isDragging ? t.character.dropToImport : t.character.importBtn}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">{selectedChar?.name}</h2>
              {selectedId === activeCharacterId ? (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">{t.character.active}</span>
              ) : (
                <button 
                  onClick={() => handleSelect(selectedId)}
                  className="text-xs bg-slate-700 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                >
                  {t.character.setActive}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className={clsx("p-2 rounded-lg transition-colors", isEditing ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400")}
              >
                {isEditing ? <Check size={20} /> : <Edit2 size={20} />}
              </button>
              {characters.length > 1 && (
                <button onClick={() => handleDelete(selectedId)} className="p-2 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg transition-colors">
                  <Trash2 size={20} />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg ml-2">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex gap-6 items-start">
               <div className="w-24 h-24 rounded-2xl bg-slate-800 shrink-0 overflow-hidden shadow-lg">
                 {selectedChar?.avatar ? (
                   <img src={selectedChar.avatar} alt="" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-600">
                     <User size={40} />
                   </div>
                 )}
               </div>
               <div className="flex-1 space-y-4">
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">{t.character.name}</label>
                   {isEditing ? (
                     <input 
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                       value={selectedChar?.name}
                       onChange={(e) => updateCharacter(selectedId, { name: e.target.value })}
                     />
                   ) : (
                     <p className="text-lg font-medium text-slate-200">{selectedChar?.name}</p>
                   )}
                 </div>
                 
                 {/* Tags Editor */}
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tags</label>
                    {isEditing ? (
                        <input 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 text-sm"
                            placeholder="e.g. Anime, Assistant, Sci-Fi"
                            value={selectedChar?.tags?.join(', ') || ''}
                            onChange={(e) => updateCharacter(selectedId, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                        />
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {selectedChar?.tags?.map((tag, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded bg-slate-800 text-blue-300 border border-slate-700">
                                    {tag}
                                </span>
                            ))}
                            {!selectedChar?.tags?.length && <span className="text-slate-500 text-sm italic">No tags</span>}
                        </div>
                    )}
                 </div>

                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">{t.character.description}</label>
                   {isEditing ? (
                     <input 
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                       value={selectedChar?.description}
                       onChange={(e) => updateCharacter(selectedId, { description: e.target.value })}
                     />
                   ) : (
                     <p className="text-slate-400">{selectedChar?.description}</p>
                   )}
                 </div>
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <MessageSquare size={14} /> {t.character.persona}
              </label>
              {isEditing ? (
                <textarea 
                  className="w-full h-40 bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-300 font-mono text-sm leading-relaxed outline-none focus:border-blue-500 resize-none"
                  value={selectedChar?.systemPrompt}
                  onChange={(e) => updateCharacter(selectedId, { systemPrompt: e.target.value })}
                  placeholder="Main personality and behavior instructions..."
                />
              ) : (
                <div className="w-full h-40 bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-slate-400 font-mono text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap">
                  {selectedChar?.systemPrompt}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Scenario / Current Events</label>
                    {isEditing ? (
                        <textarea 
                        className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-300 text-sm resize-none"
                        value={selectedChar?.scenario || ''}
                        onChange={(e) => updateCharacter(selectedId, { scenario: e.target.value })}
                        placeholder="Current situation, location, or context..."
                        />
                    ) : (
                        <div className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-400 text-sm overflow-y-auto whitespace-pre-wrap">
                        {selectedChar?.scenario || <span className="italic opacity-50">No scenario defined.</span>}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Personality / Worldview</label>
                    {isEditing ? (
                        <textarea 
                        className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-300 text-sm resize-none"
                        value={selectedChar?.personality || ''}
                        onChange={(e) => updateCharacter(selectedId, { personality: e.target.value })}
                        placeholder="Detailed personality traits or world background..."
                        />
                    ) : (
                        <div className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-400 text-sm overflow-y-auto whitespace-pre-wrap">
                        {selectedChar?.personality || <span className="italic opacity-50">No personality details.</span>}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Example Dialogue</label>
                {isEditing ? (
                    <textarea 
                        className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-300 font-mono text-xs resize-none"
                        value={selectedChar?.mesExample || ''}
                        onChange={(e) => updateCharacter(selectedId, { mesExample: e.target.value })}
                        placeholder="<START>&#10;{{user}}: Hello&#10;{{char}}: Hi there!"
                    />
                ) : (
                    <div className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-500 font-mono text-xs overflow-y-auto whitespace-pre-wrap">
                        {selectedChar?.mesExample || <span className="italic opacity-50">No example dialogue.</span>}
                    </div>
                )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">{t.character.firstMessage}</label>
               {isEditing ? (
                 <textarea 
                   className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300 text-sm"
                   value={selectedChar?.firstMessage || ""}
                   onChange={(e) => updateCharacter(selectedId, { firstMessage: e.target.value })}
                 />
               ) : (
                 <p className="text-slate-400 italic">"{selectedChar?.firstMessage}"</p>
               )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
