import React, { useState, useEffect } from 'react';
import { X, Save, ShieldAlert, Globe, Type, Wifi, Zap } from 'lucide-react';
import { useSettingsStore } from '../../store/settings';
import { useAuthStore } from '../../store/auth';
import { translations, fonts } from '../../lib/i18n';
import clsx from 'clsx';
import QRCode from 'react-qr-code';

export const SettingsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { 
    model, setModel, 
    jailbreak, setJailbreak, 
    availableModels, setAvailableModels,
    language, setLanguage,
    fontFamily, setFontFamily
  } = useSettingsStore();
  
  const { user } = useAuthStore();
  const t = translations[language];

  const [localModel, setLocalModel] = useState(model);
  const [localJailbreak, setLocalJailbreak] = useState(jailbreak);
  const [localLanguage, setLocalLanguage] = useState(language);
  const [localFont, setLocalFont] = useState(fontFamily);
  
  const [status, setStatus] = useState<string | null>(null);

  // Tunnel State
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [tunnelStatus, setTunnelStatus] = useState<string>("connecting");

  useEffect(() => {
    // Fetch Models
    fetch('/api/v1/models').then(r => r.json()).then(data => {
        if (data.data) {
            setAvailableModels(data.data);
            // If current model not in list, select first
            if (data.data.length > 0) {
                 // Check if localModel is in data
                 const exists = data.data.find((m: any) => m.id === localModel);
                 if (!exists) setLocalModel(data.data[0].id);
            }
        }
    });

    // Fetch tunnel status
    const fetchTunnel = async () => {
      try {
        const res = await fetch("/api/system/tunnel");
        const data = await res.json();
        if (data.url) {
          setTunnelUrl(data.url);
          setTunnelStatus("connected");
        } else {
          setTunnelStatus("connecting");
        }
      } catch (e) {
        setTunnelStatus("error");
      }
    };
    fetchTunnel();
    const interval = setInterval(fetchTunnel, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    setModel(localModel);
    setJailbreak(localJailbreak);
    setLanguage(localLanguage);
    setFontFamily(localFont);
    
    setStatus(t.settings.saved);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const selectedModelData = availableModels.find((m: any) => m.id === localModel);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Zap size={20} className="text-yellow-500" />
            Settings
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Power Balance Display */}
          <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-700/30 p-4 rounded-xl flex justify-between items-center">
             <div>
                 <div className="text-xs font-bold text-yellow-500 uppercase">Power Balance</div>
                 <div className="text-2xl font-bold text-white flex items-center gap-1">
                     <Zap size={20} className="text-yellow-400 fill-yellow-400" />
                     {user?.power_balance || 0}
                 </div>
             </div>
             <div className="text-right">
                 <div className="text-xs text-slate-400">Current Model Cost</div>
                 <div className="text-lg font-mono text-slate-200">
                     {selectedModelData ? selectedModelData.power_cost : '-'} <span className="text-xs text-slate-500">/ msg</span>
                 </div>
             </div>
          </div>

          {/* Model Selection */}
           <div className="space-y-2">
             <label className="text-sm font-medium text-slate-300">{t.settings.model}</label>
             <div className="relative">
               <select 
                 value={localModel}
                 onChange={(e) => setLocalModel(e.target.value)}
                 className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm appearance-none"
               >
                 {availableModels.map((m: any) => (
                     <option key={m.id} value={m.id}>
                         {m.name} ({m.provider}) - {m.power_cost} Power
                     </option>
                 ))}
               </select>
               <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                 ▼
               </div>
             </div>
             <p className="text-xs text-slate-500">
                 Only admins can configure API keys and endpoints.
             </p>
           </div>

          <div className="h-px bg-slate-800 my-2" />

          {/* Appearance Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t.settings.appearance}</h3>
            
            {/* Language */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Globe size={16} /> {t.settings.language}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLocalLanguage('en')}
                  className={clsx(
                    "p-2 rounded-xl text-sm font-medium transition-all border",
                    localLanguage === 'en' 
                      ? "bg-blue-600 border-blue-500 text-white" 
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  English
                </button>
                <button
                  onClick={() => setLocalLanguage('zh')}
                  className={clsx(
                    "p-2 rounded-xl text-sm font-medium transition-all border",
                    localLanguage === 'zh' 
                      ? "bg-blue-600 border-blue-500 text-white" 
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  简体中文
                </button>
              </div>
            </div>

            {/* Font */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Type size={16} /> {t.settings.font}
              </label>
              <select 
                value={localFont}
                onChange={(e) => setLocalFont(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm appearance-none"
                style={{ fontFamily: localFont }}
              >
                {fonts.map(f => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-px bg-slate-800 my-2" />
          
          {/* Remote Access Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Wifi size={14} /> {t.remote.title}
            </h3>
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
              {tunnelStatus === 'connected' && tunnelUrl ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="bg-white p-2 rounded-lg w-fit h-fit">
                    <QRCode value={tunnelUrl} size={100} />
                  </div>
                  <div className="flex-1 space-y-2">
                      <a href={tunnelUrl} target="_blank" className="text-blue-400 text-sm font-mono break-all hover:underline">{tunnelUrl}</a>
                      <p className="text-xs text-slate-500">Scan to access on mobile.</p>
                  </div>
                </div>
              ) : (
                  <p className="text-slate-500 text-sm">Connecting...</p>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-800 my-2" />

          {/* Jailbreak Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className={clsx("p-2 rounded-lg", localJailbreak ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-400")}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="font-medium text-sm">{t.settings.jailbreak}</p>
                <p className="text-xs text-slate-500">{t.settings.jailbreakDesc}</p>
              </div>
            </div>
            <button 
              onClick={() => setLocalJailbreak(!localJailbreak)}
              className={clsx(
                "w-12 h-6 rounded-full transition-colors relative",
                localJailbreak ? "bg-red-600" : "bg-slate-700"
              )}
            >
              <div className={clsx(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                localJailbreak ? "left-7" : "left-1"
              )} />
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex flex-col gap-3">
          {status && (
            <div className="text-center text-sm font-medium text-green-400 animate-in fade-in p-2 rounded bg-slate-800/50">
              {status}
            </div>
          )}
          
          <button 
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
          >
            <Save size={18} />
            {t.settings.save}
          </button>
        </div>

      </div>
    </div>
  );
};
